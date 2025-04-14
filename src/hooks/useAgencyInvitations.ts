import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface AgentInvitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'refused';
  created_at: string;
  expires_at: string;
  token: string;
  full_name?: string;
  phone?: string;
  whatsapp?: string;
}

export function useAgencyInvitations(agencyId: string | undefined) {
  const [invitations, setInvitations] = useState<AgentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) {
      setInvitations([]);
      setLoading(false);
      return;
    }
    
    fetchInvitations();
    
    // Set up real-time subscription for invitation updates
    const subscription = supabase
      .channel('agency_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_invitations',
          filter: `agency_id=eq.${agencyId}`
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [agencyId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('agent_invitations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (email: string, fullName?: string, phone?: string, whatsapp?: string) => {
    if (!agencyId) return;
    
    try {
      setCreating(true);
      setError(null);
      
      // Use RPC to create invitation
      const { data, error } = await supabase.rpc(
        'create_agent_invitation',
        {
          p_email: email,
          p_agency_id: agencyId,
          p_full_name: fullName || null,
          p_phone: phone || null,
          p_whatsapp: whatsapp || null
        }
      );
      
      if (error) throw error;
      
      await fetchInvitations();
      
      return data;
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError('Failed to create invitation');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const resendInvitation = async (id: string) => {
    if (!agencyId) return;
    
    try {
      setResending(id);
      
      // Get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('agent_invitations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete old invitation
      const { error: deleteError } = await supabase
        .from('agent_invitations')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Create new invitation with same details but new token and expiry
      const { error: createError } = await supabase.rpc(
        'create_agent_invitation',
        {
          p_email: invitation.email,
          p_agency_id: agencyId,
          p_full_name: invitation.full_name || null,
          p_phone: invitation.phone || null,
          p_whatsapp: invitation.whatsapp || null
        }
      );
      
      if (createError) throw createError;
      
      await fetchInvitations();
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation');
    } finally {
      setResending(null);
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      setDeleting(id);
      
      const { error } = await supabase
        .from('agent_invitations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setInvitations(prev => prev.filter(invitation => invitation.id !== id));
    } catch (err) {
      console.error('Error deleting invitation:', err);
      setError('Failed to delete invitation');
    } finally {
      setDeleting(null);
    }
  };

  return {
    invitations,
    loading,
    error,
    creating,
    resending,
    deleting,
    createInvitation,
    resendInvitation,
    deleteInvitation,
    refresh: fetchInvitations
  };
}