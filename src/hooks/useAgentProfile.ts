import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Agent } from '../types';
import { useAgentServiceAreas } from './useAgentServiceAreas';
import { useAgentCertifications } from './useAgentCertifications';

export function useAgentProfile(slug: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  
  const { serviceAreas, loading: areasLoading } = useAgentServiceAreas(agent?.id);
  const { certifications, loading: certsLoading } = useAgentCertifications(agent?.id);

  useEffect(() => {
    let mounted = true;

    async function fetchAgentProfile() {
      try {
        if (!slug) {
          setLoading(false);
          return;
        }

        setError(null);

        // Fetch profile data with all related information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            created_properties:properties!properties_agent_id_fkey(count),
            marketplace_properties:agent_properties!agent_properties_agent_id_fkey(count),
            reviews:reviews!reviews_agent_id_fkey(
              *,
              reviewer:profiles!reviews_reviewer_id_fkey(
                full_name,
                avatar_url
              )
            )
          `)
          .eq('slug', slug)
          .eq('role', 'agent')
          .single();

        if (profileError) throw profileError;

        if (!profile) {
          throw new Error('Agent not found');
        }

        if (mounted) {
          // Calculate total properties by summing created and marketplace properties
          const totalProperties = (profile.created_properties?.count || 0) + 
                                (profile.marketplace_properties?.count || 0);

          setAgent({
            id: profile.id,
            name: profile.full_name || '',
            introduction: profile.introduction || '',
            photo: profile.avatar_url || '',
            agencyLogo: profile.agency_logo || '',
            agencyName: profile.agency_name || '',
            agencyWebsite: profile.agency_website || '',
            agencyEmail: profile.agency_email || '',
            agencyFormationDate: profile.agency_formation_date || '',
            agencyTeamSize: profile.agency_team_size || 0,
            verified: profile.verified || false,
            bio: profile.introduction || '',
            languages: profile.languages || [],
            specialties: profile.specialties || [],
            registrationNumber: profile.registration_number || '',
            whatsapp: profile.whatsapp || '',
            location: profile.location || '',
            experience: profile.experience || '',
            activeListings: totalProperties,
            reviews: profile.reviews || [],
            youtube: profile.youtube || '',
            facebook: profile.facebook || '',
            instagram: profile.instagram || '',
            linkedin: profile.linkedin || '',
            tiktok: profile.tiktok || '',
            x: profile.x || '',
            serviceAreas: serviceAreas,
            certifications: certifications,
            slug: profile.slug || ''
          });

          // Track page view
          await supabase.rpc('track_page_view', {
            p_profile_id: profile.id
          });
        }
      } catch (err) {
        console.error('Error fetching agent profile:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load agent profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAgentProfile();

    return () => {
      mounted = false;
    };
  }, [slug, serviceAreas, certifications]);

  return { 
    agent, 
    loading: loading || areasLoading || certsLoading, 
    error 
  };
}