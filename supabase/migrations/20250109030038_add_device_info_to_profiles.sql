-- Add device info field to profiles table
ALTER TABLE profiles
ADD COLUMN device_info TEXT;

-- Add delete policy for channels
CREATE POLICY "Users can delete their own channels"
ON channels
FOR DELETE USING (
  auth.uid() = owner_id
);
