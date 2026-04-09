
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Always assign default role - admin roles must be set via admin edge function
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario_padrao');
  
  RETURN NEW;
END;
$$;
