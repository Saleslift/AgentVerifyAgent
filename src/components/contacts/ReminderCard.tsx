import React, { useState } from 'react';
import { Bell, Calendar, Check, RefreshCw, AlertCircle, Clock, User } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface Contact {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  lead_type: string;
  status: string;
}

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

interface ReminderCardProps {
  reminder: Reminder;
  onStatusChange: () => void;
}

export default function ReminderCard({
  reminder,
  onStatusChange
}: ReminderCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isOverdue = new Date(reminder.due_date) < new Date();
  const dueDateFormatted = new Date(reminder.due_date).toLocaleString();
  
  const getDaysDifference = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(reminder.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getStatusText = () => {
    const daysDiff = getDaysDifference();
    
    if (daysDiff < 0) {
      return `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
    } else if (daysDiff === 0) {
      return 'Due today';
    } else {
      return `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
    }
  };
  
  const handleMarkComplete = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update reminder status
      const { error: updateError } = await supabase
        .from('crm_reminders')
        .update({
          is_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      if (updateError) throw updateError;
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          lead_id: reminder.lead_id,
          agent_id: user.id,
          activity_type: 'Note',
          description: `Completed reminder: ${reminder.title}`
        });
      
      onStatusChange();
    } catch (err) {
      console.error('Error marking reminder complete:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newDueDate) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update reminder due date
      const { error: updateError } = await supabase
        .from('crm_reminders')
        .update({
          due_date: new Date(newDueDate).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      if (updateError) throw updateError;
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          lead_id: reminder.lead_id,
          agent_id: user.id,
          activity_type: 'Note',
          description: `Rescheduled reminder: ${reminder.title}`
        });
      
      setRescheduling(false);
      onStatusChange();
    } catch (err) {
      console.error('Error rescheduling reminder:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg border ${
      isOverdue ? 'border-red-200' : 'border-yellow-200'
    } shadow-sm p-4`}>
      {error && (
        <div className="mb-3 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <div className={`p-1.5 rounded-full ${
            isOverdue ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
          } mr-2`}>
            <Bell className="h-4 w-4" />
          </div>
          <h3 className="font-medium text-gray-900">{reminder.title}</h3>
        </div>
        
        <div className={`text-xs font-medium ${
          isOverdue ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <User className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm text-gray-600">
          {reminder.lead?.full_name || 'Unknown Contact'}
        </span>
      </div>
      
      <div className="flex items-center mb-3">
        <Clock className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm text-gray-600">{dueDateFormatted}</span>
      </div>
      
      {reminder.description && (
        <p className="text-sm text-gray-700 mb-3">
          {reminder.description}
        </p>
      )}
      
      {rescheduling ? (
        <form onSubmit={handleReschedule} className="mt-2">
          <div className="flex space-x-2 mb-2">
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setRescheduling(false)}
              className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 text-xs bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <LoadingSpinner size="xs" className="mr-1" />
              ) : (
                <Calendar className="h-3 w-3 mr-1" />
              )}
              Reschedule
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between">
          <button
            onClick={() => setRescheduling(true)}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reschedule
          </button>
          
          <button
            onClick={handleMarkComplete}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 text-xs"
          >
            {loading ? (
              <LoadingSpinner size="xs" className="mr-1" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}