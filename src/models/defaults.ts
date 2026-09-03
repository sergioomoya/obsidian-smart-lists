import { SmartListData, ColumnType } from './types';
import { generateId } from '../utils/id.utils';

export function createDefaultSmartList(): SmartListData {
  return {
    title: 'Nueva Lista',
    columns: [
      { id: 'col_text', name: 'Nombre', type: ColumnType.Text },
      { 
        id: 'col_status', 
        name: 'Estado', 
        type: ColumnType.Select, 
        options: [
          { label: 'Pendiente', color: '#f59e0b' },
          { label: 'Completado', color: '#10b981' }
        ] 
      }
    ],
    rows: [
      { _id: generateId('r'), col_text: 'Ejemplo 1', col_status: 'Pendiente' },
      { _id: generateId('r'), col_text: 'Ejemplo 2', col_status: 'Completado' }
    ]
  };
}
