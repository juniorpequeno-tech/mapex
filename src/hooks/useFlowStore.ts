import { useState, useCallback, useRef } from 'react';
import { FlowTab, FlowData, FlowRow, CellData, CellType, Label, Message, HeaderStyle, ColumnHeaderStyle } from '@/types/flow';

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_COLORS = [
  'hsl(210, 80%, 60%)', 'hsl(150, 60%, 45%)', 'hsl(45, 90%, 55%)',
  'hsl(0, 70%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(180, 50%, 45%)',
];

const TAB_COLORS = [
  'hsl(210, 70%, 50%)', 'hsl(150, 60%, 40%)', 'hsl(45, 85%, 50%)',
  'hsl(0, 65%, 50%)', 'hsl(280, 55%, 50%)', 'hsl(180, 45%, 40%)',
  'hsl(330, 60%, 50%)', 'hsl(30, 70%, 50%)',
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

const createDefaultFlowData = (): FlowData => ({
  columns: ['Etapa 1', 'Etapa 2', 'Etapa 3'],
  rows: [createEmptyRow(3)],
  labels: [
    { id: generateId(), name: 'Urgente', color: DEFAULT_COLORS[3] },
    { id: generateId(), name: 'Em progresso', color: DEFAULT_COLORS[0] },
    { id: generateId(), name: 'Concluído', color: DEFAULT_COLORS[1] },
  ],
});

const createTab = (name: string, color: string): FlowTab => ({
  id: generateId(),
  name,
  color,
  data: createDefaultFlowData(),
  isProtected: false,
});

export function useFlowStore() {
  const [tabs, setTabs] = useState<FlowTab[]>([
    createTab('Aba 1', TAB_COLORS[0]),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const historyRef = useRef<FlowTab[][]>([]);
  const MAX_HISTORY = 50;

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const data = activeTab.data;

  const pushHistory = useCallback((currentTabs: FlowTab[]) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), JSON.parse(JSON.stringify(currentTabs))];
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return false;
    const previous = historyRef.current.pop()!;
    setTabs(previous);
    const prevActive = previous.find(t => t.id === activeTabId);
    if (!prevActive && previous.length > 0) {
      setActiveTabId(previous[0].id);
    }
    return true;
  }, [activeTabId]);

  const canUndo = historyRef.current.length > 0;

  const updateTabData = useCallback((updater: (prev: FlowData) => FlowData) => {
    setTabs(prev => {
      pushHistory(prev);
      return prev.map(tab =>
        tab.id === activeTabId ? { ...tab, data: updater(tab.data) } : tab
      );
    });
  }, [activeTabId, pushHistory]);

  // Tab management
  const addTab = useCallback(() => {
    const newTab = createTab(`Aba ${tabs.length + 1}`, TAB_COLORS[tabs.length % TAB_COLORS.length]);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const removeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const renameTab = useCallback((tabId: string, name: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, name } : t));
  }, []);

  const setTabColor = useCallback((tabId: string, color: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, color } : t));
  }, []);

  const protectTab = useCallback((tabId: string, email: string, password: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, isProtected: true, protectionEmail: email, protectionPassword: password, isLocked: true } : t
    ));
  }, []);

  const unlockTab = useCallback((tabId: string, password: string): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.protectionPassword === password) {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isLocked: false } : t));
      return true;
    }
    return false;
  }, [tabs]);

  const removeProtection = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, isProtected: false, protectionEmail: undefined, protectionPassword: undefined, isLocked: false } : t
    ));
  }, []);

  // Flow data operations
  const updateColumnTitle = useCallback((index: number, title: string) => {
    updateTabData(prev => {
      const columns = [...prev.columns];
      columns[index] = title;
      return { ...prev, columns };
    });
  }, [updateTabData]);

  const addColumn = useCallback(() => {
    updateTabData(prev => {
      const newColIndex = prev.columns.length;
      return {
        ...prev,
        columns: [...prev.columns, `Etapa ${newColIndex + 1}`],
        columnWidths: [...(prev.columnWidths || prev.columns.map(() => 220)), 220],
        rows: prev.rows.map(row => ({
          ...row,
          cells: [...row.cells, createEmptyCell(newColIndex)],
        })),
      };
    });
  }, [updateTabData]);

  const setColumnWidth = useCallback((index: number, width: number) => {
    updateTabData(prev => {
      const widths = [...(prev.columnWidths || prev.columns.map(() => 220))];
      widths[index] = Math.max(100, width);
      return { ...prev, columnWidths: widths };
    });
  }, [updateTabData]);

  const addRow = useCallback(() => {
    updateTabData(prev => ({
      ...prev,
      rows: [...prev.rows, createEmptyRow(prev.columns.length)],
    }));
  }, [updateTabData]);

  const deleteRow = useCallback((rowId: string) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r.id !== rowId),
    }));
  }, [updateTabData]);

  const updateCell = useCallback((rowId: string, cellId: string, updates: Partial<CellData>) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? { ...row, cells: row.cells.map(cell => cell.id === cellId ? { ...cell, ...updates } : cell) }
          : row
      ),
    }));
  }, [updateTabData]);

  const setCellType = useCallback((rowId: string, cellId: string, type: CellType) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? { ...row, cells: row.cells.map(cell => cell.id === cellId ? { ...cell, type, value: '' } : cell) }
          : row
      ),
    }));
  }, [updateTabData]);

  const toggleLabel = useCallback((rowId: string, labelId: string) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId
          ? { ...row, labels: row.labels.includes(labelId) ? row.labels.filter(l => l !== labelId) : [...row.labels, labelId] }
          : row
      ),
    }));
  }, [updateTabData]);

  const addLabel = useCallback((name: string) => {
    const newLabel: Label = {
      id: generateId(),
      name,
      color: DEFAULT_COLORS[data.labels.length % DEFAULT_COLORS.length],
    };
    updateTabData(prev => ({ ...prev, labels: [...prev.labels, newLabel] }));
    return newLabel;
  }, [data.labels.length, updateTabData]);

  const addObservation = useCallback((rowId: string, text: string) => {
    const entry = { id: generateId(), text, createdAt: new Date().toISOString() };
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, observation: { entries: [...(row.observation?.entries || []), entry], files: row.observation?.files || [] } } : row
      ),
    }));
  }, [updateTabData]);

  const addMessage = useCallback((rowId: string, to: string, text: string) => {
    const msg: Message = { id: generateId(), to, text, createdAt: new Date().toISOString() };
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, messages: [...row.messages, msg] } : row
      ),
    }));
  }, [updateTabData]);

  const setRowColor = useCallback((rowId: string, color: string | undefined) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, bgColor: color } : row
      ),
    }));
  }, [updateTabData]);

  const setRowBorder = useCallback((rowId: string, color: string | undefined) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, borderColor: color } : row
      ),
    }));
  }, [updateTabData]);

  const setRowFontSize = useCallback((rowId: string, size: number) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, fontSize: size } : row
      ),
    }));
  }, [updateTabData]);

  const updateHeaderStyle = useCallback((style: Partial<HeaderStyle>) => {
    updateTabData(prev => ({
      ...prev,
      headerStyle: { ...prev.headerStyle, ...style },
    }));
  }, [updateTabData]);

  const updateColumnHeaderStyle = useCallback((colIndex: number, style: Partial<ColumnHeaderStyle>) => {
    updateTabData(prev => ({
      ...prev,
      columnHeaderStyles: {
        ...prev.columnHeaderStyles,
        [colIndex]: { ...(prev.columnHeaderStyles?.[colIndex] || {}), ...style },
      },
    }));
  }, [updateTabData]);

  const loadTabs = useCallback((newTabs: FlowTab[]) => {
    setTabs(newTabs);
    setActiveTabId(newTabs[0]?.id || '');
  }, []);

  return {
    tabs, activeTabId, activeTab, data,
    setActiveTabId, addTab, removeTab, renameTab, setTabColor,
    protectTab, unlockTab, removeProtection,
    updateColumnTitle, addColumn, addRow, deleteRow,
    updateCell, setCellType, toggleLabel, addLabel,
    addObservation, addMessage, setRowColor, setRowBorder, setRowFontSize,
    updateHeaderStyle, updateColumnHeaderStyle, loadTabs,
    undo, canUndo, setColumnWidth,
  };
}

export { TAB_COLORS };
