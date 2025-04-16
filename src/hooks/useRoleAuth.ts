import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, checkConnection, isWebContainerEnvironment } from '../utils/supabase';

export function useRoleAuth() {
  const { user } = useAuth();
  const [role, setRole] = useState<'agent' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef<boolean>(false);
  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const isWebContainer = useRef(isWebContainerEnvironment());

  // Debug function to help diagnose role issues
  const debugRoleInfo = async () => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Get user metadata
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        userId: user.id,
        email: user.email,
        metadataRole: currentUser?.user_metadata?.role,
        profileExists: !!profile,
        profileRole: profile?.role,
        error: profileError ? profileError.message : null
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryTimer: NodeJS.Timeout | null = null;

    async function fetchRole() {
      // Skip if we've already attempted a fetch and user hasn't changed
      if (fetchAttempted.current && !user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      // Mark that we've attempted a fetch
      fetchAttempted.current = true;

      if (!user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      // Cancel any in-progress fetch
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create a new abort controller for this fetch
      abortController.current = new AbortController();

      try {
        setError(null);

        // Always set role to 'agent' for simplified authentication
        setRole('agent');
        localStorage.setItem('user_role', 'agent');
        setLoading(false);

        return;
      } catch (err) {
        console.error('Error fetching user role:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load user role');

          // Try to get role from localStorage as fallback
          const savedRole = localStorage.getItem('user_role') as 'agent' | null;
          if (savedRole) {
            setRole(savedRole);
          }

          setLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [user]);

  return { role, loading, error, debugRoleInfo };
}
