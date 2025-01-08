import React from 'react';
import { Link } from 'react-router-dom';
import { Users, LogIn, UserPlus, LogOut, User, Menu, MessageCircle, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            <Users className="h-8 w-8 shrink-0 text-indigo-600" />
            <span className="text-xl font-bold text-gray-800 truncate">DisabilityCommunity</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/users"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <Users className="h-5 w-5" />
                  <span>Members</span>
                </Link>
                <Link
                  to="/channels"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <Hash className="h-5 w-5" />
                  <span>Channels</span>
                </Link>
                <Link
                  to="/chats"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
              </>
            )}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {user && (
              <>
                <Link
                  to="/users"
                  className="flex items-center space-x-1 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-5 w-5" />
                  <span>Members</span>
                </Link>
                <Link
                  to="/channels"
                  className="flex items-center space-x-1 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Hash className="h-5 w-5" />
                  <span>Channels</span>
                </Link>
                <Link
                  to="/chats"
                  className="flex items-center space-x-1 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
              </>
            )}
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 w-full px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}