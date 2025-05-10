import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAuth } from '../../hooks/useRoleAuth';
import ProjectInfoForm from './project-form/ProjectInfoForm';
import { UnitGroupRepeater } from './project-form/UnitGroupRepeater';
import { toast } from 'react-hot-toast';
import {CamelizeKeys, UnitType} from "../../types";
import {convertCamelToSnake, convertSnakeToCamel} from "../../utils/helpers.ts";

interface ProjectFormData {
  title: string;
  description: string | null;
  location: string;
  lat?: null | number;
    lng?: null | number;
  handoverDate: string;
  paymentPlan: string;
  brochureFile?: File;
  brochureUrl?: string;
  imageFiles: File[] | string[];
  unitGroups: CamelizeKeys<DB_Unit_Types>[]
  unitGroupsToDelete: CamelizeKeys<DB_Unit_Types>[]
}

interface ProjectProps {
  projectId?: string;
}

const DEFAULT_UNIT_TYPE: UnitType = {
  title: '',
  developerId: '',
  projectId: '',
  images: [],
  floorPlanImage: '',
  description: '',
  type: 'Apartment',
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  furnishingStatus: null,
  completionStatus: 'Off-Plan',
  sqft: 0,
  amenities: [],
  parkingAvailable: false,
  videos: [],
  createdAt: null,
  floorRange: null,
  notes: null,
  priceRange: null,
  sizeRange: null,
  status: '',
  unitsAvailable: 0,
  updatedAt: null,
  contractType: 'Sale',
  id: '',
  lat: null,
  lng: null,
}

const defaultFormValues: ProjectFormData = {
  title: '',
  description: '',
  location: '',
  handoverDate: '',
  paymentPlan: '40/60',
  imageFiles: [],
  unitGroups: [DEFAULT_UNIT_TYPE],
  unitGroupsToDelete: [],
};

