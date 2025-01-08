import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    username: string;
  };
}

interface ChatParticipant {
  id: string;
  username: string;
}

export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch the sender information
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMessage.sender_id)
            .single();

          if (senderData) {
            const messageWithSender = {
              ...newMessage,
              sender: { username: senderData.username }
            };
            
            setMessages(prev => [...prev, messageWithSender]);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchMessages = async () => {
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles(username)
        `)
        .eq('chat_id', id)
        .order('created_at');

      if (messagesError) throw messagesError;

      // Fetch participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          profiles(
            id,
            username
          )
        `)
        .eq('chat_id', id)
        .neq('user_id', user?.id)
        .single();

      if (participantError) throw participantError;

      setMessages(messagesData || []);
      setParticipant(participantData.profiles);
    } catch (error: any) {
      toast.error('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: id,
            sender_id: user.id,
            content: messageContent
          }
        ])
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles(username)
        `)
        .single();

      if (messageError) throw messageError;

      if (messageData) {
        // Optimistically add the message to the UI
        setMessages(prev => [...prev, messageData]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      const { error: updateError } = await supabase
        .from('chats')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error: any) {
      toast.error('Error sending message');
      console.error('Send message error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center">
          <Link
            to="/chats"
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-medium">{participant?.username}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender_id === user?.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}