import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  Mail, 
  ChevronDown, 
  Filter, 
  X, 
  Clock,
  Bell,
  Calendar,
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ContactDetailModal from '../../components/contacts/ContactDetailModal';
import AddContactModal from '../../components/contacts/AddContactModal';
import ReminderCard from '../../components/contacts/ReminderCard';

// Contact type definition
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
  updated_at: string;
  agent_id: string;
}

// Reminder type definition
interface Reminder {
  id: string;
  lead_id: string;
  agent_id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  lead?: Contact;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ITEMS_PER_PAGE = 10;
  
  const observer = useRef<IntersectionObserver>();
  const lastContactElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch contacts and reminders
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('agent_id', user.id)
          .order('created_at', { ascending: false })
          .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
          
        if (contactsError) throw contactsError;
        
        // Fetch reminders
        const { data: remindersData, error: remindersError } = await supabase
          .from('crm_reminders')
          .select(`
            *,
            lead:lead_id(*)
          `)
          .eq('agent_id', user.id)
          .eq('is_completed', false)
          .order('due_date', { ascending: true });
          
        if (remindersError) throw remindersError;
        
        // Process reminders
        const processedReminders = (remindersData || []).map((reminder: any) => ({
          ...reminder,
          lead: reminder.lead
        }));
        
        // Update states
        if (page === 0) {
          setContacts(contactsData || []);
        } else {
          setContacts(prevContacts => [...prevContacts, ...(contactsData || [])]);
        }
        
        setHasMore((contactsData || []).length === ITEMS_PER_PAGE);
        setReminders(processedReminders);
        
