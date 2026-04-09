export type CellType = 'text' | 'dropdown' | 'date' | 'file';

export interface DropdownOption {
  id: string;
  label: string;
}

export interface CellData {
  id: string;
  type: CellType;
  value: string;
  dropdownOptions?: DropdownOption[];
  fileName?: string;
  columnIndex: number;
  bgColor?: string;
  fontSize?: number;
  borderColor?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ObservationEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface Observation {
  entries: ObservationEntry[];
  files: { name: string; url: string }[];
}

export interface Message {
  id: string;
  to: string;
  text: string;
  createdAt: string;
}

export interface FlowRow {
  id: string;
  cells: CellData[];
  labels: string[];
  observation?: Observation;
  messages: Message[];
  bgColor?: string;
}

export interface FlowData {
  columns: string[];
  columnWidths?: number[];
  rows: FlowRow[];
  labels: Label[];
}

export interface FlowTab {
  id: string;
  name: string;
  color: string;
  data: FlowData;
  isProtected: boolean;
  protectionEmail?: string;
  protectionPassword?: string;
  isLocked?: boolean;
}

export interface SavedFile {
  id: string;
  name: string;
  tabs: FlowTab[];
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  permission?: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}
