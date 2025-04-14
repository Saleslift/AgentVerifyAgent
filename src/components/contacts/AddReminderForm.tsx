import React, { useState } from 'react';
import { Calendar, Clock, Bell, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface AddReminderFormProps {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddReminderForm({
  contactId,
  onSuccess,
  onCancel
}: AddReminderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderData, setReminderData] = useState({
    title: '',
    description: '',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16) // Default to tomorrow
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReminderData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!reminderData.title) {
        throw new Error('Title is required');
      }
      
      if (!reminderData.due_date) {
        throw new Error('Due date is required');
      }
      
      // Insert reminder
      const { data, error: insertError } = await supabase
        .from('crm_reminders')
        .insert({
          lead_id: contactId,
          agent_id: user.id,
          title: reminderData.title,
          description: reminderData.description || null,
          due_date: reminderData.due_date,
          is_completed: false
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          lead_id: contactId,
          agent_id: user.id,
          activity_type: 'Note',
          description: `Added reminder: ${reminderData.title}`
        });
      
      // Create notification for the due date
      const dueDate = new Date(reminderData.due_date);
      const formattedDate = dueDate.toLocaleDateString();
      
      await supabase
        .from('notifications')
        .insert({
          recipient_id: user.id,
          type: 'system',
          title: 'Reminder',
          message: `${reminderData.title} - Due on ${formattedDate}`,
          link_url: `/contacts?reminder=${data.id}`,
          is_read: false
        });
      
      onSuccess();
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the reminder');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={reminderData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
          placeholder="Enter reminder title"
        />
      </div>
      
      {/* Due Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="due_date">
          Due Date & Time *
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="due_date"
            name="due_date"
            type="datetime-local"
            required
            value={reminderData.due_date}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={reminderData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
          placeholder="Add additional details about this reminder"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
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
              <Bell className="h-4 w-4 mr-2" />
              Add Reminder
            </>
          )}
        </button>
      </div>
    </form>
  );
}