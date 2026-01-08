-- Enforce a maximum of 2 active sessions per user
-- This trigger runs after a new session is created and removes the oldest ones if the limit is exceeded.

CREATE OR REPLACE FUNCTION public.handle_new_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that we are acting on the correct user's sessions
  -- Delete sessions for the user that are NOT in the top 2 most recent
  DELETE FROM auth.sessions
  WHERE user_id = NEW.user_id
  AND id IN (
    SELECT id
    FROM auth.sessions
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 2 -- Keep the 2 most recent sessions; delete anything older
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on the auth.sessions table
-- Drop it first to ensure idempotency
DROP TRIGGER IF EXISTS on_session_created ON auth.sessions;

CREATE TRIGGER on_session_created
AFTER INSERT ON auth.sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_new_session();
