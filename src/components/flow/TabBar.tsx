import React, { useState, useRef, useEffect } from 'react';
import { FlowTab } from '@/types/flow';
import { TAB_COLORS } from '@/hooks/useFlowStore';
import { Plus, X, Lock, Unlock, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TabBarProps {
  tabs: FlowTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onRemoveTab: (id: string) => void;
  onRenameTab: (id: string, name: string) => void;
  onSetTabColor: (id: string, color: string) => void;
  onProtectTab: (id: string, email: string, password: string) => void;
  onUnlockTab: (id: string, password: string) => boolean;
  onRemoveProtection: (id: string) => void;
}

export function TabBar({
  tabs, activeTabId, onSelectTab, onAddTab, onRemoveTab,
  onRenameTab, onSetTabColor, onProtectTab, onUnlockTab, onRemoveProtection,
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [colorPickerTabId, setColorPickerTabId] = useState<string | null>(null);
  const [protectDialog, setProtectDialog] = useState<string | null>(null);
  const [protectEmail, setProtectEmail] = useState('');
  const [protectPassword, setProtectPassword] = useState('');
  const [unlockDialog, setUnlockDialog] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [forgotDialog, setForgotDialog] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const startRename = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingTabId(tabId);
      setEditName(tab.name);
    }
    setContextMenu(null);
  };

  const finishRename = () => {
    if (editingTabId && editName.trim()) {
      onRenameTab(editingTabId, editName.trim());
    }
    setEditingTabId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const handleTabClick = (tab: FlowTab) => {
    if (tab.isProtected && tab.isLocked) {
      setUnlockDialog(tab.id);
      setUnlockPassword('');
    } else {
      onSelectTab(tab.id);
    }
  };

  const handleProtectSubmit = () => {
    if (protectDialog && protectEmail.trim() && protectPassword.trim()) {
      onProtectTab(protectDialog, protectEmail.trim(), protectPassword.trim());
      setProtectDialog(null);
      setProtectEmail('');
      setProtectPassword('');
      toast.success('Aba protegida com sucesso!');
    }
  };

  const handleUnlockSubmit = () => {
    if (unlockDialog) {
      const success = onUnlockTab(unlockDialog, unlockPassword);
      if (success) {
        onSelectTab(unlockDialog);
        setUnlockDialog(null);
        setUnlockPassword('');
        toast.success('Aba desbloqueada!');
      } else {
        toast.error('Senha incorreta!');
      }
    }
  };

  const handleForgotPassword = () => {
    if (forgotDialog) {
      const tab = tabs.find(t => t.id === forgotDialog);
      if (tab?.protectionEmail) {
        toast.success(`Senha enviada para ${tab.protectionEmail}`);
        setForgotDialog(null);
        setUnlockDialog(null);
      }
    }
  };

  return (
    <>
      <div className="flex items-center border-t border-border bg-muted/30 px-2 py-1 gap-0.5 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-1 px-3 py-1.5 text-xs rounded-t cursor-pointer select-none transition-colors ${
              activeTabId === tab.id
                ? 'bg-background border border-b-0 border-border font-medium -mb-px'
                : 'hover:bg-accent/50 text-muted-foreground'
            }`}
            style={{
              borderTopColor: activeTabId === tab.id ? tab.color : 'transparent',
              borderTopWidth: '2px',
            }}
            onClick={() => handleTabClick(tab)}
            onDoubleClick={() => startRename(tab.id)}
            onContextMenu={e => handleContextMenu(e, tab.id)}
          >
            {tab.isProtected && (
              <span className="text-muted-foreground">
                {tab.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </span>
            )}
            {editingTabId === tab.id ? (
              <input
                className="w-20 h-5 px-1 text-xs bg-background border border-primary rounded focus:outline-none"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={finishRename}
                onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setEditingTabId(null); }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="truncate max-w-[120px]">{tab.name}</span>
            )}
            {tabs.length > 1 && activeTabId === tab.id && (
              <button
                className="opacity-0 group-hover:opacity-100 h-4 w-4 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all ml-1"
                onClick={e => { e.stopPropagation(); onRemoveTab(tab.id); }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent text-muted-foreground transition-colors shrink-0 ml-1"
          onClick={onAddTab}
          title="Nova aba"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
            onClick={() => startRename(contextMenu.tabId)}
          >
            Renomear
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
            onClick={() => { setColorPickerTabId(contextMenu.tabId); setContextMenu(null); }}
          >
            Definir cor
          </button>
          <div className="border-t border-border my-1" />
          {tabs.find(t => t.id === contextMenu.tabId)?.isProtected ? (
            <button
              className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2 text-destructive"
              onClick={() => { onRemoveProtection(contextMenu.tabId); setContextMenu(null); toast.success('Proteção removida'); }}
            >
              <Unlock className="h-3 w-3" /> Remover proteção
            </button>
          ) : (
            <button
              className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
              onClick={() => { setProtectDialog(contextMenu.tabId); setContextMenu(null); }}
            >
              <Shield className="h-3 w-3" /> Proteger aba
            </button>
          )}
          {tabs.length > 1 && (
            <>
              <div className="border-t border-border my-1" />
              <button
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent text-destructive flex items-center gap-2"
                onClick={() => { onRemoveTab(contextMenu.tabId); setContextMenu(null); }}
              >
                Excluir aba
              </button>
            </>
          )}
        </div>
      )}

      {/* Color picker dialog */}
      <Dialog open={!!colorPickerTabId} onOpenChange={() => setColorPickerTabId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Cor da aba</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-2">
            {TAB_COLORS.map(color => (
              <button
                key={color}
                className="h-8 w-full rounded border-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: color,
                  borderColor: tabs.find(t => t.id === colorPickerTabId)?.color === color ? 'hsl(var(--foreground))' : 'transparent',
                }}
                onClick={() => {
                  if (colorPickerTabId) onSetTabColor(colorPickerTabId, color);
                  setColorPickerTabId(null);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Protect dialog */}
      <Dialog open={!!protectDialog} onOpenChange={() => setProtectDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Proteger aba com senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">E-mail para recuperação</label>
              <Input
                type="email"
                value={protectEmail}
                onChange={e => setProtectEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
              <Input
                type="password"
                value={protectPassword}
                onChange={e => setProtectPassword(e.target.value)}
                placeholder="Digite a senha"
                className="h-8 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleProtectSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleProtectSubmit} disabled={!protectEmail.trim() || !protectPassword.trim()}>
              Proteger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock dialog */}
      <Dialog open={!!unlockDialog} onOpenChange={() => setUnlockDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" /> Aba protegida
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
              <Input
                type="password"
                value={unlockPassword}
                onChange={e => setUnlockPassword(e.target.value)}
                placeholder="Digite a senha"
                className="h-8 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleUnlockSubmit()}
              />
            </div>
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => { setForgotDialog(unlockDialog); }}
            >
              Esqueci minha senha
            </button>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleUnlockSubmit} disabled={!unlockPassword.trim()}>
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forgot password dialog */}
      <Dialog open={!!forgotDialog} onOpenChange={() => setForgotDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Recuperar senha</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-3">
              A senha será enviada para o e-mail cadastrado na proteção desta aba.
            </p>
            {forgotDialog && (
              <p className="text-xs">
                E-mail: <span className="font-medium">{tabs.find(t => t.id === forgotDialog)?.protectionEmail}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setForgotDialog(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleForgotPassword}>
              Enviar senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
