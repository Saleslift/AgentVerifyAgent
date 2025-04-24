import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Certification } from '../types';

export function useAgentCertifications(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const fetchCertifications = useCallback(async () => {
    try {
      if (!agentId) {
        setCertifications([]);
        setLoading(false);
        return;
      }

      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agent_certifications')
        .select('*')
        .eq('agent_id', agentId)
        .order('is_rera', { ascending: false });

      if (fetchError) throw fetchError;
      setCertifications(data || []);
    } catch (err) {
      console.error('Error fetching certifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load certifications');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const uploadCertification = async (
    file: File,
    name: string,
    isRera: boolean = false,
    reraNumber?: string
  ) => {
    if (!agentId) return;

    try {
      // Validate file type
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Please upload a PDF, JPG, or PNG file');
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      // Check if RERA certificate exists when uploading a new one
      if (isRera) {
        const { data: existingRera } = await supabase
          .from('agent_certifications')
          .select('id')
          .eq('agent_id', agentId)
          .eq('is_rera', true)
          .single();

        if (existingRera) {
          throw new Error('RERA certificate already exists. Please remove the existing one first.');
        }

        if (!reraNumber?.trim()) {
          throw new Error('RERA number is required');
        }
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${agentId}/${crypto.randomUUID()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError){
        console.log('Error uploading file:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(fileName);

      const { data: newCertification, error: insertError } = await supabase
        .from('agent_certifications')
        .insert({
          agent_id: agentId,
          name,
          file_url: publicUrl,
          is_rera: isRera,
          rera_number: isRera ? reraNumber : null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state immediately
      setCertifications(prev => [newCertification, ...prev]);

      return newCertification;
    } catch (err) {
      console.error('Error uploading certification:', err);
      throw err;
    }
  };

  const removeCertification = async (id: string, fileUrl: string) => {
    if (!agentId) return;

    try {
      // Delete file from storage
      const urlParts = fileUrl.split('/');
      const filePath = `${agentId}/${urlParts[urlParts.length - 1]}`;

      const { error: deleteStorageError } = await supabase.storage
        .from('certifications')
        .remove([filePath]);

      if (deleteStorageError) throw deleteStorageError;

      // Delete record from database
      const { error: deleteRecordError } = await supabase
        .from('agent_certifications')
        .delete()
        .eq('id', id)
        .eq('agent_id', agentId);

      if (deleteRecordError) throw deleteRecordError;

      // Update local state immediately
      setCertifications(prev => prev.filter(cert => cert.id !== id));
    } catch (err) {
      console.error('Error removing certification:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCertifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('agent_certifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_certifications',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchCertifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId, fetchCertifications]);

  return {
    certifications,
    loading,
    error,
    uploadCertification,
    removeCertification
  };
}
