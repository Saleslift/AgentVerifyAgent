import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, checkConnection, isWebContainerEnvironment } from '../utils/supabase';

export function useUserData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [marketplaceProperties, setMarketplaceProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const fetchAttempted = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const subscriptions = useRef<{ unsubscribe: () => void }[]>([]);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // Base delay in milliseconds
  const isWebContainer = useRef(isWebContainerEnvironment());

  // Helper function to check if operation should continue
  const shouldContinue = (signal: AbortSignal) => {
    if (signal.aborted) {
      throw new Error('Operation cancelled');
    }
    return true;
  };

  // Helper function for exponential backoff
  const getRetryDelay = (attempt: number) => {
    return RETRY_DELAY * Math.pow(2, attempt);
  };

  // Check connection status before fetching data
  const verifyConnection = async () => {
    // Special handling for WebContainer environment
    if (isWebContainer.current && import.meta.env.DEV) {
      console.info('Running in WebContainer environment - attempting to verify Supabase connection');
    }
    
    const connectionStatus = await checkConnection();
    
    if (!connectionStatus.connected) {
      // Enhanced error for WebContainer specific issues
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
    // Skip if we've already attempted a fetch and user hasn't changed
    if (fetchAttempted.current && !user?.id) {
      setLoading(false);
      return;
    }

    // Mark that we've attempted a fetch
    fetchAttempted.current = true;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Cancel any in-progress fetch
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create a new abort controller for this fetch
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      setLoading(true);
      setError(null);

      // Verify connection before proceeding
      try {
        await verifyConnection();
      } catch (connectionError) {
        // Handle connection error more gracefully
        console.error('Connection verification failed:', connectionError);
        setError(connectionError.message || 'Unable to connect to Supabase. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Get profile data with retry logic
      let profile = null;
      let profileError = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          shouldContinue(signal);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          shouldContinue(signal);
          
          if (!error) {
            profile = data;
            break;
          }
          
          profileError = error;
          
          // Wait before retrying
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          }
        } catch (err) {
          if (err.message === 'Operation cancelled') {
            return;
          }
          profileError = err;
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          }
        }
      }

      shouldContinue(signal);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // Check if it's a network error
        if (profileError.message?.includes('Failed to fetch') || 
            profileError.code === 'NETWORK_ERROR' || 
            profileError.code === 'CONNECTION_CLOSED') {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // If profile doesn't exist, create a default one
        if (profileError.code === 'PGRST116') {
          try {
            shouldContinue(signal);
            
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
              
            if (insertError) {
              throw insertError;
            }
            
            profile = newProfile;
          } catch (createError) {
            if (createError.message === 'Operation cancelled') {
              return;
            }
            console.error('Error creating default profile:', createError);
            throw new Error('Failed to create user profile');
          }
        } else {
          throw new Error('Failed to verify user profile');
        }
      }

      if (!profile) {
        // Create a default profile if none exists
        try {
          shouldContinue(signal);
          
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
            
          if (insertError) {
            throw insertError;
          }
          
          profile = newProfile;
        } catch (createError) {
          if (createError.message === 'Operation cancelled') {
            return;
          }
          console.error('Error creating default profile:', createError);
          throw new Error('Failed to create user profile');
        }
      }

      shouldContinue(signal);
      setProfile(profile);

      try {
        // Get owned properties with retry logic
        let ownedProperties = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            shouldContinue(signal);
            
            const { data, error } = await supabase
              .from('properties')
              .select('*')
              .eq('agent_id', user.id)
              .order('created_at', { ascending: false });

            if (!error) {
              ownedProperties = data;
              break;
            }

            if (attempt < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            }
          } catch (err) {
            if (err.message === 'Operation cancelled') {
              return;
            }
            if (attempt === MAX_RETRIES - 1) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          }
        }

        if (!ownedProperties) {
          throw new Error('Failed to fetch owned properties after multiple attempts');
        }

        // Get marketplace properties with retry logic
        let marketplaceProperties = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            shouldContinue(signal);
            
            const { data, error } = await supabase
              .from('agent_properties')
              .select(`
                property_id,
                status,
                property:property_id(*)
              `)
              .eq('agent_id', user.id)
              .eq('status', 'active');

            if (!error) {
              marketplaceProperties = data;
              break;
            }

            if (attempt < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            }
          } catch (err) {
            if (err.message === 'Operation cancelled') {
              return;
            }
            if (attempt === MAX_RETRIES - 1) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          }
        }

        if (!marketplaceProperties) {
          throw new Error('Failed to fetch marketplace properties after multiple attempts');
        }

        shouldContinue(signal);

        // Transform the data to match Property type
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

        shouldContinue(signal);
        
        // Update state
        setProperties([...transformedOwnedProperties, ...transformedMarketplaceProperties]);
        setMarketplaceProperties(marketplaceProperties || []);
      } catch (err) {
        if (err.message === 'Operation cancelled') {
          return;
        }
        console.error('Error fetching properties:', err);
        throw new Error('Failed to fetch user properties');
      }

      try {
        // Get reviews with retry logic
        let reviews = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            shouldContinue(signal);
            
            const { data, error } = await supabase
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

            if (!error) {
              reviews = data;
              break;
            }

            if (attempt < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            }
          } catch (err) {
            if (err.message === 'Operation cancelled') {
              return;
            }
            if (attempt === MAX_RETRIES - 1) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          }
        }

        if (!reviews) {
          throw new Error('Failed to fetch reviews after multiple attempts');
        }

        shouldContinue(signal);
        setReviews(reviews || []);
      } catch (err) {
        if (err.message === 'Operation cancelled') {
          return;
        }
        console.error('Error fetching reviews:', err);
        throw new Error('Failed to fetch user reviews');
      }

      setError(null);
      // Reset retry count on success
      retryCount.current = 0;
    } catch (err) {
      if (err.message === 'Operation cancelled') {
        return;
      }
      
      console.error('Error fetching user data:', err);
      
      // Special handling for WebContainer localhost connection issues
      if (isWebContainer.current && 
          (err.message?.includes('localhost') || err.message?.includes('WebContainer'))) {
        setError(
          'Cannot connect to Supabase from WebContainer using localhost URLs. ' +
          'Please update your .env file with a remote Supabase instance.'
        );
        setLoading(false);
        return;
      }
      
      // Increment retry count
      retryCount.current++;
      
      // If we haven't exceeded max retries, try again after a delay
      if (retryCount.current < MAX_RETRIES) {
        console.log(`Retrying fetch (attempt ${retryCount.current + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          fetchUserData();
        }, getRetryDelay(retryCount.current - 1));
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchUserData();

    // Clean up subscriptions and abort controller on unmount
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Unsubscribe from all subscriptions
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