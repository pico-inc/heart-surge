import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  last_message: string;
  last_message_at: string;
  participants: {
    id: string;
    username: string;
  }[];
}

export default function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chat_participants')
        .select(`
          chat:chats (
            id,
            last_message,
            last_message_at
          ),
          profiles!chat_participants_user_id_fkey (
            id,
            username
          )
        `)
        .eq('user_id', user?.id);

      if (chatError) throw chatError;

      // Transform the data into the required format
      const formattedChats = chatData.reduce((acc: Chat[], participant) => {
        const existingChat = acc.find(c => c.id === participant.chat.id);
        if (existingChat) {
          if (participant.profiles.id !== user?.id) {
            existingChat.participants.push(participant.profiles);
          }
        } else {
          acc.push({
            id: participant.chat.id,
            last_message: participant.chat.last_message,
            last_message_at: participant.chat.last_message_at,
            participants: participant.profiles.id !== user?.id ? [participant.profiles] : []
          });
        }
        return acc;
      }, []);

      setChats(formattedChats.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ));
    } catch (error: any) {
      console.error('Error loading chats:', error);
      toast.error('Error loading chats');
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

      <div className="space-y-4">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            to={`/chats/${chat.id}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {chat.participants[0]?.username || 'Unknown User'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {chat.last_message_at && new Date(chat.last_message_at).toLocaleDateString()}
                </span>
              </div>
              {chat.last_message && (
                <p className="text-gray-600 text-sm truncate">{chat.last_message}</p>
              )}
            </div>
          </Link>
        ))}

        {chats.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
}