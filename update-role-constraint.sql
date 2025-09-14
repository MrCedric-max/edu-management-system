-- Update role constraint to include super_admin and school_admin
-- This script updates the existing database constraint

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with all roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'super_admin', 'school_admin', 'teacher', 'student', 'parent'));
