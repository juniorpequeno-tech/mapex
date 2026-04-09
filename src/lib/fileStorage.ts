import { supabase } from '@/integrations/supabase/client';
import { SavedFile, FlowTab, Folder } from '@/types/flow';

// ── Supabase-backed file operations ──

export async function getSavedFilesAsync(userId: string): Promise<SavedFile[]> {
  // Get own files
  const { data: ownFiles } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  // Get shared files
  const { data: shares } = await supabase
    .from('file_shares')
    .select('file_id, permission')
    .eq('user_id', userId);

  let sharedFiles: any[] = [];
  if (shares && shares.length > 0) {
    const sharedIds = shares.map(s => s.file_id);
    const { data } = await supabase
      .from('files')
      .select('*')
      .in('id', sharedIds);
    sharedFiles = data || [];
  }

  const shareMap = new Map((shares || []).map(s => [s.file_id, s.permission]));

  const mapFile = (f: any, permission?: string): SavedFile => ({
    id: f.id,
    name: f.name,
    tabs: (f.content as any) || [],
    folderId: f.folder_id || undefined,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    ownerId: f.owner_id,
    permission: permission || 'owner',
  });

  return [
    ...(ownFiles || []).map(f => mapFile(f, 'owner')),
    ...sharedFiles.map(f => mapFile(f, shareMap.get(f.id) || 'leitor')),
  ];
}

export async function saveFileAsync(file: SavedFile): Promise<void> {
  const { error } = await supabase
    .from('files')
    .upsert({
      id: file.id,
      name: file.name,
      content: file.tabs as any,
      folder_id: file.folderId || null,
      owner_id: file.ownerId!,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function createNewFileAsync(name: string, tabs: FlowTab[], userId: string, folderId?: string): Promise<SavedFile> {
  const { data, error } = await supabase
    .from('files')
    .insert({
      name,
      content: tabs as any,
      owner_id: userId,
      folder_id: folderId || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    tabs: (data.content as any) || [],
    folderId: data.folder_id || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ownerId: data.owner_id,
    permission: 'owner',
  };
}

export async function deleteFileAsync(id: string): Promise<void> {
  const { error } = await supabase.from('files').delete().eq('id', id);
  if (error) throw error;
}

export async function moveFileToFolderAsync(fileId: string, folderId: string | undefined): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ folder_id: folderId || null })
    .eq('id', fileId);
  if (error) throw error;
}

export async function getFileByIdAsync(fileId: string): Promise<SavedFile | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error || !data) return null;

  // Check permission
  const { data: { user } } = await supabase.auth.getUser();
  let permission = 'owner';
  if (user && data.owner_id !== user.id) {
    const { data: share } = await supabase
      .from('file_shares')
      .select('permission')
      .eq('file_id', fileId)
      .eq('user_id', user.id)
      .single();
    permission = share?.permission || 'leitor';
  }

  return {
    id: data.id,
    name: data.name,
    tabs: (data.content as any) || [],
    folderId: data.folder_id || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    ownerId: data.owner_id,
    permission,
  };
}

// ── Share operations ──

export interface FileShare {
  id: string;
  file_id: string;
  user_id: string;
  permission: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
}

export async function getFileShares(fileId: string): Promise<FileShare[]> {
  const { data: shares, error } = await supabase
    .from('file_shares')
    .select('*')
    .eq('file_id', fileId);

  if (error || !shares) return [];

  // Fetch profile info for each shared user
  const userIds = shares.map(s => s.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, full_name')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return shares.map(s => ({
    id: s.id,
    file_id: s.file_id,
    user_id: s.user_id,
    permission: s.permission,
    user_email: profileMap.get(s.user_id)?.email,
    user_name: profileMap.get(s.user_id)?.full_name,
    created_at: s.created_at,
  }));
}

export async function addFileShare(fileId: string, userId: string, permission: string, sharedBy: string): Promise<void> {
  const { error } = await supabase
    .from('file_shares')
    .upsert({
      file_id: fileId,
      user_id: userId,
      permission: permission as any,
      shared_by: sharedBy,
    }, { onConflict: 'file_id,user_id' });

  if (error) throw error;
}

export async function updateFileSharePermission(shareId: string, permission: string): Promise<void> {
  const { error } = await supabase
    .from('file_shares')
    .update({ permission: permission as any })
    .eq('id', shareId);
  if (error) throw error;
}

export async function removeFileShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('file_shares')
    .delete()
    .eq('id', shareId);
  if (error) throw error;
}

export async function searchUsersByEmail(query: string): Promise<{ user_id: string; email: string; full_name: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('user_id, email, full_name')
    .ilike('email', `%${query}%`)
    .limit(10);
  return data || [];
}

// ── Legacy localStorage helpers (kept for folders only for now) ──

const FOLDERS_KEY = 'mapex_folders';

export function getFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFolder(folder: Folder): void {
  const folders = getFolders();
  const idx = folders.findIndex(f => f.id === folder.id);
  if (idx >= 0) folders[idx] = folder;
  else folders.push(folder);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function deleteFolder(id: string): void {
  const folders = getFolders().filter(f => f.id !== id);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function createFolder(name: string): Folder {
  const folder: Folder = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    createdAt: new Date().toISOString(),
  };
  saveFolder(folder);
  return folder;
}

// Legacy sync wrappers (deprecated - use async versions)
export function getSavedFiles(): SavedFile[] { return []; }
export function saveFile(_file: SavedFile): void {}
export function deleteFile(_id: string): void {}
export function createNewFile(name: string, tabs: FlowTab[], folderId?: string): SavedFile {
  return { id: '', name, tabs, folderId, createdAt: '', updatedAt: '' };
}
export function moveFileToFolder(_fileId: string, _folderId: string | undefined): void {}
