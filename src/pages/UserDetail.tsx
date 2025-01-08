import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, MapPin, Briefcase, Calendar, ArrowLeft, MessageCircle, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
  created_at: string;
}

interface Channel {
  id: string;
  title: string;
  participant_count: number;
  owner_id?: string;
}

export default function UserDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchUser();
    fetchChannels();
  }, [id]);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error: any) {
      toast.error('Error loading user profile');
    }
  };

  const fetchChannels = async () => {
    if (!id) return;

    try {
      // Fetch owned channels first
      const { data: ownedData, error: ownedError } = await supabase
        .from('channels')
        .select(`
          id,
          title,
          owner_id,
          participant_count:channel_participants(count)
        `)
        .eq('owner_id', id);

      if (ownedError) throw ownedError;

      const ownedChannelIds = new Set(ownedData?.map(channel => channel.id) || []);

      // Fetch joined channels
      const { data: joinedData, error: joinedError } = await supabase
        .from('channel_participants')
        .select(`
          channel:channels (
            id,
            title,
            owner_id,
            participant_count:channel_participants(count)
          )
        `)
        .eq('user_id', id);

      if (joinedError) throw joinedError;

      setOwnedChannels(ownedData?.map(channel => ({
        ...channel,
        participant_count: channel.participant_count[0].count
      })) || []);

      // Filter out owned channels from joined channels
      const filteredJoinedChannels = joinedData
        ?.filter(item => !ownedChannelIds.has(item.channel.id))
        .map(item => ({
          ...item.channel,
          participant_count: item.channel.participant_count[0].count
        })) || [];

      setJoinedChannels(filteredJoinedChannels);
    } catch (error: any) {
      toast.error('Error loading channels');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    if (!currentUser || !id) return;

    try {
      // First check if a chat already exists between these users
      const { data: existingChats, error: existingChatsError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chat:chats!inner(id)
        `)
        .eq('user_id', currentUser.id);

      if (existingChatsError) throw existingChatsError;

      // If there are existing chats, check if any of them include the target user
      if (existingChats && existingChats.length > 0) {
        const chatIds = existingChats.map(chat => chat.chat_id);
        
        const { data: sharedChats, error: sharedChatsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', id)
          .in('chat_id', chatIds);

        if (sharedChatsError) throw sharedChatsError;

        if (sharedChats && sharedChats.length > 0) {
          // Chat exists, navigate to it
          navigate(`/chats/${sharedChats[0].chat_id}`);
          return;
        }
      }

      // No existing chat found, create a new one
      const { data: newChat, error: createChatError } = await supabase
        .from('chats')
        .insert([{}])
        .select()
        .single();

      if (createChatError) throw createChatError;

      // Add both users as participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: id }
        ]);

      if (participantsError) throw participantsError;

      // Navigate to the new chat
      navigate(`/chats/${newChat.id}`);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Error starting chat');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Link to="/users" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/users"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Members
      </Link>

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full">
                <UserIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                {user.age_group && (
                  <span className="text-indigo-100">{user.age_group}</span>
                )}
              </div>
            </div>
            {currentUser?.id !== user.id && (
              <button
                onClick={startChat}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Message</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {user.prefecture && (
            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>Lives in {user.prefecture}</span>
            </div>
          )}

          {user.occupation && (
            <div className="flex items-center space-x-3 text-gray-600">
              <Briefcase className="h-5 w-5" />
              <span>{user.occupation}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 text-gray-600">
            <Calendar className="h-5 w-5" />
            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Owned Channels */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Created Channels</h2>
        <div className="grid gap-4">
          {ownedChannels.map((channel) => (
            <Link
              key={channel.id}
              to={`/channels/${channel.id}`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="font-medium">{channel.title}</span>
              </div>
              <span className="text-sm text-gray-600">
                {channel.participant_count} members
              </span>
            </Link>
          ))}
          {ownedChannels.length === 0 && (
            <p className="text-gray-600 text-center py-4">
              No channels created yet
            </p>
          )}
        </div>
      </div>

      {/* Joined Channels */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Joined Channels</h2>
        <div className="grid gap-4">
          {joinedChannels.map((channel) => (
            <Link
              key={channel.id}
              to={`/channels/${channel.id}`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="font-medium">{channel.title}</span>
              </div>
              <span className="text-sm text-gray-600">
                {channel.participant_count} members
              </span>
            </Link>
          ))}
          {joinedChannels.length === 0 && (
            <p className="text-gray-600 text-center py-4">
              No channels joined yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}