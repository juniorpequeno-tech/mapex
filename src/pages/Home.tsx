import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedFiles, deleteFile, createNewFile, saveFile } from '@/lib/fileStorage';
import { SavedFile } from '@/types/flow';
import { Plus, FileText, Trash2, FolderOpen, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Home = () => {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setFiles(getSavedFiles());
  }, []);

  const handleCreateNew = () => {
    const name = newFileName.trim() || 'Sem título';
    const file = createNewFile(name, []);
    saveFile(file);
    setNewFileDialog(false);
    setNewFileName('');
    navigate(`/flow/${file.id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFile(id);
    setFiles(getSavedFiles());
    toast.success('Arquivo excluído');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Mapex</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Meus Arquivos</h2>
          <Button size="sm" onClick={() => setNewFileDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo arquivo
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">Nenhum arquivo salvo ainda</p>
            <Button size="sm" variant="outline" onClick={() => setNewFileDialog(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Criar primeiro arquivo
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map(file => (
              <div
                key={file.id}
                className="group flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/flow/${file.id}`)}
              >
                <FileText className="h-8 w-8 text-primary/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.tabs.length} aba{file.tabs.length !== 1 ? 's' : ''} · Atualizado em {format(new Date(file.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <button
                  className="h-8 w-8 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  onClick={(e) => handleDelete(file.id, e)}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New file dialog */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo arquivo</DialogTitle>
          </DialogHeader>
          <div className="py-2">
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
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setNewFileDialog(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateNew}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
