import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Send, Hash } from 'lucide-react';
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

interface Channel {
  id: string;
  title: string;
}

export default function ChannelChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkParticipation();
    fetchChannel();
    fetchMessages();

    const channel = supabase
      .channel('channel-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${id}`
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.sender_id)
            .single();

          if (senderData) {
            const messageWithSender = {
              ...payload.new,
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

  const checkParticipation = async () => {
    if (!user) return;
    
    try {
      const { count } = await supabase
        .from('channel_participants')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', id)
        .eq('user_id', user.id);

      setIsParticipant(count === 1);
    } catch (error: any) {
      console.error('Error checking participation:', error);
      setIsParticipant(false);
    }
  };

  const fetchChannel = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, title')
        .eq('id', id)
        .single();

      if (error) throw error;
      setChannel(data);
    } catch (error: any) {
      toast.error('Error loading channel');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('channel_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles(username)
        `)
        .eq('channel_id', id)
        .order('created_at');

      if (error) throw error;
      setMessages(data || []);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('channel_messages')
        .insert([
          {
            channel_id: id,
            sender_id: user.id,
            content: messageContent
          }
        ]);

      if (error) throw error;
    } catch (error: any) {
      toast.error('Error sending message');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isParticipant) {
    return <Navigate to={`/channels/${id}`} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center">
          <Link
            to={`/channels/${id}`}
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center">
            <Hash className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium">{channel?.title}</span>
          </div>
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
                <div className="text-xs opacity-75 mb-1">
                  {message.sender.username}
                </div>
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