import { SavedFile, FlowTab } from '@/types/flow';

const STORAGE_KEY = 'mapex_files';

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

export function createNewFile(name: string, tabs: FlowTab[]): SavedFile {
  return {
    id: generateId(),
    name,
    tabs,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