        // Filter upcoming reminders (today and overdue)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingRemindersData = processedReminders.filter((reminder: Reminder) => {
          const dueDate = new Date(reminder.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today;
        });
        
        setUpcomingReminders(upcomingRemindersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('crm_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_leads',
        filter: `agent_id=eq.${user.id}`
      }, () => {
        // Refresh data when changes occur
        setPage(0);
        setRefreshTrigger(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_reminders',
        filter: `agent_id=eq.${user.id}`
      }, () => {
        // Refresh data when changes occur
        setPage(0);
        setRefreshTrigger(prev => prev + 1);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, page, refreshTrigger]);
  
  // Apply filters and search
  useEffect(() => {
    let results = [...contacts];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(
        contact => 
          contact.full_name.toLowerCase().includes(lowerSearchTerm) ||
          contact.phone_number.includes(searchTerm) ||
          (contact.email && contact.email.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      results = results.filter(contact => contact.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter) {
      results = results.filter(contact => contact.lead_type === typeFilter);
    }
    
    setFilteredContacts(results);
  }, [contacts, searchTerm, statusFilter, typeFilter]);

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleAddContact = () => {
    setIsAddModalOpen(true);
  };
  
  const logActivity = async (contactId: string, activityType: string, description: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('crm_activities')
        .insert({
          lead_id: contactId,
          agent_id: user.id,
          activity_type: activityType,
          description
        });
      
      if (error) throw error;
      
      // Update last_contacted_at field for the contact
      await supabase
        .from('crm_leads')
        .update({
          last_contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);
        
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };
  
  const handleCall = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Log the call activity
    logActivity(contact.id, 'Call', `Called ${contact.full_name}`);
    
    // Open phone dialer
    window.location.href = `tel:${contact.phone_number}`;
  };
  
  const handleWhatsApp = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Log the WhatsApp activity
    logActivity(contact.id, 'WhatsApp', `Messaged ${contact.full_name} on WhatsApp`);
    
    // Format phone number by removing spaces and '+'
    const formattedPhone = contact.phone_number.replace(/[\s+]/g, '');
    
    // Get agent name
    const agentName = user?.user_metadata?.full_name || 'your agent';
    
    // Create WhatsApp message
    const message = encodeURIComponent(`Hi ${contact.full_name}, I am ${agentName} from Agentverify.`);
    
    // Open WhatsApp
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };
  
  const handleEmail = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!contact.email) return;
    
    // Log the email activity
    logActivity(contact.id, 'Email', `Emailed ${contact.full_name}`);
    
    // Open email client
    window.location.href = `mailto:${contact.email}`;
  };
  
  const handleReminderStatusChange = () => {
    // Refresh reminders
    setRefreshTrigger(prev => prev + 1);
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setShowFilters(false);
  };
  
  const handleRefresh = () => {
    setPage(0);
    setRefreshTrigger(prev => prev + 1);
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <button
          onClick={handleAddContact}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>
      
      {/* Upcoming Reminders Section */}
      {upcomingReminders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Bell className="h-5 w-5 text-red-500 mr-2" />
            Upcoming Reminders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingReminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onStatusChange={handleReminderStatusChange}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filter Toggle and Reset */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(statusFilter || typeFilter) && (
                <span className="ml-2 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
                </span>
              )}
            </button>
            
            {(searchTerm || statusFilter || typeFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                Reset
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Buyer">Buyer</option>
                <option value="Renter">Renter</option>
                <option value="Seller">Seller</option>
                <option value="Investor">Investor</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-11 bg-gray-50 p-4 border-b border-gray-200">
          <div className="col-span-3 font-medium text-gray-700">Name</div>
          <div className="col-span-2 font-medium text-gray-700">Phone</div>
          <div className="col-span-1 font-medium text-gray-700">Type</div>
          <div className="col-span-2 font-medium text-gray-700">Status</div>
          <div className="col-span-2 font-medium text-gray-700">Last Contacted</div>
          <div className="col-span-1 font-medium text-gray-700">Actions</div>
        </div>
        
        {/* Loading State */}
        {loading && page === 0 && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}
        
        {/* Empty State */}
        {!loading && filteredContacts.length === 0 && page === 0 && (
          <EmptyState 
            icon={<UserPlus className="h-12 w-12 text-gray-400" />}
            title="No contacts found"
            message={searchTerm || statusFilter || typeFilter ? 
              "Try adjusting your search or filters" : 
              "Add your first contact to get started"}
            action={{
              label: "Add Contact",
              onClick: handleAddContact
            }}
          />
        )}
        
        {/* Contact List */}
        <div className="divide-y divide-gray-200">
          {filteredContacts.map((contact, index) => (
            <div 
              key={contact.id}
              ref={index === filteredContacts.length - 1 ? lastContactElementRef : null}
              className="md:grid md:grid-cols-11 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex flex-col md:flex-row gap-2"
              onClick={() => openContactDetail(contact)}
            >
              {/* Name */}
              <div className="col-span-3 font-medium text-gray-900 flex items-center">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-semibold">
                    {contact.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{contact.full_name}</div>
                  {contact.email && (
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  )}
                </div>
              </div>
              
              {/* Phone */}
              <div className="col-span-2 flex items-center md:justify-start justify-between">
                <div className="text-gray-700 mr-2">{contact.phone_number}</div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => handleCall(contact, e)}
                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                    title="Call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleWhatsApp(contact, e)}
                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  {contact.email && (
                    <button
                      onClick={(e) => handleEmail(contact, e)}
                      className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      title="Email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Type */}
              <div className="col-span-1 flex md:items-center items-start">
                <div className="flex items-center px-2 py-1 bg-gray-100 rounded text-sm">
                  {contact.lead_type === 'Buyer' && <Calendar className="h-4 w-4 mr-1 text-blue-500" />}
                  {contact.lead_type === 'Renter' && <Calendar className="h-4 w-4 mr-1 text-purple-500" />}
                  {contact.lead_type === 'Seller' && <Bell className="h-4 w-4 mr-1 text-orange-500" />}
                  {contact.lead_type === 'Investor' && <CheckCircle className="h-4 w-4 mr-1 text-green-500" />}
                  <span className="hidden sm:inline">{contact.lead_type}</span>
                </div>
              </div>
              
              {/* Status */}
              <div className="col-span-2 flex md:items-center items-start">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                  {contact.status}
                </div>
              </div>
              
              {/* Last Contacted */}
              <div className="col-span-2 flex items-center text-gray-600 text-sm">
                {contact.last_contacted_at ? (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(contact.last_contacted_at).toLocaleDateString()}
                  </div>
                ) : (
                  <span className="text-gray-500">Never contacted</span>
                )}
              </div>
              
              {/* Actions */}
              <div className="col-span-1 flex justify-end items-center">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading More Indicator */}
        {loading && page > 0 && (
          <div className="flex justify-center items-center p-4">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      
      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          contact={selectedContact}
          onContactUpdated={() => {
            setIsDetailModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      
      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onContactAdded={() => {
          setIsAddModalOpen(false);
          setPage(0);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}