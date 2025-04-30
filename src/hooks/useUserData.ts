import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, checkConnection, isWebContainerEnvironment } from '../utils/supabase';

export function useUserData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DB_Profile>(null);
  const [properties, setProperties] = useState([]);
  const [marketplaceProperties, setMarketplaceProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const fetchAttempted = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const subscriptions = useRef<{ unsubscribe: () => void }[]>([]);
  const isWebContainer = useRef(isWebContainerEnvironment());

  // Check connection status before fetching data
  const verifyConnection = async () => {
    if (isWebContainer.current && import.meta.env.DEV) {
      console.info('Running in WebContainer environment - attempting to verify Supabase connection');
    }

    const connectionStatus = await checkConnection();

    if (!connectionStatus.connected) {
      if (isWebContainer.current && connectionStatus.error?.includes('localhost')) {
        throw new Error(
            'WebContainer cannot connect to localhost Supabase. ' +
            'Please update your .env file with a remote Supabase instance URL and credentials.'
        );
      }

      throw new Error(connectionStatus.error || 'Failed to connect to Supabase');
    }

    return true;
  };

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (fetchAttempted.current && !user?.id) {
      setLoading(false);
      return;
    }

    fetchAttempted.current = true;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      setLoading(true);
      setError(null);

      await verifyConnection();

      // Fetch profile
      let profile = null;
      const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
      console.log('profileData', profileData)
      console.log('profileError', profileError)

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: user.id,
                email: user.email || '',
                 role: 'agent', // Default role
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();

          if (insertError) throw insertError;

          profile = newProfile;
        } else {
          throw profileError;
        }
      } else {
        profile = profileData;
      }

      setProfile(profile);

      // Fetch properties
      const { data: ownedProperties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      const transformedOwnedProperties = (ownedProperties || []).map(p => ({
        ...p,
        contractType: p.contract_type,
        furnishingStatus: p.furnishing_status,
        completionStatus: p.completion_status,
        floorPlanImage: p.floor_plan_image,
        parkingAvailable: p.parking_available || false,
        agentId: p.agent_id,
        source: 'direct' as const
      }));

      setProperties(transformedOwnedProperties);


      console.log('profile.role', profile?.role)

      // Fetch marketplace properties (Agent-specific)
      if (profile?.role === 'agent') {
        const { data: marketplaceProperties, error: marketplaceError } = await supabase
            .from('agent_properties')
            .select(`
            property_id,
            status,
            property:property_id(*)
          `)
            .eq('agent_id', user.id)
            .eq('status', 'active');

        if (marketplaceError) throw marketplaceError;

        const transformedMarketplaceProperties = (marketplaceProperties || []).map(mp => ({
          ...mp.property,
          contractType: mp.property.contract_type,
          furnishingStatus: mp.property.furnishing_status,
          completionStatus: mp.property.completion_status,
          floorPlanImage: mp.property.floor_plan_image,
          parkingAvailable: mp.property.parking_available || false,
          agentId: mp.property.agent_id,
          source: 'marketplace' as const
        }));

        setMarketplaceProperties(transformedMarketplaceProperties);
        setProperties([...transformedOwnedProperties, ...transformedMarketplaceProperties]);

      }

      // Fetch reviews (Agent-specific)
      if (profile?.role === 'agent') {
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select(`
            *,
            reviewer:profiles!reviews_reviewer_id_fkey(
              full_name,
              avatar_url
            )
          `)
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviews || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }

      subscriptions.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptions.current = [];
    };
  }, [fetchUserData]);

  return {
    loading,
    error,
    profile,
    properties,
    marketplaceProperties,
    reviews,
    refresh: fetchUserData
  };
}
