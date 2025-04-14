import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  Mail,
  Edit2, 
  Check, 
  Save,
  Home,
  User,
  Bell,
  ChevronRight,
  CheckCheck,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import AddReminderForm from './AddReminderForm';

interface Activity {
  id: string;
  lead_id: string;
  agent_id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  lead_type: 'Buyer' | 'Renter' | 'Seller' | 'Investor';
  status: 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Lost';
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  agent_id: string;
}

interface Deal {
  id: string;
  deal_type: string;
  status: string;
  property?: {
    title: string;
    location: string;
    price: number;
  };
  created_at: string;
}

interface ContactDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onContactUpdated: () => void;
}

export default function ContactDetailModal({
  isOpen,
  onClose,
  contact,
  onContactUpdated
}: ContactDetailModalProps) {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact>({ ...contact });
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Fetch activities and deals
  useEffect(() => {
    if (!isOpen || !contact) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('crm_activities')
          .select('*')
          .eq('lead_id', contact.id)
          .order('created_at', { ascending: false });
        
        if (activitiesError) throw activitiesError;
        
        // Fetch deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('crm_deals')
          .select(`
            *,
            property:property_id(
              title,
              location,
              price
            )
          `)
          .eq('lead_id', contact.id)
          .order('created_at', { ascending: false });
        
        if (dealsError) throw dealsError;
        
        setActivities(activitiesData || []);
        setDeals(dealsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, contact]);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'WhatsApp':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'Email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'Note':
        return <Edit2 className="h-4 w-4 text-gray-500" />;
      case 'Status Change':
        return <CheckCheck className="h-4 w-4 text-purple-500" />;
      default:
        return <ChevronRight className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleSaveContact = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('crm_leads')
        .update({
          full_name: editedContact.full_name,
          phone_number: editedContact.phone_number,
          email: editedContact.email,
          lead_type: editedContact.lead_type,
          status: editedContact.status,
          notes: editedContact.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);
      
      if (error) throw error;
      
      // Log activity if status changed
      if (editedContact.status !== contact.status) {
        await supabase
          .from('crm_activities')
          .insert({
            lead_id: contact.id,
            agent_id: user.id,
            activity_type: 'Status Change',
            description: `Status changed from ${contact.status} to ${editedContact.status}`
          });
      }
      
      // Log activity if notes changed
      if (editedContact.notes !== contact.notes) {
        await supabase
          .from('crm_activities')
          .insert({
            lead_id: contact.id,
            agent_id: user.id,
            activity_type: 'Note',
            description: 'Updated contact notes'
          });
      }
      
      setEditMode(false);
      onContactUpdated();
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteContact = async () => {
    if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', contact.id);
      
      if (error) throw error;
      
      onContactUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCall = async () => {
    if (!user) return;
    
    // Log activity
    await supabase
      .from('crm_activities')
      .insert({
        lead_id: contact.id,
        agent_id: user.id,
        activity_type: 'Call',
        description: `Called ${contact.full_name}`
      });
    
    // Update last_contacted_at
    await supabase
      .from('crm_leads')
      .update({
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);
    
    // Open phone dialer
    window.location.href = `tel:${contact.phone_number}`;
  };
  
  const handleWhatsApp = async () => {
    if (!user) return;
    
    // Log activity
    await supabase
      .from('crm_activities')
      .insert({
        lead_id: contact.id,
        agent_id: user.id,
        activity_type: 'WhatsApp',
        description: `Messaged ${contact.full_name} on WhatsApp`
      });
    
    // Update last_contacted_at
    await supabase
      .from('crm_leads')
      .update({
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);
    
    // Format phone number
    const formattedPhone = contact.phone_number.replace(/[\s+]/g, '');
    
    // Get agent name
    const agentName = user?.user_metadata?.full_name || 'your agent';
    
    // Create WhatsApp message
    const message = encodeURIComponent(`Hi ${contact.full_name}, I am ${agentName} from Agentverify.`);
    
    // Open WhatsApp
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };
  
  const handleEmail = async () => {
    if (!user || !contact.email) return;
    
    // Log activity
    await supabase
      .from('crm_activities')
      .insert({
        lead_id: contact.id,
        agent_id: user.id,
        activity_type: 'Email',
        description: `Emailed ${contact.full_name}`
      });
    
    // Update last_contacted_at
    await supabase
      .from('crm_leads')
      .update({
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);
    
    // Open email client
    window.location.href = `mailto:${contact.email}`;
  };
  
  const handleReminderAdded = () => {
    setShowAddReminder(false);
    onContactUpdated();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Follow-up':
        return 'bg-purple-100 text-purple-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Contact Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditedContact({ ...contact });
                          setEditMode(false);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleSaveContact}
                        disabled={saving}
                        className="text-green-600 hover:text-green-700"
                      >
                        {saving ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Contact Details Form */}
                <div className="p-4 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editedContact.full_name}
                        onChange={(e) => setEditedContact({ ...editedContact, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.full_name}</p>
                    )}
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={editedContact.phone_number}
                        onChange={(e) => setEditedContact({ ...editedContact, phone_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900">{contact.phone_number}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCall}
                            className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleWhatsApp}
                            className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900">{contact.email || 'Not provided'}</p>
                        {contact.email && (
                          <button
                            onClick={handleEmail}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Lead Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    {editMode ? (
                      <select
                        value={editedContact.lead_type}
                        onChange={(e) => setEditedContact({ 
                          ...editedContact, 
                          lead_type: e.target.value as 'Buyer' | 'Renter' | 'Seller' | 'Investor' 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="Buyer">Buyer</option>
                        <option value="Renter">Renter</option>
                        <option value="Seller">Seller</option>
                        <option value="Investor">Investor</option>
                      </select>
                    ) : (
                      <div className="flex items-center">
                        {contact.lead_type === 'Buyer' && <Home className="h-4 w-4 mr-2 text-blue-500" />}
                        {contact.lead_type === 'Renter' && <Calendar className="h-4 w-4 mr-2 text-purple-500" />}
                        {contact.lead_type === 'Seller' && <Home className="h-4 w-4 mr-2 text-orange-500" />}
                        {contact.lead_type === 'Investor' && <User className="h-4 w-4 mr-2 text-green-500" />}
                        <p className="text-gray-900">{contact.lead_type}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {editMode ? (
                      <select
                        value={editedContact.status}
                        onChange={(e) => setEditedContact({ 
                          ...editedContact, 
                          status: e.target.value as 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Lost' 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    ) : (
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </div>
                    )}
                  </div>
                  
                  {/* Created At */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-gray-900">{new Date(contact.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Last Contacted */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Contacted</label>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-gray-900">
                        {contact.last_contacted_at ? 
                          new Date(contact.last_contacted_at).toLocaleString() : 
                          'Never contacted'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    {editMode ? (
                      <textarea
                        value={editedContact.notes || ''}
                        onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{contact.notes || 'No notes'}</p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="pt-4 flex justify-between">
                    {!editMode && (
                      <button
                        onClick={() => setShowAddReminder(true)}
                        className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Add Reminder
                      </button>
                    )}
                    
                    <button
                      onClick={handleDeleteContact}
                      className="flex items-center px-4 py-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Contact
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Add Reminder Form */}
              {showAddReminder && (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Add Reminder</h3>
                  </div>
                  <div className="p-4">
                    <AddReminderForm
                      contactId={contact.id}
                      onSuccess={handleReminderAdded}
                      onCancel={() => setShowAddReminder(false)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Activity Timeline and Deals */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deals Section */}
              {deals.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Linked Deals</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {deals.map(deal => (
                      <div key={deal.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {deal.property?.title || 'Untitled Deal'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {deal.property?.location || 'No location'}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deal.status === 'Closed' ? 'bg-green-100 text-green-800' :
                            deal.status === 'Lost' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {deal.status}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {deal.property?.price ? 
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'AED',
                                maximumFractionDigits: 0
                              }).format(deal.property.price) : 
                              'No price'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(deal.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Activity Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner />
                    </div>
                  ) : activities.length > 0 ? (
                    <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                      {activities.map(activity => (
                        <li key={activity.id} className="ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                            {getActivityIcon(activity.activity_type)}
                          </span>
                          <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-medium text-gray-900">
                                {activity.activity_type}
                              </h3>
                              <time className="text-xs text-gray-500">
                                {formatDate(activity.created_at)}
                              </time>
                            </div>
                            <p className="text-sm text-gray-700">
                              {activity.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No activities recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}