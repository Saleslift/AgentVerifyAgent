import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

interface InvitationDetails {
  valid: boolean;
  invitation_id?: string;
  email?: string;
  full_name?: string;
  whatsapp?: string;
  agency_id?: string;
  inviter_name?: string;
  expires_at?: string;
  message?: string;
}

export function useInvitation() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  
  useEffect(() => {
    const verifyInvitation = async () => {
      // Extract invitation token from URL
      const params = new URLSearchParams(location.search);
      const token = params.get('invitation');
      
      if (!token) return;
      
      setLoading(true);
      
      try {
        // Call the verify-invitation edge function
        const { data, error } = await supabase.functions.invoke('verify-invitation', {
          body: { token }
        });
        
        if (error) throw error;
        
        setInvitation(data);
      } catch (error) {
        console.error('Error verifying invitation:', error);
        setInvitation({ valid: false, message: 'Failed to verify invitation' });
      } finally {
        setLoading(false);
      }
    };
    
    verifyInvitation();
  }, [location]);
  
  const acceptInvitation = async (userId: string) => {
    if (!invitation?.valid || !invitation.invitation_id) {
      return { success: false, message: 'Invalid invitation' };
    }
    
    try {
      // First update the invitation status
      const { error: invitationError } = await supabase
        .from('agent_invitations')
        .update({ 
          status: 'accepted',
          linked_user_id: userId
        })
        .eq('id', invitation.invitation_id);
        
      if (invitationError) throw invitationError;
      
      // Create or update the agency_agents link
      const { error: linkError } = await supabase
        .from('agency_agents')
        .upsert({
          agency_id: invitation.agency_id,
          agent_id: userId,
          status: 'active',
          created_at: new Date().toISOString()
        });
        
      if (linkError) throw linkError;
      
      return { success: true };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to accept invitation' 
      };
    }
  };
  
  return { invitation, loading, acceptInvitation };
}