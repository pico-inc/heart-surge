/*
  # Add chat functionality

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_message` (text)
      - `last_message_at` (timestamp)
    - `chat_participants`
      - `chat_id` (uuid, references chats)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)
    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for chat access and message creation
*/

-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat participants table
CREATE TABLE chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat policies
CREATE POLICY "Users can view their chats"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chats.id
      AND user_id = auth.uid()
    )
  );

-- Chat participants policies
CREATE POLICY "Users can view chat participants"
  ON chat_participants FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM chat_participants WHERE chat_id = chat_participants.chat_id
    )
  );

CREATE POLICY "Users can create chat participants"
  ON chat_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );