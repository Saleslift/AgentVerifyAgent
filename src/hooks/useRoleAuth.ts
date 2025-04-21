import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

export function useRoleAuth() {
  const { user } = useAuth();
  const [role, setRole] = useState<'agent' | 'agency' | 'developer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        setError(null);

        // Check if role is in user metadata
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userRole = currentUser?.user_metadata?.role as 'agent' | 'agency' | 'developer' | undefined;
        if (userRole) {
          setRole(userRole);
          setLoading(false);
          return;
        }

        // Fetch role from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        if (profile?.role) {
          setRole(profile.role as 'agent' | 'agency' | 'developer');
        } else {
          // Default to 'agent' if no role is found
          await supabase.from('profiles').insert([{
            id: user.id,
            email: user.email || '',
            role: 'agent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
          setRole('agent');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch role');
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  return { role, loading, error, debugRoleInfo };
}
