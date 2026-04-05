import React, { useState, useRef, useCallback } from 'react';
import { useFlowStore } from '@/hooks/useFlowStore';
import { FlowRowComponent } from '@/components/flow/FlowRow';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const Index = () => {
  const {
    data, updateColumnTitle, addColumn, addRow, deleteRow,
    updateCell, setCellType, toggleLabel, addLabel,
    updateObservation, addMessage,
  } = useFlowStore();

  const [editingCol, setEditingCol] = useState<number | null>(null);
  const rowRefsMap = useRef<Map<string, React.MutableRefObject<(HTMLDivElement | null)[]>>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

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
          // Try text input first, then select trigger button, then any focusable
          const textInput = cellDiv.querySelector('input.w-full:not([type="file"])') as HTMLElement;
          if (textInput) {
            textInput.focus();
            return;
          }
          const selectBtn = cellDiv.querySelector('[role="combobox"]') as HTMLElement;
          if (selectBtn) {
            selectBtn.focus();
            return;
          }
          const anyFocusable = cellDiv.querySelector('button, input') as HTMLElement;
          anyFocusable?.focus();
        }
      }
    }, 0);
  }, []);

  const handleEnterNewRow = useCallback(() => {
    addRow();
    // Focus first cell of new row after render
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mapa de Fluxos Operacionais</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {data.rows.length} linha{data.rows.length !== 1 ? 's' : ''} · {data.columns.length} etapa{data.columns.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {/* Add column button */}
            <button
              className="px-2 py-2 hover:bg-accent text-muted-foreground transition-colors shrink-0 flex items-center"
              onClick={addColumn}
              title="Adicionar etapa"
            >
              <Plus className="h-4 w-4" />
            </button>
            {/* Spacer for action icons */}
            <div className="w-[100px] shrink-0" />
          </div>

          {/* Rows */}
          <div ref={containerRef}>
            {data.rows.map((row, rowIndex) => (
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
                cellRefs={getRowRefs(row.id)}
                onFocusCell={cellIndex => {
                  if (cellIndex < data.columns.length) {
                    setTimeout(() => focusCellInRow(row.id, cellIndex), 0);
                  }
                }}
                onEnter={handleEnterNewRow}
              />
            ))}
          </div>

          {/* Add row button */}
          <button
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-1 border-b border-border"
            onClick={addRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Nova linha
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
