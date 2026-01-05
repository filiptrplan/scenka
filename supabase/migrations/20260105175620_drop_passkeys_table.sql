-- Drop passkeys table and related function
DROP TABLE IF EXISTS public.passkeys CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at_passkeys() CASCADE;
