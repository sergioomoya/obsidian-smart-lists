import { 
  SmartListData, 
  CellValue, 
  RowData, 
  ColumnDefinition,
  ColumnType 
} from '../models/types';
import { generateId } from '../utils/id.utils';

/**
 * Devuelve el valor por defecto para un tipo de columna dado.
 * @param type Tipo de columna
 * @returns Valor por defecto
 */
const getDefaultValueForType = (type: ColumnType): CellValue => {
  switch (type) {
    case ColumnType.Number:
      return 0;
    case ColumnType.Checkbox:
      return false;
    case ColumnType.MultiSelect:
      return [];
    case ColumnType.Text:
    case ColumnType.Select:
    case ColumnType.Person:
    case ColumnType.Url:
    case ColumnType.Lookup:
    case ColumnType.Date:
    default:
      return '';
  }
};

/**
 * Parsea y valida el JSON de un bloque SmartList, aplicando valores por defecto.
 * Si falta rows o columns, los inicializa a arreglos vacíos.
 * Si una fila no tiene _id, lo genera.
 * @param source String JSON a parsear
 * @returns Objeto SmartListData validado
 */
export const parseSmartListJson = (source: string): SmartListData => {
  try {
    const data = JSON.parse(source) as Partial<SmartListData>;
    const columns = data.columns || [];
    const rows = (data.rows || []).map(row => {
      if (!row._id) {
        return { ...row, _id: generateId('row') };
      }
      return row;
    });

    return {
      id: data.id,
      title: data.title || '',
      columns,
      rows
    };
  } catch (error) {
    console.error('Error parsing SmartList JSON:', error);
    return { title: '', columns: [], rows: [] };
  }
};

/**
 * Serializa un objeto SmartListData a string JSON con formato.
 * @param data Objeto SmartListData
 * @returns String JSON
 */
export const serializeSmartListJson = (data: SmartListData): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Actualiza el valor de una celda específica en una fila y columna dadas.
 * @param data Estado actual de SmartListData
 * @param rowIndex Índice de la fila a actualizar
 * @param columnId ID de la columna a actualizar
 * @param value Nuevo valor para la celda
 * @returns Nuevo estado de SmartListData
 */
export const updateCell = (
  data: SmartListData, 
  rowIndex: number, 
  columnId: string, 
  value: CellValue
): SmartListData => {
  if (rowIndex < 0 || rowIndex >= data.rows.length) return data;

  const newRows = [...data.rows];
  newRows[rowIndex] = {
    ...newRows[rowIndex],
    [columnId]: value
  } as RowData;

  return {
    ...data,
    rows: newRows
  };
};

/**
 * Añade una nueva fila a la lista con valores por defecto para cada columna.
 * @param data Estado actual de SmartListData
 * @param index Índice opcional donde insertar la fila (por defecto al final)
 * @returns Nuevo estado de SmartListData
 */
export const addRow = (data: SmartListData, index?: number): SmartListData => {
  const newRow: RowData = { _id: generateId('row') };
  
  data.columns.forEach(col => {
    newRow[col.id] = getDefaultValueForType(col.type);
  });

  const newRows = [...data.rows];
  if (index !== undefined && index >= 0 && index <= newRows.length) {
    newRows.splice(index, 0, newRow);
  } else {
    newRows.push(newRow);
  }

  return {
    ...data,
    rows: newRows
  };
};

/**
 * Elimina una fila en el índice especificado.
 * @param data Estado actual de SmartListData
 * @param rowIndex Índice de la fila a eliminar
 * @returns Nuevo estado de SmartListData
 */
export const deleteRow = (data: SmartListData, rowIndex: number): SmartListData => {
  if (rowIndex < 0 || rowIndex >= data.rows.length) return data;

  const newRows = [...data.rows];
  newRows.splice(rowIndex, 1);

  return {
    ...data,
    rows: newRows
  };
};

/**
 * Reordena las filas moviendo una fila de una posición a otra.
 * @param data Estado actual de SmartListData
 * @param fromIndex Índice de origen de la fila
 * @param toIndex Índice de destino de la fila
 * @returns Nuevo estado de SmartListData
 */
export const reorderRows = (
  data: SmartListData, 
  fromIndex: number, 
  toIndex: number
): SmartListData => {
  if (fromIndex < 0 || fromIndex >= data.rows.length || toIndex < 0 || toIndex >= data.rows.length) {
    return data;
  }

  const newRows = [...data.rows];
  const [movedRow] = newRows.splice(fromIndex, 1);
  if (movedRow) {
    newRows.splice(toIndex, 0, movedRow);
  }

  return {
    ...data,
    rows: newRows
  };
};

/**
 * Añade una nueva columna a la lista e inicializa su valor por defecto en cada fila.
 * @param data Estado actual de SmartListData
 * @param column Definición de la nueva columna
 * @param index Índice opcional donde insertar la columna (por defecto al final)
 * @returns Nuevo estado de SmartListData
 */
export const addColumn = (data: SmartListData, column: ColumnDefinition, index?: number): SmartListData => {
  const defaultValue = getDefaultValueForType(column.type);
  const newRows = data.rows.map(row => ({
    ...row,
    [column.id]: defaultValue
  }));

  const newColumns = [...data.columns];
  if (index !== undefined && index >= 0 && index <= newColumns.length) {
    newColumns.splice(index, 0, column);
  } else {
    newColumns.push(column);
  }

  return {
    ...data,
    columns: newColumns,
    rows: newRows
  };
};

/**
 * Reordena las columnas moviendo una columna de una posición a otra.
 * @param data Estado actual de SmartListData
 * @param fromIndex Índice de origen de la columna
 * @param toIndex Índice de destino de la columna
 * @returns Nuevo estado de SmartListData
 */
export const reorderColumns = (
  data: SmartListData, 
  fromIndex: number, 
  toIndex: number
): SmartListData => {
  if (fromIndex < 0 || fromIndex >= data.columns.length || toIndex < 0 || toIndex >= data.columns.length) {
    return data;
  }

  const newColumns = [...data.columns];
  const [movedColumn] = newColumns.splice(fromIndex, 1);
  if (movedColumn) {
    newColumns.splice(toIndex, 0, movedColumn);
  }

  return {
    ...data,
    columns: newColumns
  };
};

/**
 * Elimina una columna por su ID y remueve su clave de todas las filas.
 * @param data Estado actual de SmartListData
 * @param columnId ID de la columna a eliminar
 * @returns Nuevo estado de SmartListData
 */
export const deleteColumn = (data: SmartListData, columnId: string): SmartListData => {
  const newColumns = data.columns.filter(col => col.id !== columnId);
  
  const newRows = data.rows.map(row => {
    const newRow = { ...row };
    delete newRow[columnId];
    return newRow;
  });

  return {
    ...data,
    columns: newColumns,
    rows: newRows
  };
};

/**
 * Renombra una columna actualizando su propiedad 'name'.
 * @param data Estado actual de SmartListData
 * @param columnId ID de la columna a renombrar
 * @param newName Nuevo nombre de la columna
 * @returns Nuevo estado de SmartListData
 */
export const renameColumn = (
  data: SmartListData, 
  columnId: string, 
  newName: string
): SmartListData => {
  const newColumns = data.columns.map(col => 
    col.id === columnId ? { ...col, name: newName } : col
  );

  return {
    ...data,
    columns: newColumns
  };
};
