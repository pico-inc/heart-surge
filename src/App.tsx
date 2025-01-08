import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Channels from './pages/Channels';
import CreateChannel from './pages/CreateChannel';
import ChannelDetail from './pages/ChannelDetail';
import ChannelChat from './pages/ChannelChat';
import EditChannel from './pages/EditChannel';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute>
                    <UserDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats/:id"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/channels"
                element={
                  <ProtectedRoute>
                    <Channels />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/channels/create"
                element={
                  <ProtectedRoute>
                    <CreateChannel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/channels/:id"
                element={
                  <ProtectedRoute>
                    <ChannelDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/channels/:id/chat"
                element={
                  <ProtectedRoute>
                    <ChannelChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/channels/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditChannel />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;