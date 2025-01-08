/*
  # Initial Schema Setup for Disability Community App

  1. New Tables
    - profiles
      - id (uuid, primary key, references auth.users)
      - username (text, unique)
      - prefecture (text)
      - age_group (text)
      - occupation (text)
      - avatar_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - assistive_devices
      - id (uuid, primary key)
      - user_id (uuid, references profiles)
      - category (text)
      - name (text)
      - description (text)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  prefecture TEXT,
  age_group TEXT,
  occupation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create assistive devices table
CREATE TABLE assistive_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistive_devices ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Assistive devices policies
CREATE POLICY "Assistive devices are viewable by everyone"
  ON assistive_devices FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own assistive devices"
  ON assistive_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assistive devices"
  ON assistive_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assistive devices"
  ON assistive_devices FOR DELETE
  USING (auth.uid() = user_id);