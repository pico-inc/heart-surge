import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CreateChannel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('channel_participants')
        .insert([
          {
            channel_id: channel.id,
            user_id: user.id
          }
        ]);

      if (participantError) throw participantError;

      toast.success('チャンネルの作成に成功しました');
      navigate(`/channels/${channel.id}`);
    } catch (error: unknown) {
      console.error('Create channel error:', error);
      toast.error('チャンネルの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center mb-8">
          <Hash className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">チャンネル作成</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              チャンネル名
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="チャンネル名を入力"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="チャンネルの説明を入力"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '作成中...' : 'チャンネル作成'}
          </button>
        </form>
      </div>
    </div>
  );
}
