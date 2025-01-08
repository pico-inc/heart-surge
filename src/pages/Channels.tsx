import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hash, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Channel {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
  participant_count: number;
  owner: {
    username: string;
  };
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          owner:profiles!channels_owner_id_fkey(username),
          participant_count:channel_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChannels(data.map(channel => ({
        ...channel,
        participant_count: channel.participant_count[0].count
      })));
    } catch (error: unknown) {
      console.error('Error loading channels:', error);
      toast.error('チャンネルの読み込みに失敗しました');
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">チャンネル一覧</h1>
        <Link
          to="/channels/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          チャンネルを作成
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            to={`/channels/${channel.id}`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Hash className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{channel.title}</h2>
                <p className="text-sm text-gray-600">作成者: {channel.owner.username}</p>
              </div>
            </div>

            {channel.description && (
              <p className="text-gray-600 mb-4 line-clamp-2">{channel.description}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{channel.participant_count} メンバー</span>
              <span>{new Date(channel.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {channels.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">チャンネルはありません</p>
          <Link
            to="/channels/create"
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            チャンネルを作成
          </Link>
        </div>
      )}
    </div>
  );
}
