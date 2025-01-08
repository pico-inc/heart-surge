/*
  # Update chat policies

  1. Changes
    - Drop existing RLS policies for chat-related tables
    - Create simpler policies for chat functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can create chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON messages;

-- Create simpler policies
CREATE POLICY "Enable read access for users" ON chats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for users" ON chats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for users" ON chat_participants
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for users" ON chat_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for users" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for users" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);