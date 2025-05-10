import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  ImageIcon,
  FileText,
  Paperclip,
  XCircle,
  ArrowRight,
  Loader2,
  Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';

interface DealChatProps {
  dealId: string;
  deal: any;
}

const DealChat: React.FC<DealChatProps> = ({ dealId, deal }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [partnerAgent, setPartnerAgent] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!dealId || !user) return;

    fetchMessages();
    fetchPartnerAgent();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`deal-chat-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_messages',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          console.log('New message:', payload);
          setMessages(prevMessages => [...prevMessages, payload.new]);

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [dealId, user]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!dealId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crm_messages')
        .select(`
          *,
          sender:sender_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('deal_id', dealId)
        .order('created_at');

      if (fetchError) throw fetchError;

      setMessages(data || []);

      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Mark messages as read
      markMessagesAsRead();

    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch partner agent information
  const fetchPartnerAgent = () => {
    if (!deal || !user) return;

    const isListingAgent = deal.agent_id === user.id;
    const partnerId = isListingAgent ? deal.co_agent_id : deal.agent_id;

    if (partnerId) {
      // Set partner agent from deal data
      setPartnerAgent(isListingAgent ? deal.co_agent : deal.agent);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!dealId || !user) return;

    try {
      await supabase
        .from('crm_messages')
        .update({ is_read: true })
        .eq('deal_id', dealId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!dealId || !user || (!newMessage.trim() && !selectedFile)) return;

    try {
      setSending(true);
      setError(null);

      // Handle file upload first if a file is selected
      if (selectedFile) {
        await handleFileUpload();
      }

      // Only send text message if there's actual text
      if (newMessage.trim()) {
        const { error: sendError } = await supabase
          .from('crm_messages')
          .insert({
            deal_id: dealId,
            sender_id: user.id,
            message: newMessage.trim(),
            is_read: false,
            created_at: new Date().toISOString()
          });

        if (sendError) throw sendError;
        fetchMessages();
      }

      // Clear the input
      setNewMessage('');

      // Log activity
      if (newMessage.trim()) {
        await supabase
          .from('crm_activities')
          .insert({
            deal_id: dealId,
            agent_id: user.id,
            activity_type: 'Message',
            description: 'Sent a message'
          });
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!dealId || !user || !selectedFile) return;

    try {
      // Generate a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${dealId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from('crm-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crm-documents')
        .getPublicUrl(fileName);

      // Create a document record
      await supabase
        .from('crm_documents')
        .insert({
          deal_id: dealId,
          name: selectedFile.name,
          type: getFileType(selectedFile.name),
          file_path: publicUrl,
          file_name: fileName,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          category: 'chat'
        });

      // Add a special message indicating a file was shared
      const { error: messageError } = await supabase
        .from('crm_messages')
        .insert({
          deal_id: dealId,
          sender_id: user.id,
          message: `📎 Shared a file: ${selectedFile.name}`,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Reset file state
      setSelectedFile(null);
      setUploadProgress(0);

      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          deal_id: dealId,
          agent_id: user.id,
          activity_type: 'file_upload',
          description: `Shared a file in chat: ${selectedFile.name}`
        });

    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  };

  // Determine file type based on extension
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'image';
    } else if (['pdf'].includes(extension || '')) {
      return 'PDF';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'Word';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return 'Excel';
    }

    return 'Document';
  };

  // Format timestamps
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Check if date should be displayed (first message or different day)
  const shouldShowDate = (message: any, index: number) => {
    if (index === 0) return true;

    const prevDate = new Date(messages[index - 1].created_at);
    const currDate = new Date(message.created_at);

    return (
      prevDate.getDate() !== currDate.getDate() ||
      prevDate.getMonth() !== currDate.getMonth() ||
      prevDate.getFullYear() !== currDate.getFullYear()
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle keypress (send on Enter)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[calc(90vh-150px)]">
      {/* Chat Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
        {partnerAgent ? (
          <>
            <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-100">
              {partnerAgent.avatar_url ? (
                <img
                  src={partnerAgent.avatar_url}
                  alt={partnerAgent.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">
                {partnerAgent.full_name}
              </h2>
              <p className="text-sm text-gray-500">
                {deal.property?.title || deal.project?.title || 'Property Deal'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">
                Deal Chat
              </h2>
              <p className="text-sm text-gray-500">
                {deal.property?.title || deal.project?.title || 'Property Deal'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageIcon className="h-12 w-12 text-gray-300 mb-2" />
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">
              Start the conversation by sending a message to your partner.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {shouldShowDate(message, index) && (
                  <div className="flex justify-center my-4">
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                )}

                <div className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden">
                      {message.sender?.avatar_url ? (
                        <img
                          src={message.sender.avatar_url}
                          alt={message.sender.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-200">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Message content */}
                    <div
                      className={`mx-2 px-4 py-3 rounded-t-lg ${
                        message.sender_id === user?.id 
                          ? 'bg-blue-600 text-white rounded-bl-lg rounded-br-none' 
                          : 'bg-gray-200 text-gray-800 rounded-br-lg rounded-bl-none'
                      } max-w-xs sm:max-w-md`}
                    >
                      {message.message.startsWith('📎 Shared a file:') ? (
                        <div className="flex items-center">
                          <FileText className={`h-4 w-4 ${
                            message.sender_id === user?.id ? 'text-blue-300' : 'text-gray-500'
                          } mr-2`} />
                          <span>{message.message}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.message}</p>
                      )}
                      <div className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-blue-300' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="text-sm truncate max-w-[250px]">{selectedFile.name}</span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {error && (
          <div className="text-red-500 text-sm mb-2">
            {error}
          </div>
        )}

        <div className="flex items-end space-x-4">
          <div className="relative flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-black focus:border-transparent"
              rows={1}
              disabled={sending}
            />
            <div className="absolute right-2 bottom-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={sending || (!newMessage.trim() && !selectedFile)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Message icon component
const MessageIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);

export default DealChat;
