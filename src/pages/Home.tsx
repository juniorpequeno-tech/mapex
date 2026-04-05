import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedFiles, deleteFile, createNewFile, saveFile, getFolders, createFolder, deleteFolder, moveFileToFolder } from '@/lib/fileStorage';
import { SavedFile, Folder } from '@/types/flow';
import {
  Plus, FileText, Trash2, FolderOpen, GitBranch, Search,
  FolderPlus, ChevronRight, ChevronDown, ArrowUpDown, Clock, Calendar as CalendarIcon, MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type SortMode = 'updated' | 'created' | 'name';

const Home = () => {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileFolder, setNewFileFolder] = useState<string | undefined>();
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const reload = () => {
    setFiles(getSavedFiles());
    setFolders(getFolders());
  };

  useEffect(() => { reload(); }, []);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortFiles = (list: SavedFile[]) => {
    return [...list].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const rootFiles = useMemo(() => sortFiles(filteredFiles.filter(f => !f.folderId)), [filteredFiles, sortMode]);
  const getFilesInFolder = (folderId: string) => sortFiles(filteredFiles.filter(f => f.folderId === folderId));

  const handleCreateNew = () => {
    const name = newFileName.trim() || 'Sem título';
    const file = createNewFile(name, [], newFileFolder);
    saveFile(file);
    setNewFileDialog(false);
    setNewFileName('');
    setNewFileFolder(undefined);
    navigate(`/flow/${file.id}`);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name);
    setNewFolderDialog(false);
    setNewFolderName('');
    reload();
    toast.success('Pasta criada');
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFile(id);
    reload();
    toast.success('Arquivo excluído');
  };

  const handleDeleteFolder = (id: string) => {
    deleteFolder(id);
    reload();
    toast.success('Pasta excluída (arquivos movidos para raiz)');
  };

  const handleMoveFile = (fileId: string, folderId: string | undefined) => {
    moveFileToFolder(fileId, folderId);
    reload();
    toast.success('Arquivo movido');
  };

  const sortLabels: Record<SortMode, string> = {
    updated: 'Últimos editados',
    created: 'Data de criação',
    name: 'Nome (A-Z)',
  };

  const FileItem = ({ file }: { file: SavedFile }) => (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/flow/${file.id}`)}
    >
      <FileText className="h-6 w-6 text-primary/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {file.tabs.length} aba{file.tabs.length !== 1 ? 's' : ''} · {format(new Date(file.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
          <button className="h-7 w-7 rounded hover:bg-accent flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
          {folders.length > 0 && (
            <>
              {file.folderId && (
                <DropdownMenuItem onClick={() => handleMoveFile(file.id, undefined)}>
                  Mover para raiz
                </DropdownMenuItem>
              )}
              {folders.filter(f => f.id !== file.folderId).map(folder => (
                <DropdownMenuItem key={folder.id} onClick={() => handleMoveFile(file.id, folder.id)}>
                  Mover para "{folder.name}"
                </DropdownMenuItem>
              ))}
            </>
          )}
          <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteFile(file.id, e as unknown as React.MouseEvent)}>
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Mapex</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setNewFolderDialog(true)} className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            Nova pasta
          </Button>
          <Button size="sm" onClick={() => { setNewFileFolder(undefined); setNewFileDialog(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo arquivo
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Search & Sort bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar arquivos..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabels[sortMode]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortMode('updated')} className="gap-2">
                <Clock className="h-3.5 w-3.5" /> Últimos editados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode('created')} className="gap-2">
                <CalendarIcon className="h-3.5 w-3.5" /> Data de criação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode('name')} className="gap-2">
                <ArrowUpDown className="h-3.5 w-3.5" /> Nome (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {filteredFiles.length === 0 && folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo salvo ainda'}
            </p>
            {!searchQuery && (
              <Button size="sm" variant="outline" onClick={() => setNewFileDialog(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Criar primeiro arquivo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Folders */}
            {folders.map(folder => {
              const folderFiles = getFilesInFolder(folder.id);
              const isExpanded = expandedFolders.has(folder.id);
              return (
                <div key={folder.id} className="rounded-lg border border-border overflow-hidden">
                  <div
                    className="group flex items-center gap-2 px-4 py-2.5 bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <FolderOpen className="h-4 w-4 text-primary/70 shrink-0" />
                    <span className="text-sm font-medium flex-1">{folder.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">{folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => { setNewFileFolder(folder.id); setNewFileDialog(true); }}>
                          <Plus className="h-3.5 w-3.5 mr-2" /> Novo arquivo aqui
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFolder(folder.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir pasta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {isExpanded && (
                    <div className="px-2 py-1 space-y-1">
                      {folderFiles.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Pasta vazia</p>
                      ) : (
                        folderFiles.map(file => <FileItem key={file.id} file={file} />)
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root files */}
            {rootFiles.length > 0 && (
              <div className="space-y-2">
                {folders.length > 0 && <p className="text-xs text-muted-foreground mt-4 mb-1">Sem pasta</p>}
                {rootFiles.map(file => <FileItem key={file.id} file={file} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New file dialog */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo arquivo</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do arquivo</label>
              <Input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder="Meu fluxo operacional"
                className="h-8 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleCreateNew()}
                autoFocus
              />
            </div>
            {folders.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pasta (opcional)</label>
                <select
                  className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                  value={newFileFolder || ''}
                  onChange={e => setNewFileFolder(e.target.value || undefined)}
                >
                  <option value="">Nenhuma</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setNewFileDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateNew}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Nova pasta</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs text-muted-foreground mb-1 block">Nome da pasta</label>
            <Input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Minha pasta"
              className="h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setNewFolderDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateFolder}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
