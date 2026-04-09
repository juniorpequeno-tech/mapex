import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlowStore } from '@/hooks/useFlowStore';
import { MemoizedFlowRowComponent as FlowRowComponent } from '@/components/flow/FlowRow';
import { TabBar } from '@/components/flow/TabBar';
import { FormatToolbar } from '@/components/flow/FormatToolbar';
import { Plus, ChevronRight, Save, GitBranch, ArrowLeft, Pencil, Share2, Eye, MessageSquare, Undo2 } from 'lucide-react';
import { getFileByIdAsync, saveFileAsync } from '@/lib/fileStorage';
import { SavedFile } from '@/types/flow';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShareDialog from '@/components/ShareDialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const {
    tabs, activeTabId, activeTab, data,
    setActiveTabId, addTab, removeTab, renameTab, setTabColor,
    protectTab, unlockTab, removeProtection,
    updateColumnTitle, addColumn, addRow, deleteRow,
    updateCell, setCellType, toggleLabel, addLabel,
    addObservation, addMessage, setRowColor, setRowBorder, setRowFontSize,
    updateHeaderStyle, updateColumnHeaderStyle, loadTabs, undo, canUndo, setColumnWidth,
  } = useFlowStore();

  const columnWidths = data.columnWidths || data.columns.map(() => 220);

  const handleColumnResize = useCallback((index: number, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      setColumnWidth(index, startWidth + diff);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [setColumnWidth]);

  const [fileName, setFileName] = useState('Sem título');
  const [editingName, setEditingName] = useState(false);
  const [currentFile, setCurrentFile] = useState<SavedFile | null>(null);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  // Use refs for selection to avoid re-rendering the entire tree on every click
  const selectedCellElRef = useRef<HTMLElement | null>(null);
  const rowRefsMap = useRef<Map<string, React.MutableRefObject<(HTMLDivElement | null)[]>>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine permission
  const permission = currentFile?.permission || 'owner';
  const isOwner = permission === 'owner';
  const canEdit = isOwner || permission === 'editor' || isAdmin;
  const canComment = canEdit || permission === 'comentador';
  const canShare = isOwner || isAdmin;

  // Load file from Supabase
  useEffect(() => {
    const loadFile = async () => {
      if (!fileId) return;
      const file = await getFileByIdAsync(fileId);
      if (file) {
        setFileName(file.name);
        setCurrentFile(file);
        if (file.tabs.length > 0) {
          loadTabs(file.tabs);
        }
        setFileLoaded(true);
      } else {
        toast.error('Arquivo não encontrado ou sem permissão');
        navigate('/');
      }
    };
    loadFile();
  }, [fileId]);

  // Ctrl+Z undo shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canEdit) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, canEdit]);

  const handleSave = useCallback(async () => {
    if (!currentFile || !canEdit) return;
    try {
      await saveFileAsync({
        ...currentFile,
        name: fileName,
        tabs,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Arquivo salvo!');
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    }
  }, [currentFile, fileName, tabs, canEdit]);

  const getRowRefs = useCallback((rowId: string) => {
    if (!rowRefsMap.current.has(rowId)) {
      rowRefsMap.current.set(rowId, { current: [] });
    }
    return rowRefsMap.current.get(rowId)!;
  }, []);

  const focusCellInRow = useCallback((rowId: string, cellIndex: number) => {
    setTimeout(() => {
      const refs = rowRefsMap.current.get(rowId);
      if (refs) {
        const cellDiv = refs.current[cellIndex];
        if (cellDiv) {
          const textInput = cellDiv.querySelector('input.w-full:not([type="file"])') as HTMLElement;
          if (textInput) { textInput.focus(); return; }
          const selectBtn = cellDiv.querySelector('[role="combobox"]') as HTMLElement;
          if (selectBtn) { selectBtn.focus(); return; }
          const anyFocusable = cellDiv.querySelector('button, input') as HTMLElement;
          anyFocusable?.focus();
        }
      }
    }, 0);
  }, []);

  const handleEnterNewRow = useCallback(() => {
    if (!canEdit) return;
    addRow();
    setTimeout(() => {
      if (containerRef.current) {
        const rows = containerRef.current.querySelectorAll('[data-flow-row]');
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
          const input = lastRow.querySelector('input:not([type="file"])') as HTMLElement;
          input?.focus();
        }
      }
    }, 50);
  }, [addRow, canEdit]);

  const isLocked = activeTab.isProtected && activeTab.isLocked;

  const permissionBadge = !isOwner && permission ? (
    <Badge variant="outline" className="text-[10px] gap-1 ml-2">
      {permission === 'leitor' && <><Eye className="h-3 w-3" /> Leitor</>}
      {permission === 'comentador' && <><MessageSquare className="h-3 w-3" /> Comentador</>}
      {permission === 'editor' && <><Pencil className="h-3 w-3" /> Editor</>}
    </Badge>
  ) : null;

  if (!fileLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="h-7 w-7 rounded hover:bg-accent flex items-center justify-center text-muted-foreground"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary">Mapex</span>
          </div>
          <div className="h-4 w-px bg-border" />
          {editingName && canEdit ? (
            <Input
              className="h-7 w-48 text-sm"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
              autoFocus
            />
          ) : (
            <button
              className="text-sm font-medium hover:text-primary flex items-center gap-1 transition-colors"
              onClick={() => canEdit && setEditingName(true)}
            >
              {fileName}
              {canEdit && <Pencil className="h-3 w-3 text-muted-foreground" />}
            </button>
          )}
          {permissionBadge}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {data.rows.length} linha{data.rows.length !== 1 ? 's' : ''} · {data.columns.length} etapa{data.columns.length !== 1 ? 's' : ''}
          </span>
          {canShare && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                const success = undo();
                if (success) toast.success('Ação desfeita!');
                else toast.info('Nada para desfazer');
              }}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Desfazer
            </Button>
          )}
          {canEdit && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
            >
              <Save className="h-3.5 w-3.5" />
              Salvar
            </button>
          )}
        </div>
      </div>

      {/* Format toolbar — applies to column header row */}
      {canEdit && (
        <FormatToolbar
          disabled={false}
          currentCellColor={selectedHeaderCol !== null ? data.columnHeaderStyles?.[selectedHeaderCol]?.bgColor : undefined}
          currentRowColor={data.headerStyle?.bgColor}
          currentBorder={data.headerStyle?.borderColor}
          currentFontSize={data.headerStyle?.fontSize || 12}
          currentFontColor={data.headerStyle?.fontColor}
          onPaintCell={(color) => {
            if (selectedHeaderCol !== null) {
              updateColumnHeaderStyle(selectedHeaderCol, { bgColor: color });
            } else {
              toast.info('Clique em uma coluna do cabeçalho primeiro para pintar a célula');
            }
          }}
          onPaintRow={(color) => updateHeaderStyle({ bgColor: color })}
          onSetBorder={(color) => updateHeaderStyle({ borderColor: color })}
          onSetFontSize={(size) => updateHeaderStyle({ fontSize: size })}
          onSetFontColor={(color) => updateHeaderStyle({ fontColor: color })}
          selectedHeaderCol={selectedHeaderCol}
        />
      )}

      {/* Read-only banner */}
      {!canEdit && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {permission === 'leitor' ? 'Modo leitura — você pode apenas visualizar este arquivo.' : 'Modo comentador — você pode visualizar e comentar, mas não editar.'}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-x-auto">
        {isLocked ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <p className="text-muted-foreground text-sm">Esta aba está protegida. Clique na aba para desbloqueá-la.</p>
          </div>
        ) : (
          <div className="min-w-fit">
            {/* Column headers */}
            <div
              className="flex sticky top-0 z-10"
              style={{
                backgroundColor: data.headerStyle?.bgColor || undefined,
                border: data.headerStyle?.borderColor ? `2px solid ${data.headerStyle.borderColor}` : undefined,
                borderBottom: !data.headerStyle?.borderColor ? '2px solid hsl(var(--border))' : undefined,
                ...(!data.headerStyle?.bgColor ? { background: 'hsl(var(--muted) / 0.5)' } : {}),
              }}
            >
              <div className="flex">
                {data.columns.map((col, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <div className="flex items-center shrink-0 mx-0.5">
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "relative px-2 py-2 border-r border-border/50 shrink-0 cursor-pointer transition-colors",
                        selectedHeaderCol === i && "ring-2 ring-primary ring-inset"
                      )}
                      style={{
                        width: columnWidths[i],
                        backgroundColor: data.columnHeaderStyles?.[i]?.bgColor || undefined,
                      }}
                      onClick={() => {
                        if (canEdit) {
                          setSelectedHeaderCol(prev => prev === i ? null : i);
                        }
                      }}
                    >
                      {editingCol === i && canEdit ? (
                        <input
                          className="w-full h-6 px-1 font-medium bg-background border border-primary rounded focus:outline-none"
                          style={{
                            fontSize: data.headerStyle?.fontSize ? `${data.headerStyle.fontSize}px` : '12px',
                            color: data.headerStyle?.fontColor || undefined,
                          }}
                          value={col}
                          onChange={e => updateColumnTitle(i, e.target.value)}
                          onBlur={() => setEditingCol(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingCol(null)}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <button
                          className="font-medium hover:opacity-80 transition-colors truncate w-full text-left"
                          style={{
                            fontSize: data.headerStyle?.fontSize ? `${data.headerStyle.fontSize}px` : '12px',
                            color: data.headerStyle?.fontColor || 'hsl(var(--muted-foreground))',
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            canEdit && setEditingCol(i);
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          {col}
                        </button>
                      )}
                      {/* Resize handle */}
                      {canEdit && (
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-20"
                          onMouseDown={e => handleColumnResize(i, e.clientX, columnWidths[i])}
                        />
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {canEdit && (
                <button
                  className="px-2 py-2 hover:bg-accent text-muted-foreground transition-colors shrink-0 flex items-center"
                  onClick={addColumn}
                  title="Adicionar etapa"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <div className="w-[100px] shrink-0" />
            </div>

            {/* Rows */}
            <div ref={containerRef}>
              {data.rows.map((row) => (
                <FlowRowComponent
                  key={row.id}
                  row={row}
                  labels={data.labels}
                  columnCount={data.columns.length}
                  columnWidths={columnWidths}
                  onUpdateCell={canEdit ? (cellId, updates) => updateCell(row.id, cellId, updates) : () => {}}
                  onSetCellType={canEdit ? (cellId, type) => setCellType(row.id, cellId, type) : () => {}}
                  onToggleLabel={canEdit ? labelId => toggleLabel(row.id, labelId) : () => {}}
                  onAddLabel={canEdit ? addLabel : () => {}}
                  onAddObservation={canComment ? text => addObservation(row.id, text) : () => {}}
                  onAddMessage={canComment ? (to, text) => addMessage(row.id, to, text) : () => {}}
                  onDelete={canEdit ? () => deleteRow(row.id) : () => {}}
                  onSetRowColor={canEdit ? (color) => setRowColor(row.id, color) : () => {}}
                  cellRefs={getRowRefs(row.id)}
                  onFocusCell={cellIndex => {
                    if (cellIndex < data.columns.length) {
                      focusCellInRow(row.id, cellIndex);
                    }
                  }}
                  onEnter={canEdit ? handleEnterNewRow : () => {}}
                  onSelectCell={(rowId, cellId) => { setSelectedRowId(rowId); setSelectedCellId(cellId); }}
                />
              ))}
            </div>

            {canEdit && (
              <button
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-1 border-b border-border"
                onClick={addRow}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova linha
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab bar at bottom */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={canEdit ? addTab : () => {}}
        onRemoveTab={canEdit ? removeTab : () => {}}
        onRenameTab={canEdit ? renameTab : () => {}}
        onSetTabColor={canEdit ? setTabColor : () => {}}
        onProtectTab={canEdit ? protectTab : () => {}}
        onUnlockTab={unlockTab}
        onRemoveProtection={canEdit ? removeProtection : () => {}}
      />

      {/* Share dialog */}
      {currentFile && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          fileId={currentFile.id}
          fileName={fileName}
          ownerId={currentFile.ownerId || ''}
        />
      )}
    </div>
  );
};

export default Index;