const DeveloperProjectForm: React.FC<ProjectProps> = ({ projectId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useRoleAuth();
  const { handleSubmit, watch, setValue } = useForm<ProjectFormData>({
    defaultValues: defaultFormValues
  });

  const projectData = watch();

  useEffect(() => {
    if (projectId) {
      setIsEditMode(true);
      setCurrentProjectId(projectId);
      fetchProjectData(projectId);
    }
  }, [projectId]);

  const fetchUnitTypes = async (projectId: string) => {
    try {
      const { data: unitTypes, error } = await supabase
        .from('unit_types')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setValue('unitGroups', unitTypes?.map(unitType => convertSnakeToCamel(unitType)));
    } catch (error) {
      console.error('Error fetching unit types:', error);
      toast.error('Failed to load unit types');
      return [];
    }
  }

  const fetchProjectData = async (id: string) => {
    try {
      setIsLoading(true);

      const { data: project, error: projectError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      setValue('title', project.title || '');
      setValue('description', project.description || '');
      setValue('location', project.location || '');
      setValue('handoverDate', project.handover_date || '');
      setValue('paymentPlan', project.payment_plan || '40/60');
      setValue('imageFiles', project.images || []); // Pre-fill images from database
      setValue('brochureUrl', project.brochure_url || ''); // Pre-fill brochure URL
      setValue('brochureFile', undefined); // Ensure no file is set
      await fetchUnitTypes(id); // Fetch unit types for the project

    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'developer') {
        throw new Error('Only developers can create projects');
      }

      setIsSubmitting(true);

      // Handle brochure upload if a new file is provided
      let brochureUrl = data.brochureUrl || null;
      if (data.brochureFile) {
        brochureUrl = await uploadBrochure(data.brochureFile);
      }

      // Common properties data
      const propertyData = {
        title: data.title,
        description: data.description,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        handover_date: data.handoverDate,
        payment_plan: data.paymentPlan,
        type: 'Apartment',
        images: data.imageFiles.filter(file => typeof file === 'string'), // Only include URLs for pre-filled images
        brochure_url: brochureUrl, // Use the uploaded brochure URL
        contract_type: 'Sale',
        price: 0, // Placeholder price
        creator_id: user.id,
        creator_type: role, // Use the actual role from useRoleAuth
        agent_id: user.id, // For developers, agent_id is the same as creator_id
      } as DB_Properties;

      // Handle project images if provided
      if (data.imageFiles && data.imageFiles.length > 0) {
        const imageUrls = await uploadProjectImages(data.imageFiles.filter(file => file instanceof File) as File[]);
        propertyData.images = propertyData.images.concat(imageUrls);
      }

      if (isEditMode && currentProjectId) {
        // Update existing project
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', currentProjectId)
          .eq('creator_type', role) // Use the actual role
          .eq('creator_id', user.id);

        if (updateError) throw updateError;

        // Process unit types
        await processUnitTypes(data.unitGroups, currentProjectId, user.id, data);
        // Delete unit types if any are marked for deletion
        if (projectData.unitGroupsToDelete.length > 0) {
          await handleDeleteUnitTypes()
        }
      } else {
        // Create new project
        const { data: newProject, error: createError } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (createError) throw createError;
        // Process unit types
        await processUnitTypes(data.unitGroups, newProject.id, user.id, data);

      }

      toast.success(isEditMode ? 'Project updated successfully' : 'Project created successfully');
      navigate('/developer-dashboard');
    } catch (error) {
      console.error(isEditMode ? 'Error updating project:' : 'Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadBrochure = async (file: File): Promise<string> => {
    // Check file type - allow PDF files
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a PDF file');
    }

    // Check file size (max 120MB)
    const maxSize = 120 * 1024 * 1024; // 120MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size must be less than 120MB');
    }

    // Get auth headers
    const { data: { session } } = await supabase.auth.getSession();
    const authHeaders = {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${session?.access_token}`
    };

    // Upload brochure file
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `properties/${crypto.randomUUID()}/brochures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('properties')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        headers: authHeaders
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadProjectImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];

    // Get auth headers once for all uploads
    const { data: { session } } = await supabase.auth.getSession();
    const authHeaders = {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${session?.access_token}`
    };

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Check file size (max 120MB)
      if (file.size > 120 * 1024 * 1024) {
        continue; // Skip files that are too large
      }

      try {
        // Upload image
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `properties/${crypto.randomUUID()}/images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
            headers: authHeaders
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue; // Skip this image but continue with others
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue with next image even if one fails
      }
    }

    return imageUrls;
  };

  const processUnitTypes = async (unitGroups: UnitType[], projectId: string, developerId: string, projectData:ProjectFormData) => {
    // For each unit group
    for (const group of unitGroups) {
      // Format data for unit_types table
      const unitType = convertCamelToSnake(group);
      const unitTypeData = {
        ...unitType,
        project_id: projectId,
        developer_id: developerId,
        units_available: group.unitsAvailable,
        description: unitType.description || projectData.description,
        location: projectData.location,
        lat: projectData.lat,
        lng: projectData.lng,
        status: 'available',
      };

      if (isEditMode && group.id && group.id.length > 0) {
        // Update existing unit type
        const { error: updateError } = await supabase
          .from('unit_types')
          .update(unitTypeData)
          .eq('id', group.id)
          .eq('developer_id', developerId); // Ensure developer owns the unit type

        if (updateError) {
          console.error('Error updating unit type:', updateError);
        }
      } else {
        // Create new unit type
        const { error: insertError } = await supabase
          .from('unit_types')
          .insert({...unitTypeData, id: undefined});
        if (insertError) {
          console.error('Error creating unit type:', insertError);
        }
      }
    }
  };

    const handleDeleteUnitTypes = async () => {
        try {
          for (const unitGroupToDelete of projectData.unitGroupsToDelete) {
            const { error } = await supabase
                .from('unit_types')
                .delete()
                .eq('id', unitGroupToDelete.id)
                .eq('developer_id', user?.id || ''); // Ensure developer owns the unit type

            if (error) throw error;
          }
        } catch (error) {
          console.error('Error deleting unit type:', error);
        }
    };

    const onAddToDeletedUnitGroup = (unitType: UnitType) => {
        setValue('unitGroupsToDelete', [...projectData.unitGroupsToDelete, unitType]);
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : (
        <>
          <ProjectInfoForm
            projectData={projectData}
            onChange={(data) => {
              Object.entries(data).forEach(([key, value]) => {
                setValue(key as keyof ProjectFormData, value);
              });
            }}
          />
          <UnitGroupRepeater
            unitGroups={projectData.unitGroups}
            onChange={(groups) => setValue('unitGroups', groups)}
            onPrev={() => navigate(-1)}
            onSubmit={handleSubmit(onSubmit)}
            loading={isSubmitting}
            onAddToDeletedUnitGroup={onAddToDeletedUnitGroup}
          />
        </>
      )}
    </form>
  );
};

export default DeveloperProjectForm;
