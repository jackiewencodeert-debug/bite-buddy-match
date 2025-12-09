-- Create a trigger function to prevent unauthorized admin role assignments
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Only check for admin role insertions
  IF NEW.role = 'admin' THEN
    -- Get the email of the user being assigned the admin role
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Only allow admin role for the specific email (case insensitive)
    IF LOWER(user_email) != 'jackiewencodeert@gmail.com' THEN
      RAISE EXCEPTION 'Admin role can only be assigned to jackiewencodeert@gmail.com';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS enforce_admin_restriction ON public.user_roles;
CREATE TRIGGER enforce_admin_restriction
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_admin_role();