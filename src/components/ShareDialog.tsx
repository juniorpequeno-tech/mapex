import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Trash2, Eye, MessageSquare, Pencil, Crown, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  searchUsersByEmail,
  getFileShares,
  addFileShare,
  updateFileSharePermission,
  removeFileShare,
  FileShare,
} from '@/lib/fileStorage';
import { useAuth } from '@/contexts/AuthContext';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  ownerId: string;
}

const permissionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  leitor: { label: 'Leitor', icon: <Eye className="h-3.5 w-3.5" />, color: 'bg-blue-500/10 text-blue-500' },
  comentador: { label: 'Comentador', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'bg-amber-500/10 text-amber-500' },
  editor: { label: 'Editor', icon: <Pencil className="h-3.5 w-3.5" />, color: 'bg-green-500/10 text-green-500' },
};

const ShareDialog: React.FC<ShareDialogProps> = ({ open, onOpenChange, fileId, fileName, ownerId }) => {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ user_id: string; email: string; full_name: string }[]>([]);
  const [shares, setShares] = useState<FileShare[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<string>('leitor');
  const [loading, setLoading] = useState(false);

  const canManage = user?.id === ownerId || isAdmin;

  const loadShares = async () => {
    const data = await getFileShares(fileId);
    setShares(data);
  };

  useEffect(() => {
    if (open) {
      loadShares();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, fileId]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await searchUsersByEmail(q);
    // Filter out owner and already shared users
    const sharedUserIds = new Set(shares.map(s => s.user_id));
    setSearchResults(
      results.filter(r => r.user_id !== ownerId && !sharedUserIds.has(r.user_id))
    );
  };

  const handleAddShare = async (userId: string, email: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await addFileShare(fileId, userId, selectedPermission, user.id);
      toast.success(`Compartilhado com ${email}`);
      setSearchQuery('');
      setSearchResults([]);
      await loadShares();
    } catch (e: any) {
      toast.error('Erro ao compartilhar: ' + e.message);
    }
    setLoading(false);
  };

  const handleUpdatePermission = async (shareId: string, newPermission: string) => {
    try {
      await updateFileSharePermission(shareId, newPermission);
      toast.success('Permissão atualizada');
      await loadShares();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const handleRemoveShare = async (shareId: string, email?: string) => {
    try {
      await removeFileShare(shareId);
      toast.success(`Acesso de ${email || 'usuário'} removido`);
      await loadShares();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Compartilhar "{fileName}"
          </DialogTitle>
        </DialogHeader>

        {canManage && (
          <div className="space-y-3">
            {/* Search + permission selector */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Buscar por e-mail..."
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leitor">
                    <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Leitor</span>
                  </SelectItem>
                  <SelectItem value="comentador">
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Comentador</span>
                  </SelectItem>
                  <SelectItem value="editor">
                    <span className="flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Editor</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-md max-h-36 overflow-y-auto">
                {searchResults.map(result => (
                  <button
                    key={result.user_id}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors text-sm"
                    onClick={() => handleAddShare(result.user_id, result.email)}
                    disabled={loading}
                  >
                    <div className="text-left">
                      <p className="font-medium text-xs">{result.full_name || result.email}</p>
                      <p className="text-[10px] text-muted-foreground">{result.email}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum usuário encontrado</p>
            )}
          </div>
        )}

        {/* Shared users list */}
        <div className="space-y-1 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Pessoas com acesso</p>

          {/* Owner */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Proprietário</p>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Crown className="h-3 w-3" /> Dono
            </Badge>
          </div>

          {/* Shared users */}
          {shares.map(share => {
            const perm = permissionLabels[share.permission] || permissionLabels.leitor;
            return (
              <div key={share.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/20 transition-colors">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {(share.user_name || share.user_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{share.user_name || 'Sem nome'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{share.user_email}</p>
                </div>
                {canManage ? (
                  <div className="flex items-center gap-1">
                    <Select
                      value={share.permission}
                      onValueChange={val => handleUpdatePermission(share.id, val)}
                    >
                      <SelectTrigger className="h-7 w-[110px] text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leitor">Leitor</SelectItem>
                        <SelectItem value="comentador">Comentador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveShare(share.id, share.user_email)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Badge className={`text-[10px] gap-1 ${perm.color}`}>
                    {perm.icon} {perm.label}
                  </Badge>
                )}
              </div>
            );
          })}

          {shares.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Ninguém mais tem acesso</p>
          )}
        </div>

        {/* Permission legend */}
        <div className="border-t border-border pt-3 mt-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Níveis de permissão:</p>
          <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> Leitor: só visualiza</div>
            <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-amber-500" /> Comentador: visualiza + comenta</div>
            <div className="flex items-center gap-1"><Pencil className="h-3 w-3 text-green-500" /> Editor: acesso completo</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
