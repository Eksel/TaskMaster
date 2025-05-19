/*
  # Add privacy field to tasks

  1. Changes
    - Add `privacy` column to `shopping_tasks` table
      - Values: 'public' or 'private'
      - Default: 'private'
    - Update RLS policies to respect privacy settings
*/

-- Add privacy column
ALTER TABLE shopping_tasks 
ADD COLUMN IF NOT EXISTS privacy text NOT NULL DEFAULT 'private'
CHECK (privacy IN ('public', 'private'));

-- Update RLS policies to respect privacy
CREATE POLICY "Users can view public shopping tasks"
  ON shopping_tasks
  FOR SELECT
  TO authenticated
  USING (privacy = 'public' OR auth.uid() = created_by);