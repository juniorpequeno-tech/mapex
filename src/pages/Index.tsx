import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlowStore } from '@/hooks/useFlowStore';
import { FlowRowComponent } from '@/components/flow/FlowRow';
import { TabBar } from '@/components/flow/TabBar';
import { Plus, ChevronRight, Save, GitBranch, ArrowLeft, Pencil } from 'lucide-react';
import { getSavedFiles, saveFile } from '@/lib/fileStorage';
import { SavedFile } from '@/types/flow';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();

  const {
    tabs, activeTabId, activeTab, data,
    setActiveTabId, addTab, removeTab, renameTab, setTabColor,
    protectTab, unlockTab, removeProtection,
    updateColumnTitle, addColumn, addRow, deleteRow,
    updateCell, setCellType, toggleLabel, addLabel,
    updateObservation, addMessage, setRowColor,
    loadTabs,
  } = useFlowStore();

  const [fileName, setFileName] = useState('Sem título');
  const [editingName, setEditingName] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const rowRefsMap = useRef<Map<string, React.MutableRefObject<(HTMLDivElement | null)[]>>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Load file from storage
  useEffect(() => {
    if (fileId) {
      const files = getSavedFiles();
      const file = files.find(f => f.id === fileId);
      if (file) {
        setFileName(file.name);
        setCurrentFileId(file.id);
        if (file.tabs.length > 0) {
          loadTabs(file.tabs);
        }
      }
    }
  }, [fileId]);

  const handleSave = useCallback(() => {
    const file: SavedFile = {
      id: currentFileId || Math.random().toString(36).substr(2, 9),
      name: fileName,
      tabs,
      createdAt: currentFileId ? getSavedFiles().find(f => f.id === currentFileId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveFile(file);
    if (!currentFileId) setCurrentFileId(file.id);
    toast.success('Arquivo salvo!');
  }, [currentFileId, fileName, tabs]);

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
  }, [addRow]);

  const isLocked = activeTab.isProtected && activeTab.isLocked;

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
          {editingName ? (
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
              onClick={() => setEditingName(true)}
            >
              {fileName}
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {data.rows.length} linha{data.rows.length !== 1 ? 's' : ''} · {data.columns.length} etapa{data.columns.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-auto">
        {isLocked ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <p className="text-muted-foreground text-sm">Esta aba está protegida. Clique na aba para desbloqueá-la.</p>
          </div>
        ) : (
          <div className="min-w-fit">
            {/* Column headers */}
            <div className="flex border-b-2 border-border bg-muted/50 sticky top-0 z-10">
              <div className="flex flex-1">
                {data.columns.map((col, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <div className="flex items-center shrink-0 mx-0.5">
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-[180px] px-2 py-2 border-r border-border/50">
                      {editingCol === i ? (
                        <input
                          className="w-full h-6 px-1 text-xs font-medium bg-background border border-primary rounded focus:outline-none"
                          value={col}
                          onChange={e => updateColumnTitle(i, e.target.value)}
                          onBlur={() => setEditingCol(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingCol(null)}
                          autoFocus
                        />
                      ) : (
                        <button
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors truncate w-full text-left"
                          onClick={() => setEditingCol(i)}
                        >
                          {col}
                        </button>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <button
                className="px-2 py-2 hover:bg-accent text-muted-foreground transition-colors shrink-0 flex items-center"
                onClick={addColumn}
                title="Adicionar etapa"
              >
                <Plus className="h-4 w-4" />
              </button>
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
                  onUpdateCell={(cellId, updates) => updateCell(row.id, cellId, updates)}
                  onSetCellType={(cellId, type) => setCellType(row.id, cellId, type)}
                  onToggleLabel={labelId => toggleLabel(row.id, labelId)}
                  onAddLabel={addLabel}
                  onUpdateObservation={text => updateObservation(row.id, text)}
                  onAddMessage={(to, text) => addMessage(row.id, to, text)}
                  onDelete={() => deleteRow(row.id)}
                  onSetRowColor={(color) => setRowColor(row.id, color)}
                  cellRefs={getRowRefs(row.id)}
                  onFocusCell={cellIndex => {
                    if (cellIndex < data.columns.length) {
                      focusCellInRow(row.id, cellIndex);
                    }
                  }}
                  onEnter={handleEnterNewRow}
                />
              ))}
            </div>

            <button
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-1 border-b border-border"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Nova linha
            </button>
          </div>
        )}
      </div>

      {/* Tab bar at bottom */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={addTab}
        onRemoveTab={removeTab}
        onRenameTab={renameTab}
        onSetTabColor={setTabColor}
        onProtectTab={protectTab}
        onUnlockTab={unlockTab}
        onRemoveProtection={removeProtection}
      />
    </div>
  );
};

export default Index;
