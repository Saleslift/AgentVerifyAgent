import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, X, AlertCircle, Building2, Clock } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          setError('No invitation token provided');
          setLoading(false);
          return;
        }
        
        if (!user) {
          // Redirect to login if not logged in, but save the token
          sessionStorage.setItem('invitationToken', token);
          navigate('/signin?redirect=accept', { replace: true });
          return;
        }
        
        // Verify token using Supabase Edge Function
        const response = await supabase.functions.invoke('verify-invitation', {
          body: { token }
        });

        if (!response.data?.valid) {
          setError(response.data?.message || 'Invalid or expired invitation');
          setLoading(false);
          return;
        }
        
        setInvitation({
          id: response.data.invitation_id,
          token,
          agency_id: response.data.agency_id,
          agency: {
            id: response.data.agency_id,
            agency_name: response.data.agency_name,
          },
          expires_at: response.data.expires_at
        });
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('Failed to verify invitation');
      } finally {
        setLoading(false);
      }
    }
    
    verifyToken();
  }, [location.search, navigate, user]);
  
  const handleAccept = async () => {
    if (!user || !invitation) return;
    
    try {
      setProcessing(true);
      
      // 1. Update agent invitation status
      const { error: inviteError } = await supabase
        .from('agent_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
        
      if (inviteError) throw inviteError;
      
      // 2. Update profiles table to set agency_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ agency_id: invitation.agency_id })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // 3. Create or update agency_agents link
      const { error: agencyAgentsError } = await supabase
        .from('agency_agents')
        .upsert({
          agency_id: invitation.agency_id,
          agent_id: user.id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'agency_id,agent_id'
        });
      
      if (agencyAgentsError) throw agencyAgentsError;
      
      // 4. Create notification about acceptance
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: user.id,
          type: 'system',
          title: 'Agency Invitation Accepted',
          message: `You have joined ${invitation.agency?.agency_name || 'the agency'}!`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      
      // Show success even if notification creation fails
      setAccepted(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/agent-dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleDecline = async () => {
    if (!user || !invitation) return;
    
    try {
      setProcessing(true);
      
      // 1. Update agent invitation status
      const { error: inviteError } = await supabase
        .from('agent_invitations')
        .update({ status: 'refused' })
        .eq('id', invitation.id);
      
      if (inviteError) throw inviteError;
      
      setDeclined(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/agent-dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError('Failed to decline invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
          </div>
          <p className="text-center text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex justify-center text-red-600 mb-4">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Invalid Invitation</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <Link
              to="/agent-dashboard"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex justify-center text-green-600 mb-4">
            <Check size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Invitation Accepted</h2>
          <p className="text-center text-gray-600 mb-6">
            You have successfully joined {invitation.agency?.agency_name || 'the agency'}. 
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }
  
  if (declined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex justify-center text-gray-600 mb-4">
            <X size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Invitation Declined</h2>
          <p className="text-center text-gray-600 mb-6">
            You have declined the invitation to join {invitation.agency?.agency_name || 'the agency'}.
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Building2 className="h-24 w-24 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Agency Invitation</h2>
        
        <div className="flex items-center justify-center space-x-1 mb-6 text-gray-500">
          <Clock size={16} />
          <span className="text-sm">
            Expires {new Date(invitation.expires_at).toLocaleDateString()}
          </span>
        </div>
        
        <p className="text-center text-gray-600 mb-8">
          You've been invited to join <span className="font-semibold">{invitation.agency?.agency_name || 'an agency'}</span>.
          By accepting this invitation, you'll be connected with the agency and will have access to their projects.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Decline
          </button>
          
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full py-3 px-4 bg-[#CEFA05] rounded-lg text-black font-medium hover:bg-[#b9e500] disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}