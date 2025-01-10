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
    avatar_url: string;
  }[];
}

interface ChatParticipant {
  chat: {
    id: string;
    last_message: string | null;
    last_message_at: string;
  };
}

interface PartnerData {
  user: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export default function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // 1. 自分が参加しているチャットを取得
        const { data: myChats, error: myChatsError } = await supabase
          .from('chat_participants')
          .select(`
            chat:chats (
              id,
              last_message,
              last_message_at
            )
          `)
          .eq('user_id', user?.id) as {
            data: ChatParticipant[] | null;
            error: Error | null;
          };

        if (myChatsError) throw myChatsError;

        // 2. 各チャットの相手の情報を取得
        const chatPromises = myChats!.map(async (chat) => {
          const { data: partnerData, error: partnerError } = await supabase
            .from('chat_participants')
            .select(`
              user:profiles (
                id,
                username,
                avatar_url
              )
            `)
            .eq('chat_id', chat.chat.id)
            .neq('user_id', user?.id)
            .single() as {
              data: PartnerData;
              error: Error | null;
            };

          if (partnerError) throw partnerError;

          return {
            id: chat.chat.id,
            last_message: chat.chat.last_message,
            last_message_at: chat.chat.last_message_at,
            participants: [partnerData.user]
          };
        });

        const formattedChats = await Promise.all(chatPromises);

        // 型アサーションを使用して、formattedChatsがChat[]型であることを保証
        const typedChats = formattedChats as unknown as Chat[];

        setChats(typedChats.sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        ));

      } catch (error: unknown) {
        console.error('Error loading chats:', error);
        toast.error('チャットの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">チャット一覧</h1>

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
                  {chat.participants[0]?.avatar_url ? (
                    <img
                      src={chat.participants[0]?.avatar_url}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <UserIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
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
