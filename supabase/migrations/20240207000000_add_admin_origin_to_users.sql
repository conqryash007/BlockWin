-- Add admin_origin column to scope admin access per subdomain.
-- NULL + is_admin=true = super admin (sees all users from main domain)
-- 'site1' + is_admin=true = subdomain admin (sees only site1 users)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS admin_origin TEXT;

COMMENT ON COLUMN public.users.admin_origin IS 'If set, restricts admin to users from this origin/subdomain. NULL with is_admin=true means super admin (all users).';

CREATE INDEX IF NOT EXISTS idx_users_admin_origin ON public.users(admin_origin);
