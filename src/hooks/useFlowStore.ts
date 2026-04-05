import { useState, useCallback } from 'react';
import { FlowTab, FlowData, FlowRow, CellData, CellType, Label, Message } from '@/types/flow';

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

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const data = activeTab.data;

  const updateTabData = useCallback((updater: (prev: FlowData) => FlowData) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, data: updater(tab.data) } : tab
    ));
  }, [activeTabId]);

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
        rows: prev.rows.map(row => ({
          ...row,
          cells: [...row.cells, createEmptyCell(newColIndex)],
        })),
      };
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

  const updateObservation = useCallback((rowId: string, text: string) => {
    updateTabData(prev => ({
      ...prev,
      rows: prev.rows.map(row =>
        row.id === rowId ? { ...row, observation: { text, files: row.observation?.files || [] } } : row
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

  return {
    tabs, activeTabId, activeTab, data,
    setActiveTabId, addTab, removeTab, renameTab, setTabColor,
    protectTab, unlockTab, removeProtection,
    updateColumnTitle, addColumn, addRow, deleteRow,
    updateCell, setCellType, toggleLabel, addLabel,
    updateObservation, addMessage, setRowColor,
  };
}
