import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { Hash, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Channel {
  id: string;
  title: string;
  description: string;
  owner_id: string;
}

export default function EditChannel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setChannel(data);
        setTitle(data.title);
        setDescription(data.description || '');
      } catch (error: unknown) {
        console.error('Error loading channel:', error);
        toast.error('チャンネルの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };


    fetchChannel();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle === channel.title && trimmedDescription === channel.description) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('channels')
        .update({
          title: trimmedTitle,
          description: trimmedDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast.success('チャンネルの更新に成功しました');
      navigate(`/channels/${id}`);
    } catch (error: unknown) {
      console.error('Update error:', error);
      toast.error('チャンネルの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!channel) {
    return <Navigate to="/channels" />;
  }

  if (channel.owner_id !== user?.id) {
    return <Navigate to={`/channels/${id}`} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/channels/${id}`}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        チャンネル詳細に戻る
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center mb-8">
          <Hash className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">チャンネル編集</h1>
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
            disabled={saving || !title.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
