import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getPrefectureName } from '../utils/prefecture';
import { getAgeGroupName } from '../utils/ageGroup';
import { getOccupationName } from '../utils/occupation';

interface User {
  id: string;
  username: string;
  prefecture: string;
  age_group: string;
  occupation: string;
  avatar_url: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('username');

        if (error) throw error;
        setUsers(data || []);
      } catch (error: unknown) {
        console.error(error);
        toast.error('ユーザーの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };


    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">メンバー一覧</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/users/${user.id}`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="bg-indigo-100 p-3 rounded-full">
                  <UserIcon className="h-6 w-6 text-indigo-600" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{user.username}</h2>
                {user.age_group && (
                  <span className="text-sm text-gray-600">{getAgeGroupName(user.age_group)}</span>
                )}
              </div>
            </div>

            {user.prefecture && (
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{getPrefectureName(user.prefecture)}</span>
              </div>
            )}

            {user.occupation && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">{getOccupationName(user.occupation)}</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">ユーザーが見つかりません</p>
        </div>
      )}
    </div>
  );
}
