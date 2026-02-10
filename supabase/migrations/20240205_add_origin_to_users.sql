-- Add origin column to users table for tracking user signup source (subdomain)
-- This column stores the SUBDOMAIN value from the environment at the time of user creation

-- Add origin column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS origin TEXT;

-- Add index for querying users by origin
CREATE INDEX IF NOT EXISTS idx_users_origin ON public.users(origin);

-- Comment for documentation
COMMENT ON COLUMN public.users.origin IS 'The subdomain where the user signed up from';
