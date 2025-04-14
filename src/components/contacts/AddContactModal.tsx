import React, { useState } from 'react';
import { X, Check, User, Phone, Mail, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

export default function AddContactModal({
  isOpen,
  onClose,
  onContactAdded
}: AddContactModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactData, setContactData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    lead_type: 'Buyer',
    status: 'New',
    notes: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!contactData.full_name) {
        throw new Error('Full name is required');
      }
      
      if (!contactData.phone_number) {
        throw new Error('Phone number is required');
      }
      
      // Insert new contact
      const { data, error: insertError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: contactData.full_name,
          phone_number: contactData.phone_number,
          email: contactData.email || null,
          lead_type: contactData.lead_type,
          status: contactData.status,
          notes: contactData.notes || null,
          agent_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Log activity for new contact
      await supabase
        .from('crm_activities')
        .insert({
          lead_id: data.id,
          agent_id: user.id,
          activity_type: 'Note',
          description: 'Contact created'
        });
      
      // Reset form and close modal
      setContactData({
        full_name: '',
        phone_number: '',
        email: '',
        lead_type: 'Buyer',
        status: 'New',
        notes: ''
      });
      
      onContactAdded();
    } catch (err) {
      console.error('Error adding contact:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the contact');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full_name">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={contactData.full_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="Enter full name"
              />
            </div>
          </div>
          
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone_number">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                value={contactData.phone_number}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={contactData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="Enter email address"
              />
            </div>
          </div>
          
          {/* Lead Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lead_type">
                Type
              </label>
              <select
                id="lead_type"
                name="lead_type"
                value={contactData.lead_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="Buyer">Buyer</option>
                <option value="Renter">Renter</option>
                <option value="Seller">Seller</option>
                <option value="Investor">Investor</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={contactData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={contactData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Add any notes or additional information"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}