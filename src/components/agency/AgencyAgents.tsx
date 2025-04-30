import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, X, Search, UserPlus, Shield, AlertCircle,
  MoreHorizontal, MessageSquare, Edit, UserMinus, LayoutGrid, List,
  CheckCircle, Copy, ExternalLink
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';

interface Agent {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  avatar_url: string | null;
  whatsapp: string | null;
}

interface AgentInvitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  full_name?: string;
  whatsapp?: string;
  phone?: string;
}

export default function AgencyAgents() {
  const { profile } = useUserDataContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [invitations, setInvitations] = useState<AgentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    phone: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const agencyName = profile?.full_name || 'our agency';

  const fetchAgents = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Fetch agents
      const { data: agentData, error: agentError } = await supabase
        .from('agency_agents')
        .select(`
          id,
          agent:agent_id(
            id,
            full_name,
            email,
            avatar_url,
            whatsapp
          ),
          status,
          created_at
        `)
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });

      if (agentError) throw agentError;

      // Transform data
      const transformedAgents: Agent[] = agentData
        ? agentData.map(item => ({
            id: item.agent.id,
            full_name: item.agent.full_name,
            email: item.agent.email,
            status: item.status,
            created_at: item.created_at,
            avatar_url: item.agent.avatar_url,
            whatsapp: item.agent.whatsapp
          }))
        : [];

      setAgents(transformedAgents);

      // Fetch invitations
      const { data: inviteData, error: inviteError } = await supabase
        .from('agent_invitations')
        .select('*')
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });

      if (inviteError) throw inviteError;

      setInvitations(inviteData || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    // Set up real-time subscription for invitations
    const invitationsSubscription = supabase
      .channel('agent_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_invitations',
          filter: `agency_id=eq.${profile?.id}`
        },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    // Set up real-time subscription for agency_agents
    const agencyAgentsSubscription = supabase
      .channel('agency_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agency_agents',
          filter: `agency_id=eq.${profile?.id}`
        },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    return () => {
      invitationsSubscription.unsubscribe();
      agencyAgentsSubscription.unsubscribe();
    };
  }, [profile?.id]);

  const generateInviteLink = (invitationId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?invitation=${invitationId}`;
  };

  const generateWhatsAppMessage = (invitationId: string) => {
    const link = generateInviteLink(invitationId);
    return `Hi! I'd like to invite you to join ${agencyName} on AgentVerify. Click here to sign up: ${link}`;
  };

  const handleWhatsAppInvite = (whatsapp: string, invitationId: string) => {
    const message = generateWhatsAppMessage(invitationId);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp.replace(/\+/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const checkExistingUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  };

  const createNotificationForInvitation = async (recipientId: string, token: string) => {
    // Create a notification for the invited agent
    const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId, // Assuming recipient_id can be an email
          type: 'alert',
          title: 'You have been invited to join an agency',
          message: `${profile.full_name || 'An agency'} has invited you to join their team.`,
          link_url: `/notifications?agency_id=${profile.id}`,
          is_read: false,
          created_at: new Date().toISOString(),
          agency_id: profile.id,
          token
        });



    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

  }

  const generateTokenForInvitation = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      // Check if email is already invited
      const existingInvite = invitations.find(
        inv => inv.email === inviteForm.email && inv.status === 'pending'
      );

      if (existingInvite) {
        setInviteError('This email has already been invited');
        setInviteLoading(false);
        return;
      }

      // Check if user already exists in the system
      const existingUserId = await checkExistingUser(inviteForm.email);
      const token = generateTokenForInvitation();


      // Create invitation
      const { data: invitationData, error } = await supabase
        .from('agent_invitations')
        .insert({
          email: inviteForm.email,
          full_name: inviteForm.fullName,
          whatsapp: inviteForm.whatsapp,
          phone: inviteForm.phone || inviteForm.whatsapp,
          agency_id: profile.id,
          token: token,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) {
        throw error;
      }


      if (existingUserId) {
        await createNotificationForInvitation(existingUserId, token)

        // If user exists, create an agency_agents record with pending status
        const { error: linkError } = await supabase
            .from('agency_agents')
            .upsert({
              agency_id: profile.id,
              agent_id: existingUserId,
              status: 'pending',
              created_at: new Date().toISOString()
          });

        if (linkError) {
          console.error('Error linking existing agent:', linkError);
        }
      }

      // Set invitation link for WhatsApp message
      const link = generateInviteLink(invitationData.id);
      setInvitationLink(link);

      // Refresh invitations list
      fetchAgents();

      // Show success message
      setInviteSuccess(true);

    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteError('Failed to send invitation');
      setInviteSuccess(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const { error } = await supabase
        .from('agent_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      // Update local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error revoking invitation:', error);
    }
  };

  const handleRemoveAgent = async () => {
    if (!selectedAgentId || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('agency_agents')
        .delete()
        .eq('agent_id', selectedAgentId)
        .eq('agency_id', profile.id);

      if (error) throw error;

      // Update local state
      setAgents(prev => prev.filter(agent => agent.id !== selectedAgentId));
      setShowRemoveModal(false);
    } catch (error) {
      console.error('Error removing agent:', error);
    }
  };

  const confirmRemoveAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowRemoveModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const resetInviteForm = () => {
    setInviteForm({
      fullName: '',
      email: '',
      whatsapp: '',
      phone: ''
    });
    setInviteError(null);
    setInviteSuccess(false);
    setInvitationLink('');
  };

  // Filter and search
  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' || agent.status === filter;

    return matchesSearch && matchesFilter;
  });

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (loading && agents.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-gray-500">Manage your agency's real estate agents</p>
        </div>

        <button
          onClick={() => {
            resetInviteForm();
            setShowInviteModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          <span>Invite Agent</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search agents by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 ${viewMode === 'card' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <h2 className="font-semibold text-yellow-800 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Pending Invitations ({pendingInvitations.length})
          </h2>

          <div className="space-y-4">
            {pendingInvitations.map(invitation => (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{invitation.full_name || invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      {invitation.email}
                      {invitation.whatsapp && <span className="ml-2">• {invitation.whatsapp}</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      Invited: {new Date(invitation.created_at).toLocaleDateString()}
                      {' • '}
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {invitation.whatsapp && (
                    <button
                      onClick={() => handleWhatsAppInvite(invitation.whatsapp!, invitation.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Send WhatsApp invitation"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const link = generateInviteLink(invitation.id);
                      setInvitationLink(link);
                      setCopiedLink(false);
                      setShowInviteModal(true);
                      setInviteSuccess(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Copy invitation link"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Revoke invitation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent List */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500 mb-6">
            {agents.length === 0
              ? "You haven't added any agents to your agency yet."
              : "No agents match your current filters."}
          </p>
          {agents.length === 0 && (
            <button
              onClick={() => {
                resetInviteForm();
                setShowInviteModal(true);
              }}
              className="inline-flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span>Invite Your First Agent</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map(agent => (
                  <tr key={agent.id} className="flex flex-col sm:table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{agent.full_name}</div>
                          <div className="text-sm text-gray-500 md:hidden">{agent.email}</div>
                          <div className="text-xs text-gray-400 md:hidden">
                            {agent.status === 'active' ? (
                              <span className="text-green-600 flex items-center">
                                <Shield className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900 flex flex-col">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {agent.email}
                        </div>
                        {agent.whatsapp && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {agent.whatsapp}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {agent.status === 'active' ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        {agent.whatsapp && (
                          <a
                            href={`https://wa.me/${agent.whatsapp.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded-full"
                          >
                            <MessageSquare className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full"
                          title="Edit agent details"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmRemoveAgent(agent.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-full"
                          title="Remove agent"
                        >
                          <UserMinus className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={agent.full_name}
                        className="h-12 w-12 rounded-full object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-7 w-7 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 leading-tight">{agent.full_name}</h3>
                      <p className="text-sm text-gray-500">{agent.status === 'active' ? 'Active Agent' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 truncate">{agent.email}</span>
                  </div>
                  {agent.whatsapp && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{agent.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {agent.whatsapp && (
                    <a
                      href={`https://wa.me/${agent.whatsapp.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    className="flex-1 flex items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                    title="Edit agent details"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => confirmRemoveAgent(agent.id)}
                    className="flex-1 flex items-center justify-center py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
                    title="Remove agent"
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{inviteSuccess ? 'Invitation Created' : 'Invite Agent'}</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    resetInviteForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {inviteError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{inviteError}</p>
                    </div>
                  </div>
                </div>
              )}

              {inviteSuccess ? (
                <div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          Invitation created successfully!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invitation Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={invitationLink}
                        className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-black focus:border-transparent bg-gray-50"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-black text-white rounded-r-lg hover:bg-gray-800 flex items-center"
                      >
                        {copiedLink ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Share this link with the agent to join your agency.
                    </p>
                  </div>

                  {inviteForm.whatsapp && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleWhatsAppInvite(inviteForm.whatsapp, invitationLink.split('invitation=')[1])}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span>Send via WhatsApp</span>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        resetInviteForm();
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        resetInviteForm();
                        setInviteSuccess(false);
                      }}
                      className="ml-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                    >
                      Invite Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Agent's full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="agent@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+</span>
                      <input
                        id="whatsapp"
                        type="text"
                        required
                        value={inviteForm.whatsapp}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="971501234567"
                        className="w-full px-4 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Include country code without + (e.g. 971501234567)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (if different from WhatsApp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+</span>
                      <input
                        id="phone"
                        type="text"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="971501234567"
                        className="w-full px-4 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                    <p>The agent will receive:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>A unique invitation link</li>
                      <li>The link will expire in 7 days</li>
                      <li>You can send the link via WhatsApp or copy it</li>
                      <li>When they sign up, they'll be automatically linked to your agency</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        resetInviteForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg mr-2 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center"
                    >
                      {inviteLoading ? (
                        <>
                          <span className="animate-spin mr-2">⌛</span>
                          Sending...
                        </>
                      ) : (
                        <>Send Invitation</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Agent Confirmation Modal */}
      {showRemoveModal && selectedAgentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Remove Agent</h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this agent from your agency? This will unlink them from your agency, but their account will remain active.
            </p>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 mb-4">
              <p>The agent will:</p>
              <ul className="list-disc list-inside mt-1">
                <li>No longer appear in your agency dashboard</li>
                <li>No longer have access to agency properties</li>
                <li>Keep their personal account and listings</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAgent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
