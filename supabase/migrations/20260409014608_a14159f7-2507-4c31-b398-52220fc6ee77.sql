
-- Create permission enum
CREATE TYPE public.share_permission AS ENUM ('leitor', 'comentador', 'editor');

-- Create files table
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Sem título',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  folder_id TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file_shares table
CREATE TABLE public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission share_permission NOT NULL DEFAULT 'leitor',
  shared_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id, user_id)
);

-- Create file_comments table
CREATE TABLE public.file_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tab_name TEXT,
  row_index INTEGER,
  col_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user can access a file
CREATE OR REPLACE FUNCTION public.can_access_file(_user_id uuid, _file_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.files WHERE id = _file_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.file_shares WHERE file_id = _file_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('administrador_master', 'administrador_secundario')
  )
$$;

-- Helper function: get user's permission level for a file
CREATE OR REPLACE FUNCTION public.get_file_permission(_user_id uuid, _file_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM public.files WHERE id = _file_id AND owner_id = _user_id) THEN 'owner'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('administrador_master', 'administrador_secundario')) THEN 'admin'
      ELSE (SELECT permission::text FROM public.file_shares WHERE file_id = _file_id AND user_id = _user_id)
    END
$$;

-- FILES policies
CREATE POLICY "Owners can do everything with their files"
ON public.files FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can view all files"
ON public.files FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Shared users can view files"
ON public.files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.file_shares WHERE file_id = id AND user_id = auth.uid()
));

CREATE POLICY "Editors can update shared files"
ON public.files FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.file_shares WHERE file_id = id AND user_id = auth.uid() AND permission = 'editor'
));

-- FILE_SHARES policies
CREATE POLICY "Owners can manage shares"
ON public.file_shares FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid()
));

CREATE POLICY "Admins can manage shares"
ON public.file_shares FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Shared users can view their own shares"
ON public.file_shares FOR SELECT
USING (user_id = auth.uid());

-- FILE_COMMENTS policies
CREATE POLICY "Users with access can view comments"
ON public.file_comments FOR SELECT
USING (public.can_access_file(auth.uid(), file_id));

CREATE POLICY "Comentadores and editors can add comments"
ON public.file_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid())
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_id = file_comments.file_id AND user_id = auth.uid() AND permission IN ('comentador', 'editor')
    )
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.file_comments FOR DELETE
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_files_owner ON public.files(owner_id);
CREATE INDEX idx_file_shares_file ON public.file_shares(file_id);
CREATE INDEX idx_file_shares_user ON public.file_shares(user_id);
CREATE INDEX idx_file_comments_file ON public.file_comments(file_id);

-- Trigger for updated_at
CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
