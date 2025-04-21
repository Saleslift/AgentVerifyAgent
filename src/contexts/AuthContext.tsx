import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
      email: string,
      password: string,
      options?: { data: any }
  ) => Promise<{ error: AuthError | null; user?: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const initialCheckDone = useRef(false);
  const isManualAuthAction = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (initialCheckDone.current) return;
      initialCheckDone.current = true;

      const { data: { session }, error } = await supabase.auth.getSession();

      if (!error) {
        setUser(session?.user ?? null);
      }

      setLoading(false);

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      });
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (
      email: string,
      password: string,
      metadata: any
  ): Promise<{ error: AuthError | null; user?: User | null }> => {
    try {
      isManualAuthAction.current = true;
      console.log('[AuthContext] Starting signup process with email:', email);

      // Dynamically assign role based on metadata (added to handle both roles)
      const role = metadata?.data?.role;
      if (!role || (role !== 'agency' && role !== 'agent')) {
        console.warn(`[AuthContext] Invalid or missing role: ${role}, using default 'agent'`);
      } else {
        console.log(`[AuthContext] Using role from metadata: ${role}`);
      }

      const enhancedMetadata = {
        ...metadata,
        data: {
          ...metadata?.data,
          role: role || 'agent', // Default to 'agent' if role is missing
        },
      };

      console.log('[AuthContext] Enhanced metadata:', enhancedMetadata);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...enhancedMetadata.data,
            email_confirmed: true,
            created_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error);
        return { error };
      }

      const user = data.user;
      console.log('[AuthContext] Signup successful, user created:', user?.id);
      console.log('[AuthContext] User role assigned:', enhancedMetadata.data.role);

      // Insert profile manually (added to handle agency-specific fields)
      if (user) {
        const profileData: any = {
          id: user.id,
          email: email.trim(),
          full_name: '',
          role: enhancedMetadata.data.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (enhancedMetadata.data.role === 'agency') {
          profileData.full_name = metadata.data?.companyName || '';
          profileData.whatsapp = metadata.data?.agencyPhone || '';
          profileData.agency_website = metadata.data?.agencyWebsite || '';
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData]);

        if (profileError) {
          console.error('[AuthContext] Error inserting profile:', profileError);
        } else {
          console.log('[AuthContext] Profile inserted successfully for user:', user.id);
        }
      }

      return {
        error: null,
        user: data.user,
      };
    } catch (error) {
      console.error('[AuthContext] Error during sign up:', error);
      return {
        error: {
          name: 'SignupError',
          message: error instanceof Error ? error.message : 'Unexpected signup error',
        } as AuthError,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      isManualAuthAction.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) return { error };

      const userId = data.user.id;

      const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      if (!profile) {
        console.warn('[AuthContext] Profile not found. Skipping creation during sign-in to avoid policy issues.');
      }

      setUser(data?.user);
      await new Promise(resolve => setTimeout(resolve, 500));

      return { error: null };
    } catch (error) {
      console.error('Error during sign in:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
      <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
