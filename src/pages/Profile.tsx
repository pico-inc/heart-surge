import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProfileData {
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
}

interface Channel {
  id: string;
  title: string;
  participant_count: number;
  owner_id?: string;
}

const DEFAULT_PROFILE: ProfileData = {
  username: '',
  prefecture: '',
  age_group: '',
  occupation: '',
  avatar_url: '',
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<Channel[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
    fetchChannels();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user?.id,
            username: user?.email?.split('@')[0] || 'user',
            prefecture: '',
            age_group: '',
            occupation: '',
            avatar_url: '',
          }])
          .select()
          .single();

        if (createError) throw createError;
        data = newProfile;
      } else if (error) {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || '',
          prefecture: data.prefecture || '',
          age_group: data.age_group || '',
          occupation: data.occupation || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error: any) {
      toast.error('Error loading profile');
    }
  };

  const fetchChannels = async () => {
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
        .eq('owner_id', user?.id);

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
        .eq('user_id', user?.id);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Settings */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center mb-8">
          <Settings className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
              Prefecture
            </label>
            <select
              id="prefecture"
              value={profile.prefecture}
              onChange={(e) => setProfile({ ...profile, prefecture: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Prefecture</option>
              <option value="tokyo">Tokyo</option>
              <option value="osaka">Osaka</option>
              <option value="kyoto">Kyoto</option>
            </select>
          </div>

          <div>
            <label htmlFor="age_group" className="block text-sm font-medium text-gray-700">
              Age Group
            </label>
            <select
              id="age_group"
              value={profile.age_group}
              onChange={(e) => setProfile({ ...profile, age_group: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Age Group</option>
              <option value="10s">10s</option>
              <option value="20s">20s</option>
              <option value="30s">30s</option>
              <option value="40s">40s</option>
              <option value="50s">50s</option>
              <option value="60+">60+</option>
            </select>
          </div>

          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
              Occupation
            </label>
            <select
              id="occupation"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Occupation</option>
              <option value="student">Student</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Owned Channels */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Channels</h2>
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
              You haven't created any channels yet
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
              You haven't joined any channels yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}