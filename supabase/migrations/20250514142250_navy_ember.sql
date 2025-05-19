/*
  # Create shopping tasks table

  1. New Tables
    - `shopping_tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamptz)
      - `due_time` (text)
      - `priority` (text)
      - `completed` (boolean)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `channel_id` (uuid, optional)
      - `status` (text)

    - `shopping_items`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references shopping_tasks)
      - `name` (text)
      - `quantity` (integer)
      - `completed` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Create shopping_tasks table
CREATE TABLE IF NOT EXISTS shopping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  due_time text,
  priority text NOT NULL DEFAULT 'low',
  completed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  channel_id uuid,
  status text NOT NULL DEFAULT 'not_started'
);

-- Create shopping_items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES shopping_tasks ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity integer DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE shopping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_tasks
CREATE POLICY "Users can create shopping tasks"
  ON shopping_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own shopping tasks"
  ON shopping_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own shopping tasks"
  ON shopping_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shopping tasks"
  ON shopping_tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for shopping_items
CREATE POLICY "Users can manage shopping items of their tasks"
  ON shopping_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopping_tasks
      WHERE shopping_tasks.id = shopping_items.task_id
      AND shopping_tasks.created_by = auth.uid()
    )
  );