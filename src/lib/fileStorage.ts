import { SavedFile, FlowTab, Folder } from '@/types/flow';

const STORAGE_KEY = 'mapex_files';
const FOLDERS_KEY = 'mapex_folders';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function getSavedFiles(): SavedFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFile(file: SavedFile): void {
  const files = getSavedFiles();
  const idx = files.findIndex(f => f.id === file.id);
  file.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    files[idx] = file;
  } else {
    files.push(file);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function deleteFile(id: string): void {
  const files = getSavedFiles().filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function createNewFile(name: string, tabs: FlowTab[], folderId?: string): SavedFile {
  return {
    id: generateId(),
    name,
    tabs,
    folderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function moveFileToFolder(fileId: string, folderId: string | undefined): void {
  const files = getSavedFiles();
  const idx = files.findIndex(f => f.id === fileId);
  if (idx >= 0) {
    files[idx].folderId = folderId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }
}

// Folders
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
  if (idx >= 0) {
    folders[idx] = folder;
  } else {
    folders.push(folder);
  }
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function deleteFolder(id: string): void {
  const folders = getFolders().filter(f => f.id !== id);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  // Move files from deleted folder to root
  const files = getSavedFiles().map(f => f.folderId === id ? { ...f, folderId: undefined } : f);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function createFolder(name: string): Folder {
  const folder: Folder = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
  saveFolder(folder);
  return folder;
}
