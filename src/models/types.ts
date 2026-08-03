// ─── Column Types ───────────────────────────────────────────────────────────

/** Tipos de columna soportados por Smart Lists. */
export enum ColumnType {
  Text = 'text',
  Number = 'number',
  Select = 'select',
  MultiSelect = 'multiselect',
  Date = 'date',
  Checkbox = 'checkbox',
  Person = 'person',
  Url = 'url',
  Lookup = 'lookup',
}

/** Mapa de iconos SVG por tipo de columna. */
export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  [ColumnType.Text]: 'type',
  [ColumnType.Number]: 'hash',
  [ColumnType.Select]: 'chevron-down',
  [ColumnType.MultiSelect]: 'list',
  [ColumnType.Date]: 'calendar',
  [ColumnType.Checkbox]: 'check-square',
  [ColumnType.Person]: 'user',
  [ColumnType.Url]: 'link',
  [ColumnType.Lookup]: 'search',
};

/** Etiquetas legibles para cada tipo de columna. */
export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  [ColumnType.Text]: 'Texto',
  [ColumnType.Number]: 'Número',
  [ColumnType.Select]: 'Selección',
  [ColumnType.MultiSelect]: 'Multi-selección',
  [ColumnType.Date]: 'Fecha',
  [ColumnType.Checkbox]: 'Casilla',
  [ColumnType.Person]: 'Persona',
  [ColumnType.Url]: 'URL',
  [ColumnType.Lookup]: 'Búsqueda',
};

// ─── Data Structures ────────────────────────────────────────────────────────

/** Opción individual para columnas de tipo select/multiselect. */
export interface SelectOption {
  label: string;
  color: string;
}

/** Definición de una columna de la tabla. */
export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  width?: number;
  /** Opciones disponibles (solo para select/multiselect). */
  options?: SelectOption[];
  /** Ruta relativa al archivo o ID de smartlist origen (para lookup/person). */
  source?: string;
  /** Columna de la tabla origen cuyo valor se muestra (para lookup). */
  sourceColumn?: string;
}

/** Valor posible de una celda. */
export type CellValue = string | number | boolean | string[] | { text: string, tooltip?: string } | null;

/** Una fila de datos con ID único y valores indexados por ID de columna. */
export interface RowData {
  _id: string;
  [columnId: string]: CellValue;
}

/** Estructura raíz de una Smart List serializada en JSON. */
export interface SmartListData {
  /** ID único de esta tabla (para ser referenciada por campos lookup). */
  id?: string;
  title: string;
  columns: ColumnDefinition[];
  rows: RowData[];
}

// ─── Callbacks ──────────────────────────────────────────────────────────────

/** Callbacks que la tabla emite cuando el usuario interactúa con ella. */
export interface TableCallbacks {
  onCellChange: (rowIndex: number, columnId: string, value: CellValue) => void;
  onRowAdd: (index?: number) => void;
  onRowDelete: (rowIndex: number) => void;
  onColumnAdd: (column: ColumnDefinition, index?: number) => void;
  onColumnDelete: (columnId: string) => void;
  onColumnRename: (columnId: string, newName: string) => void;
  onRowReorder: (fromIndex: number, toIndex: number) => void;
  onColumnReorder: (fromIndex: number, toIndex: number) => void;
  onSort?: (columnId: string, direction: 'asc'|'desc'|null) => void;
  onFilter?: (filters: Record<string, string[]>) => void;
}

export interface UIState {
  sortConfig: { columnId: string; dir: 'asc'|'desc'|null };
  filters: Record<string, string[]>;
}

// ─── Default Colors ─────────────────────────────────────────────────────────

/** Paleta de colores predefinidos para pills de selección. */
export const DEFAULT_SELECT_COLORS: string[] = [
  '#ef4444', // Rojo
  '#f59e0b', // Ámbar
  '#10b981', // Esmeralda
  '#3b82f6', // Azul
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#6b7280', // Gris
  '#14b8a6', // Teal
];
