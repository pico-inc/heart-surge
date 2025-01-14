-- Add new columns to profiles table
ALTER TABLE profiles DROP COLUMN device_info;

ALTER TABLE profiles
ADD COLUMN device_type TEXT
  DEFAULT ''
  CHECK (device_type = '' OR device_type IN ('cochlear_implant', 'hearing_aid', 'both', 'none')),
ADD COLUMN hearing_level TEXT
  DEFAULT ''
  CHECK (hearing_level = '' OR hearing_level IN ('mild', 'moderate', 'severe'));
