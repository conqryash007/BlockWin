-- Add is_admin column to users table for admin screen access (Gmail-based)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.is_admin IS 'When true, user can access the admin dashboard (checked by logged-in email).';
