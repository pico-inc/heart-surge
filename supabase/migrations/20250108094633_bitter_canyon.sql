/*
  # Add channel description

  1. Changes
    - Add description column to channels table
    - Set default value to empty string
    - Make it nullable to maintain compatibility
*/

ALTER TABLE channels ADD COLUMN description TEXT DEFAULT '';