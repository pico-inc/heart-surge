import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Hash, ArrowLeft, MessageCircle, Users, User, Settings, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Channel {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
  owner: {
    username: string;
  };
}

interface Participant {
  id: string;
  username: string;
  prefecture?: string;
  occupation?: string;
}

export default function ChannelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannel();
    fetchParticipants();
    if (user) {
      checkParticipation();
    }
  }, [id, user]);

  const fetchChannel = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          owner:profiles!channels_owner_id_fkey(username)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setChannel(data);
    } catch (error: unknown) {
      console.error('Error loading channel:', error);
      toast.error('Error loading channel');
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('channel_participants')
        .select(`
          profiles (
            id,
            username,
            prefecture,
            occupation
          )
        `)
        .eq('channel_id', id);
      if (error) throw error;
      setParticipants(data.map(item => item.profiles) as unknown as Participant[]);
    } catch (error: unknown) {
      console.error('Error loading participants:', error);
      toast.error('Error loading participants');
    } finally {
      setLoading(false);
    }
  };

  const checkParticipation = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('channel_participants')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', id)
        .eq('user_id', user.id);

      setIsParticipant(count === 1);
    } catch (error: unknown) {
      console.error('Error checking participation:', error);
      setIsParticipant(false);
    }
  };

  const handleJoinChannel = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('channel_participants')
        .insert([
          { channel_id: id, user_id: user.id }
        ]);

      if (error) throw error;

      setIsParticipant(true);
      fetchParticipants();
      toast.success('チャンネルに参加しました');
    } catch (error: unknown) {
      console.error('Error joining channel:', error);
      toast.error('チャンネルに参加できませんでした');
    }
  };

  const handleLeaveChannel = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('channel_participants')
        .delete()
        .eq('channel_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsParticipant(false);
      fetchParticipants();
      toast.success('チャンネルから退出しました');
    } catch (error: unknown) {
      console.error('Error leaving channel:', error);
      toast.error('チャンネルから退出できませんでした');
    }
  };

  const handleDeleteChannel = async () => {
    if (!user || !channel || user.id !== channel.owner_id) return;

    if (!window.confirm('このチャンネルを削除しますか？\n※この操作は取り消せません。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('チャンネルを削除しました');
      navigate('/channels');
    } catch (error: unknown) {
      console.error('Error deleting channel:', error);
      toast.error('チャンネルの削除に失敗しました');
    }
  };

  const goToChat = () => {
    navigate(`/channels/${id}/chat`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">チャンネルが見つかりません</p>
        <Link to="/channels" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
          チャンネル一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/channels"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        チャンネル一覧へ戻る
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shrink-0">
                <Hash className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{channel.title}</h1>
                <div className="flex flex-wrap items-center text-indigo-100 gap-x-2 gap-y-1">
                  <span className="truncate">作成者: {channel.owner.username}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{participants.length} メンバー</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user?.id === channel.owner_id && (
                <>
                  <Link
                    to={`/channels/${id}/edit`}
                    className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center space-x-2 shrink-0"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="hidden sm:inline">チャンネル編集</span>
                  </Link>
                  <button
                    onClick={handleDeleteChannel}
                    className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2 shrink-0"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">チャンネル削除</span>
                  </button>
                </>
              )}
              {isParticipant && (
                <button
                  onClick={goToChat}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center space-x-2 shrink-0"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">チャットを開く</span>
                </button>
              )}
              {user && user.id !== channel.owner_id && (
                <button
                  onClick={isParticipant ? handleLeaveChannel : handleJoinChannel}
                  className={`px-4 py-2 rounded-lg transition-colors shrink-0 ${
                    isParticipant
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-white'
                  }`}
                >
                  {isParticipant ? 'チャンネルから退出' : 'チャンネルに参加'}
                  <span className="hidden sm:inline"> チャンネル</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {channel.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">このチャンネルについて</h2>
              <p className="text-gray-600">{channel.description}</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">メンバー</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {participants.map((participant) => (
                <Link
                  key={participant.id}
                  to={`/users/${participant.id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{participant.username}</div>
                    {(participant.prefecture || participant.occupation) && (
                      <div className="text-sm text-gray-500">
                        {[participant.prefecture, participant.occupation]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
