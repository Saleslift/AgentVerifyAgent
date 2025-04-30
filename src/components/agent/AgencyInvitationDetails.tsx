import React, { useState, useEffect } from 'react';
import { Building2, Star, Clock, Home, Package, MessageSquare, Phone, Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AgencyInvitationDetailsProps {
  notificationToken: string;
  agencyId: string;
  onStatusChange: () => void;
}

export default function AgencyInvitationDetails({ notificationToken, agencyId, onStatusChange }: AgencyInvitationDetailsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agency, setAgency] = useState<any | null>(null);
  const [invitationStatus, setInvitationStatus] = useState<string | null>(null);

  useEffect(() => {
    console.log('AgencyInvitationDetails mounted with agencyId:', agencyId);
    fetchAgencyDetails();
    fetchInvitationStatus();
  }, [agencyId]);

  const fetchAgencyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching agency details for ID:', agencyId);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          agency_name,
          agency_logo,
          introduction,
          whatsapp,
          email
        `)
        .eq('id', agencyId)
        .single();

      if (fetchError) {
        console.error('Error from Supabase:', fetchError);
        throw fetchError;
      }

      console.log('Agency details fetched:', data);
      setAgency(data);
    } catch (err) {
      console.error('Error fetching agency details:', err);
      setError('Failed to load agency details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitationStatus = async () => {
    try {
      const { data, error: profileError } = await supabase
          .from('agent_invitations')
          .select('*')
          .eq('agency_id', agencyId)
          .eq('email', user?.email)
          .eq('token', notificationToken)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (profileError) {
        if (profileError.code !== 'PGRST116') { // Not found is ok
          console.error('Error from Supabase:', profileError);
          throw profileError;
        } else {
          console.log('No invitation found, default to pending');
        }
      }

      if (data) {
        console.log('Invitation status found:', data.status);
        setInvitationStatus(data.status);
      } else {
        // Set a default status if none found
        console.log('Setting default invitation status: pending');
        setInvitationStatus('pending');
      }
    } catch (err) {
      console.error('Error fetching invitation status:', err);
    }
  };

  const handleAcceptInvitation = async (e: React.MouseEvent) => {
    if (!user) return;

    // Triple protection against navigation
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }

    console.log('Accepting invitation for agency:', agencyId);

    try {
      setAccepting(true);
      setError(null);

      // 1. Update agent invitation status
      const { error: inviteError } = await supabase
        .from('agent_invitations')
        .update({ status: 'accepted' })
        .eq('agency_id', agencyId)
        .eq('email', user.email)
          .eq('token', notificationToken)
        .eq('status', 'pending');

      if (inviteError) {
        console.error('Error updating invitation:', inviteError);
        throw inviteError;
      }

      // 2. Update profiles table to set agency_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ agency_id: agencyId })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // 3. Create or update agency_agents link
      const { error: agencyAgentsError } = await supabase
        .from('agency_agents')
        .update({
          status: 'active',
        })
          .eq('agency_id', agencyId)
          .eq('agent_id', user.id)
          .eq('status', 'pending');

      if (agencyAgentsError) {
        console.error('Error updating agency_agents:', agencyAgentsError);
        throw agencyAgentsError;
      }

      // 4. Create notification about acceptance
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: user.id,
          type: 'system',
          title: 'Agency Invitation Accepted',
          message: `You have joined ${agency?.agency_name || 'the agency'}!`,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
      }

      console.log('Invitation accepted successfully');

      // Update local state
      setInvitationStatus('accepted');
      onStatusChange();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectInvitation = async (e: React.MouseEvent) => {
    if (!user) return;

    // Triple protection against navigation
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }

    console.log('Rejecting invitation for agency:', agencyId);

    try {
      setRejecting(true);
      setError(null);

      // 1. Update agent invitation status
      const { error: inviteError } = await supabase
          .from('agent_invitations')
          .update({ status: 'refused' })
          .eq('agency_id', agencyId)
          .eq('email', user.email)
          .eq('token', notificationToken)
          .eq('status', 'pending');

      if (inviteError) {
        console.error('Error updating invitation:', inviteError);
        throw inviteError;
      }

      // 2. Create or update agency_agents link with status=inactive
      const { error: agencyAgentsError } = await supabase
        .from('agency_agents')
        .upsert({
          agency_id: agencyId,
          agent_id: user.id,
          status: 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'agency_id,agent_id'
        });

      if (agencyAgentsError) {
        console.error('Error updating agency_agents:', agencyAgentsError);
        throw agencyAgentsError;
      }

      // 3. Create notification about rejection
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: user.id,
          type: 'system',
          title: 'Agency Invitation Declined',
          message: `You declined the invitation to join ${agency?.agency_name || 'the agency'}.`,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
      }

      console.log('Invitation rejected successfully');

      // Update local state
      setInvitationStatus('refused');
      onStatusChange();
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject invitation. Please try again.');
    } finally {
      setRejecting(false);
    }
  };


  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg mt-2 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg mt-2">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg mt-2">
        <p className="text-gray-600">Agency details not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg mt-2 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-shrink-0">
          {agency.agency_logo ? (
            <img
              src={agency.agency_logo}
              alt={agency.agency_name || agency.full_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold">
            {agency.agency_name || agency.full_name}
          </h3>
          {agency.introduction && (
            <p className="text-gray-600 text-sm mt-1">
              {agency.introduction}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {agency.whatsapp && (
              <a
                href={`https://wa.me/${agency.whatsapp.replace(/[\s+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-[#cefa05] text-black rounded-full text-xs hover:bg-[#b9e500] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp
              </a>
            )}

            {agency.whatsapp && (
              <a
                href={`tel:${agency.whatsapp}`}
                className="inline-flex items-center px-3 py-1 bg-black text-white rounded-full text-xs hover:bg-gray-800 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </a>
            )}

            {agency.email && (
              <a
                href={`mailto:${agency.email}`}
                className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs hover:bg-gray-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </a>
            )}
          </div>
        </div>
      </div>

      {invitationStatus === 'pending' ? (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRejectInvitation}
            disabled={rejecting || accepting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex-1 flex justify-center items-center"
          >
            {rejecting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
            ) : (
              <X className="h-4 w-4 mr-1" />
            )}
            Decline
          </button>

          <button
            onClick={handleAcceptInvitation}
            disabled={accepting || rejecting}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex-1 flex justify-center items-center"
          >
            {accepting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Accept
          </button>
        </div>
      ) : (
        <div className="mt-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
              invitationStatus === 'accepted' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {invitationStatus === 'accepted' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accepted
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Declined
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
