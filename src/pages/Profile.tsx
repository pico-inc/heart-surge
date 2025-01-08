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

interface DatabaseProfile {
  id: string;
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
}

interface OwnedChannel {
  id: string;
  title: string;
  owner_id: string;
  participant_count: number;
}

interface DatabaseJoinedChannel {
  channel: {
    id: string;
    title: string;
    owner_id: string;
    participant_count: Array<{ count: number; }>;
  };
}

interface JoinedChannel {
  id: string;
  title: string;
  owner_id: string;
  participant_count: number;
}

interface PostgrestError {
  code: string;
  message: string;
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
  const [joinedChannels, setJoinedChannels] = useState<JoinedChannel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<OwnedChannel[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single() as {
            data: DatabaseProfile | null;
            error: unknown;
          };

        if (data) {
          setProfile({
            username: data.username || '',
            prefecture: data.prefecture || '',
            age_group: data.age_group || '',
            occupation: data.occupation || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (error: unknown) {
        console.error('Error loading profile:', error);
        toast.error('プロフィールの読み込みに失敗しました');
      }
    };

    const fetchChannels = async () => {
      try {
        const { data: ownedData, error: ownedError } = await supabase
          .from('channels')
          .select(`
            id,
            title,
            owner_id,
            participant_count:channel_participants(count)
          `)
          .eq('owner_id', user?.id) as {
            data: Array<{
              id: string;
              title: string;
              owner_id: string;
              participant_count: Array<{ count: number }>;
            }> | null;
            error: PostgrestError | null;
          };

        if (ownedError) throw ownedError;

        const ownedChannelIds = new Set(ownedData?.map(channel => channel.id) || []);

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
          .eq('user_id', user?.id) as {
            data: DatabaseJoinedChannel[] | null;
            error: PostgrestError | null;
          };

        if (joinedError) throw joinedError;

        const formattedOwnedChannels = ownedData?.map(channel => ({
          ...channel,
          participant_count: channel.participant_count?.[0]?.count ?? 0
        })) || [];

        const formattedJoinedChannels = joinedData
          ?.filter(item => !ownedChannelIds.has(item.channel.id))
          .map(item => ({
            ...item.channel,
            participant_count: item.channel.participant_count[0]?.count ?? 0
          })) || [];

        setOwnedChannels(formattedOwnedChannels);
        setJoinedChannels(formattedJoinedChannels);

      } catch (error: unknown) {
        console.error('Error loading channels:', error);
        toast.error('チャンネルの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchChannels();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('プロフィールの更新に成功しました');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      toast.error('プロフィールの更新に失敗しました');
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
          <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              ユーザー名
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
              都道府県
            </label>
            <select
              id="prefecture"
              value={profile.prefecture}
              onChange={(e) => setProfile({ ...profile, prefecture: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">都道府県を選択</option>
              <option value="tokyo">東京都</option>
              <option value="osaka">大阪府</option>
              <option value="kyoto">京都府</option>
            </select>
          </div>

          <div>
            <label htmlFor="age_group" className="block text-sm font-medium text-gray-700">
              年代
            </label>
            <select
              id="age_group"
              value={profile.age_group}
              onChange={(e) => setProfile({ ...profile, age_group: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">年代を選択</option>
              <option value="10s">10代</option>
              <option value="20s">20代</option>
              <option value="30s">30代</option>
              <option value="40s">40代</option>
              <option value="50s">50代</option>
              <option value="60+">60代以上</option>
            </select>
          </div>

          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
              職業
            </label>
            <select
              id="occupation"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">職業を選択</option>
              <option value="student">学生</option>
              <option value="employed">雇用者</option>
              <option value="self-employed">自営業</option>
              <option value="unemployed">無職</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </div>

      {/* Owned Channels */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">作成したチャンネル</h2>
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
                {channel.participant_count} 人
              </span>
            </Link>
          ))}
          {ownedChannels.length === 0 && (
            <p className="text-gray-600 text-center py-4">
              作成したチャンネルはありません
            </p>
          )}
        </div>
      </div>

      {/* Joined Channels */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">参加しているチャンネル</h2>
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
                {channel.participant_count} 人
              </span>
            </Link>
          ))}
          {joinedChannels.length === 0 && (
            <p className="text-gray-600 text-center py-4">
              参加しているチャンネルはありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
