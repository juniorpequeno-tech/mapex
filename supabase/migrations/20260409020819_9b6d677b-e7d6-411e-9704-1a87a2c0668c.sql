
-- Fix infinite recursion: Drop problematic policies that cross-reference files <-> file_shares
DROP POLICY IF EXISTS "Shared users can view files" ON public.files;
DROP POLICY IF EXISTS "Editors can update shared files" ON public.files;
DROP POLICY IF EXISTS "Owners can manage shares" ON public.file_shares;

-- Recreate files policies using SECURITY DEFINER function instead of subqueries on file_shares
CREATE POLICY "Shared users can view files"
  ON public.files FOR SELECT
  USING (can_access_file(auth.uid(), id));

CREATE POLICY "Editors can update shared files"
  ON public.files FOR UPDATE
  USING (
    get_file_permission(auth.uid(), id) IN ('owner', 'admin', 'editor')
  );

-- Recreate file_shares policies using SECURITY DEFINER function to check file ownership
CREATE OR REPLACE FUNCTION public.is_file_owner(_user_id uuid, _file_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.files WHERE id = _file_id AND owner_id = _user_id
  )
$$;

CREATE POLICY "Owners can manage shares"
  ON public.file_shares FOR ALL
  USING (is_file_owner(auth.uid(), file_id))
  WITH CHECK (is_file_owner(auth.uid(), file_id));
