/*
  # Create channels feature

  1. New Tables
    - `channels`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `channel_participants`
      - `channel_id` (uuid, references channels)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)
    - `channel_messages`
      - `id` (uuid, primary key)
      - `channel_id` (uuid, references channels)
      - `sender_id` (uuid, references profiles)
      - `content` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for reading and writing
*/

-- Create channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create channel participants table
CREATE TABLE channel_participants (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- Create channel messages table
CREATE TABLE channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "Enable read access for all users" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON channels
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Channel participants policies
CREATE POLICY "Enable read access for all users" ON channel_participants
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON channel_participants
  FOR INSERT WITH CHECK (true);

-- Channel messages policies
CREATE POLICY "Enable read access for all users" ON channel_messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON channel_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);