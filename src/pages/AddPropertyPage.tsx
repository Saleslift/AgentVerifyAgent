import React, {useCallback, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAuth } from '../hooks/useRoleAuth';
import AgentPropertyForm from '../components/agent/AgentPropertyForm';
import AgencyPropertyForm from "../components/agency/AgencyPropertyForm.tsx";
import DeveloperPropertyForm from "../components/developer/DeveloperPropertyForm.tsx";
import {supabase} from "../utils/supabase.ts";
import {Property} from "../types";

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading } = useRoleAuth();
  const { slug } = useParams();

  const [property, setProperty] = React.useState<Property | null>(null);

  if (!user) {
    navigate('/signin');
    return null;
  }

  const fetchProperty = useCallback( async () => {
    try {
      if (!slug) return;

      const { data, error: fetchError } = await supabase
          .from('properties')
          .select(`
          *,
          agent:agent_id(
            full_name,
            avatar_url,
            agency_name,
            whatsapp,
            email
          )
        `)
          .eq('id', slug)
          .single();

      if (fetchError) throw fetchError;

      // Transform the data to match Property type
      const transformedData: Property = {
        ...data,
        contractType: data.contract_type,
        furnishingStatus: data.furnishing_status,
        completionStatus: data.completion_status,
        floorPlanImage: data.floor_plan_image,
        parkingAvailable: data.parking_available || false,
        agentId: data.agent_id
      };
      console.log('transformedData', transformedData)

      setProperty(transformedData);
    } catch (err) {
      console.error('Error fetching property:', err);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      console.log('Fetch property !!!!', slug)

      fetchProperty();
    }
  }, [slug, fetchProperty]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {role === 'agency' && (
                <AgencyPropertyForm
                    property={property}
                    agencyId={user.id}
                    onSuccess={() => navigate('/dashboard')}
                />
            )}
            {role === 'agent' && (
                <AgentPropertyForm
                  agentId={user.id}
                  onSuccess={() => navigate('/dashboard')}
            />)}
            {role === 'developer' && (
                <DeveloperPropertyForm
                    developerId={user.id}
                    onSuccess={() => navigate('/dashboard')}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
