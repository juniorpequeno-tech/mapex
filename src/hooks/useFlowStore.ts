import { useState, useCallback } from 'react';
import { FlowData, FlowRow, CellData, CellType, Label, Message } from '@/types/flow';

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_COLORS = [
  'hsl(210, 80%, 60%)', 'hsl(150, 60%, 45%)', 'hsl(45, 90%, 55%)',
  'hsl(0, 70%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
];

const createEmptyCell = (columnIndex: number): CellData => ({
  id: generateId(),
  type: 'text',
  value: '',
  columnIndex,
});

const createEmptyRow = (columnCount: number): FlowRow => ({
  id: generateId(),
  cells: Array.from({ length: columnCount }, (_, i) => createEmptyCell(i)),
  labels: [],
  messages: [],
});

export function useFlowStore() {
  const [data, setData] = useState<FlowData>({
    columns: ['Etapa 1', 'Etapa 2', 'Etapa 3'],
    rows: [createEmptyRow(3)],
    labels: [
      { id: generateId(), name: 'Urgente', color: DEFAULT_COLORS[3] },
      { id: generateId(), name: 'Em progresso', color: DEFAULT_COLORS[0] },
      { id: generateId(), name: 'Concluído', color: DEFAULT_COLORS[1] },
    ],
  });

  const updateColumnTitle = useCallback((index: number, title: string) => {
    setData(prev => {
      const columns = [...prev.columns];
      columns[index] = title;
      return { ...prev, columns };
    });
  }, []);

  const addColumn = useCallback(() => {
    setData(prev => {
      const newColIndex = prev.columns.length;
      return {
        ...prev,
        columns: [...prev.columns, `Etapa ${newColIndex + 1}`],
        rows: prev.rows.map(row => ({
          ...row,
          cells: [...row.cells, createEmptyCell(newColIndex)],
        })),
      };
    });
  }, []);

  const addRow = useCallback(() => {
    setData(prev => ({
      ...prev,
      rows: [...prev.rows, createEmptyRow(prev.columns.length)],
    }));
  }, []);

  const deleteRow = useCallback((rowId: string) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r.id !== rowId),
    }));
  }, []);

  const updateCell = useCallback((rowId: string, cellId: string, updates: Partial<CellData>) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? {
              ...row,
              cells: row.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
              ),
            }
          : row
      ),
    }));
  }, []);

  const setCellType = useCallback((rowId: string, cellId: string, type: CellType) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? {
              ...row,
              cells: row.cells.map(cell =>
                cell.id === cellId ? { ...cell, type, value: '' } : cell
              ),
            }
          : row
      ),
    }));
  }, []);

  const toggleLabel = useCallback((rowId: string, labelId: string) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? {
              ...row,
              labels: row.labels.includes(labelId)
                ? row.labels.filter(l => l !== labelId)
                : [...row.labels, labelId],
            }
          : row
      ),
    }));
  }, []);

  const addLabel = useCallback((name: string) => {
    const newLabel: Label = {
      id: generateId(),
      name,
      color: DEFAULT_COLORS[data.labels.length % DEFAULT_COLORS.length],
    };
    setData(prev => ({ ...prev, labels: [...prev.labels, newLabel] }));
    return newLabel;
  }, [data.labels.length]);

  const updateObservation = useCallback((rowId: string, text: string) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? { ...row, observation: { text, files: row.observation?.files || [] } }
          : row
      ),
    }));
  }, []);

  const addMessage = useCallback((rowId: string, to: string, text: string) => {
    const msg: Message = { id: generateId(), to, text, createdAt: new Date().toISOString() };
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, messages: [...row.messages, msg] } : row
      ),
    }));
  }, []);

  return {
    data,
    updateColumnTitle,
    addColumn,
    addRow,
    deleteRow,
    updateCell,
    setCellType,
    toggleLabel,
    addLabel,
    updateObservation,
    addMessage,
  };
}
