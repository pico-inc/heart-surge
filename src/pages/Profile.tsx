import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, Hash, Camera, UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProfileData {
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
  device_info: string;
}

interface DatabaseProfile {
  id: string;
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
  device_info: string;
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
  device_info: '',
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [joinedChannels, setJoinedChannels] = useState<JoinedChannel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<OwnedChannel[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            device_info: data.device_info || '',
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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('JPGまたはPNG形式の画像を選択してください');
        return;
      }

      if (file.size > 3 * 1024 * 1024) {
        toast.error('ファイルサイズは3MB以下にしてください');
        return;
      }

      if (!user?.id) {
        toast.error('ユーザー情報が取得できません');
        return;
      }

      // タイムスタンプを含むファイル名を生成
      const timestamp = new Date().getTime();
      const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
      const fileName = `${user.id}/profile_${timestamp}.${fileExt}`;

      // 既存の画像がある場合は削除
      if (profile.avatar_url) {
        const existingPath = profile.avatar_url.split('/').slice(-2).join('/'); // "user_id/filename" の形式を取得
        const { error: removeError } = await supabase.storage
          .from('profile_images')
          .remove([existingPath]);

        if (removeError) throw removeError;
      }

      // 新しい画像をアップロード
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, {
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // 新しいURLを取得
      const { data: urlData } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);

      // プロフィールを更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({
        ...prev,
        avatar_url: urlData.publicUrl
      }));

      toast.success('プロフィール画像を更新しました');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('画像のアップロードに失敗しました');
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
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-4">
              プロフィール画像
            </label>
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-indigo-100 p-3 rounded-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-indigo-600" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/jpeg,image/png"
              className="hidden"
            />
          </div>

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
              <option value="hokkaido">北海道</option>
              <option value="aomori">青森県</option>
              <option value="iwate">岩手県</option>
              <option value="miyagi">宮城県</option>
              <option value="akita">秋田県</option>
              <option value="yamagata">山形県</option>
              <option value="fukushima">福島県</option>
              <option value="ibaraki">茨城県</option>
              <option value="tochigi">栃木県</option>
              <option value="gunma">群馬県</option>
              <option value="saitama">埼玉県</option>
              <option value="chiba">千葉県</option>
              <option value="tokyo">東京都</option>
              <option value="kanagawa">神奈川県</option>
              <option value="niigata">新潟県</option>
              <option value="toyama">富山県</option>
              <option value="ishikawa">石川県</option>
              <option value="fukui">福井県</option>
              <option value="yamanashi">山梨県</option>
              <option value="nagano">長野県</option>
              <option value="gifu">岐阜県</option>
              <option value="shizuoka">静岡県</option>
              <option value="aichi">愛知県</option>
              <option value="mie">三重県</option>
              <option value="shiga">滋賀県</option>
              <option value="kyoto">京都府</option>
              <option value="osaka">大阪府</option>
              <option value="hyogo">兵庫県</option>
              <option value="nara">奈良県</option>
              <option value="wakayama">和歌山県</option>
              <option value="tottori">鳥取県</option>
              <option value="shimane">島根県</option>
              <option value="okayama">岡山県</option>
              <option value="hiroshima">広島県</option>
              <option value="yamaguchi">山口県</option>
              <option value="tokushima">徳島県</option>
              <option value="kagawa">香川県</option>
              <option value="ehime">愛媛県</option>
              <option value="kochi">高知県</option>
              <option value="fukuoka">福岡県</option>
              <option value="saga">佐賀県</option>
              <option value="nagasaki">長崎県</option>
              <option value="kumamoto">熊本県</option>
              <option value="oita">大分県</option>
              <option value="miyazaki">宮崎県</option>
              <option value="kagoshima">鹿児島県</option>
              <option value="okinawa">沖縄県</option>
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

          <div>
            <label htmlFor="device_info" className="block text-sm font-medium text-gray-700">
              使用している支援機器
            </label>
            <textarea
              id="device_info"
              value={profile.device_info || ''}
              onChange={(e) => setProfile({ ...profile, device_info: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="使用している補聴器などの支援機器について自由に記入してください"
            />
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
