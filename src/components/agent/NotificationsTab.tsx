import React, { useState, useEffect } from 'react';
import { Bell, Check, AlertCircle, Info, Calendar, Clock, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AgencyInvitationDetails from './AgencyInvitationDetails';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link_url?: string;
  agency_id?: string;
  token?: string;
}

export default function NotificationsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Process data to handle agency_invitation and alert notifications correctly
        const processedData = (data || []).map(notification => {
          // Check if it's an agency invitation notification (type "alert")
          if (notification.type === 'alert' && notification.link_url?.includes('agency_id=')) {
            // Extract agency_id from the link_url if present
            let agencyId = null;
            const match = notification.link_url.match(/agency_id=([^&]*)/);
            if (match && match[1]) {
              agencyId = match[1];
            }
            return { ...notification, agency_id: agencyId, type: 'agency_invitation' };
          }
          return notification;
        }) ;

        console.log('Fetched notifications:', processedData);
        setNotifications(processedData || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to notifications for real-time updates
    const subscription = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user?.id)
        .eq('is_read', false);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'alert': // Use the same icon for "alert" notifications
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'review':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'deal':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'agency_invitation':
        return <Building2 className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification, e: React.MouseEvent) => {
    // Prevent default navigation and bubbling
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }

    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const handleNotificationStatusChange = () => {
    // Refresh notifications
    if (user) {
      const fetchNotifications = async () => {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setNotifications(data);
        }
      };

      fetchNotifications();
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(notif => !notif.is_read);

  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-black text-white text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'all' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'unread' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => {
            const isAgencyInvite = notification.type === 'agency_invitation';

            return (
              <div
                key={notification.id}
                role="presentation"
                className={`bg-white rounded-lg shadow-sm border ${
                  notification.is_read ? 'border-gray-200' : 'border-l-4 border-l-black border-gray-200'
                } hover:shadow-md transition-all duration-200`}
                onClick={(e) => handleNotificationClick(notification, e)}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-black'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-1 text-gray-500 text-xs">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeAgo(notification.created_at)}</span>
                        </div>
                      </div>

                      <p className={`mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>

                      {/* Display AgencyInvitationDetails for "alert" notifications */}
                      {isAgencyInvite && (
                        <AgencyInvitationDetails
                          notificationToken={notification.token}
                          agencyId={notification.agency_id || ''}
                          onStatusChange={handleNotificationStatusChange}
                        />
                      )}

                      {/* Mark as Read Button */}
                      {!notification.is_read && (
                        <div className="mt-2 flex justify-end">
                          <button
                            className="text-xs text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No notifications yet.'
                : 'No unread notifications.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

