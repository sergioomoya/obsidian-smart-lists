import { SmartListData, TableCallbacks, ColumnDefinition, ColumnType, COLUMN_TYPE_LABELS } from '../models/types';
import { Person } from '../services/person.service';
import { renderCell } from './cell.renderer';
import { renderHeader } from './header.renderer';
import { generateColumnId } from '../utils/id.utils';
import { createElement, clearChildren, addListener, setupClickOutside } from '../utils/dom.utils';

export function renderSmartList(
  container: HTMLElement,
  data: SmartListData,
  callbacks: TableCallbacks,
  lookupValuesMap?: Map<string, string[]>,
  persons?: Person[]
): void {
  let sortConfig: { columnId: string; dir: 'asc'|'desc'|null } = { columnId: '', dir: null };
  let filters: Record<string, string[]> = {};

  const getCellText = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && !Array.isArray(val) && 'text' in val) return String(val.text);
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  const getUniqueValues = (columnId: string) => {
    const vals = data.rows.map(r => getCellText(r[columnId]));
    return Array.from(new Set(vals));
  };

  clearChildren(container);

  const wrapper = createElement('div') as HTMLElement;
  wrapper.className = 'sl-container';

  // Title bar
  const titleBar = createElement('div') as HTMLElement;
  titleBar.className = 'sl-title-bar';
  titleBar.style.display = 'flex';
  titleBar.style.alignItems = 'center';
  titleBar.style.justifyContent = 'space-between';

  const title = createElement('h3') as HTMLElement;
  title.className = 'sl-title';
  title.textContent = data.title || 'Untitled Smart List';
  titleBar.appendChild(title);

  const copyBtn = createElement('button') as HTMLButtonElement;
  copyBtn.className = 'sl-btn';
  copyBtn.innerHTML = '📋 Copiar Tabla';
  copyBtn.title = 'Copiar tabla renderizada al portapapeles';
  copyBtn.style.padding = '4px 8px';
  copyBtn.style.fontSize = '12px';
  titleBar.appendChild(copyBtn);

  wrapper.appendChild(titleBar);

  const tableWrapper = createElement('div') as HTMLElement;
  tableWrapper.className = 'sl-table-wrapper';
  tableWrapper.style.overflowX = 'auto';
  
  wrapper.appendChild(tableWrapper);

  const openAddColForm = (index?: number, container?: HTMLElement, cleanup?: () => void) => {
    const formDiv = createElement('div') as HTMLElement;
    formDiv.className = 'sl-add-col-form sl-floating-col-form';

    const nameInput = createElement('input') as HTMLInputElement;
    nameInput.type = 'text';
    nameInput.placeholder = 'Nombre';
    nameInput.className = 'sl-input';

    const typeSelect = createElement('select') as HTMLSelectElement;
    typeSelect.className = 'sl-input';
    Object.keys(COLUMN_TYPE_LABELS).forEach(key => {
      const option = createElement('option') as HTMLOptionElement;
      option.value = key;
      option.textContent = COLUMN_TYPE_LABELS[key as ColumnType];
      typeSelect.appendChild(option);
    });

    const submitBtn = createElement('button') as HTMLButtonElement;
    submitBtn.textContent = 'Añadir';

    let cleanupClickOutside: () => void;
    const closeForm = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (formDiv.parentElement) formDiv.parentElement.removeChild(formDiv);
      if (cleanup) cleanup();
    };

    addListener(submitBtn, 'click', () => {
      const colName = nameInput.value.trim();
      const colType = typeSelect.value as ColumnType;
      
      if (colName) {
        const existingIds = data.columns.map(c => c.id);
        const newId = generateColumnId(colName, existingIds);
        
        const newCol: ColumnDefinition = {
          id: newId,
          name: colName,
          type: colType
        };

        if (callbacks.onColumnAdd) {
          callbacks.onColumnAdd(newCol, index);
        }
      } else {
        closeForm();
      }
    });
    
    const cancelBtn = createElement('button') as HTMLButtonElement;
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'sl-cancel-btn';
    addListener(cancelBtn, 'click', closeForm);

    formDiv.appendChild(nameInput);
    formDiv.appendChild(typeSelect);
    formDiv.appendChild(submitBtn);
    formDiv.appendChild(cancelBtn);

    document.body.appendChild(formDiv);

    if (container) {
      const rect = container.getBoundingClientRect();
      formDiv.style.position = 'fixed';
      formDiv.style.top = `${rect.bottom + 4}px`;
      formDiv.style.left = `${rect.left}px`;
    }
    
    cleanupClickOutside = setupClickOutside(formDiv, closeForm, container);
    nameInput.focus();
  };

  let currentRows: any[] = [];

  const renderTableContents = () => {
    clearChildren(tableWrapper);

    const table = createElement('div') as HTMLElement;
    table.className = 'sl-table';

    const thead = createElement('div') as HTMLElement;
    thead.className = 'sl-thead';
    const trHead = createElement('div') as HTMLElement;
    trHead.className = 'sl-tr';

    data.columns.forEach((col, idx) => {
      const th = renderHeader(col, callbacks, {
        sortState: sortConfig.columnId === col.id ? sortConfig.dir : null,
        activeFilters: filters[col.id] || [],
        uniqueValues: getUniqueValues(col.id),
        onSortClick: (colId) => {
          if (sortConfig.columnId === colId) {
            if (sortConfig.dir === 'asc') sortConfig.dir = 'desc';
            else if (sortConfig.dir === 'desc') { sortConfig.columnId = ''; sortConfig.dir = null; }
          } else {
            sortConfig.columnId = colId;
            sortConfig.dir = 'asc';
          }
          renderTableContents();
        },
        onFilterChange: (colId, values) => {
          if (!values || values.length === 0 || values.length === getUniqueValues(colId).length) {
            delete filters[colId];
          } else {
            filters[colId] = values;
          }
          renderTableContents();
        }
      });
      th.draggable = true;
      addListener(th, 'dragstart', (e: DragEvent) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('application/json', JSON.stringify({type: 'col', index: idx}));
          e.dataTransfer.effectAllowed = 'move';
        }
        th.classList.add('sl-col-dragging');
      });
      addListener(th, 'dragover', (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        th.classList.add('sl-col-drag-over');
      });
      addListener(th, 'dragleave', () => th.classList.remove('sl-col-drag-over'));
      addListener(th, 'drop', (e: DragEvent) => {
        e.preventDefault();
        th.classList.remove('sl-col-drag-over');
        if (e.dataTransfer) {
          try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (dragData.type === 'col' && typeof dragData.index === 'number' && dragData.index !== idx) {
              if (callbacks.onColumnReorder) callbacks.onColumnReorder(dragData.index, idx);
            }
          } catch (err) {}
        }
      });
      addListener(th, 'dragend', () => th.classList.remove('sl-col-dragging'));

      const insertColBtn = createElement('div') as HTMLElement;
      insertColBtn.className = 'sl-insert-col-btn';
      insertColBtn.title = 'Añadir columna aquí';
      insertColBtn.innerHTML = '+';
      addListener(insertColBtn, 'click', (e) => {
        e.stopPropagation();
        openAddColForm(idx + 1, th, () => {});
      });
      th.appendChild(insertColBtn);

      trHead.appendChild(th);
    });

    const thActions = createElement('div') as HTMLElement;
    thActions.className = 'sl-th';
    trHead.appendChild(thActions);
    thead.appendChild(trHead);
    table.appendChild(thead);

    // Process rows
    let processedRows = data.rows.map((row, index) => ({ row, originalIndex: index }));

    Object.keys(filters).forEach(colId => {
      const allowed = new Set(filters[colId]);
      if (allowed.size > 0) {
        processedRows = processedRows.filter(item => {
          const txt = getCellText(item.row[colId]);
          return allowed.has(txt);
        });
      }
    });

    if (sortConfig.columnId && sortConfig.dir) {
      const colDef = data.columns.find(c => c.id === sortConfig.columnId);
      processedRows.sort((a, b) => {
        const valA = getCellText(a.row[sortConfig.columnId]);
        const valB = getCellText(b.row[sortConfig.columnId]);
        
        if (colDef?.type === ColumnType.Number) {
          const nA = Number(valA);
          const nB = Number(valB);
          if (!isNaN(nA) && !isNaN(nB)) {
            return sortConfig.dir === 'asc' ? nA - nB : nB - nA;
          }
        }
        return sortConfig.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    // Tbody
    const tbody = createElement('div') as HTMLElement;
    tbody.className = 'sl-tbody';
    
    currentRows = processedRows;

    processedRows.forEach(item => {
      const { row, originalIndex } = item;
      const tr = createElement('div') as HTMLElement;
      tr.className = 'sl-row';
      tr.setAttribute('data-index', originalIndex.toString());

      addListener(tr, 'dragstart', (e: DragEvent) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('application/json', JSON.stringify({type: 'row', index: originalIndex}));
          e.dataTransfer.effectAllowed = 'move';
        }
        tr.classList.add('sl-row-dragging');
      });
      addListener(tr, 'dragover', (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        tr.classList.add('sl-row-drag-over');
      });
      addListener(tr, 'dragleave', () => tr.classList.remove('sl-row-drag-over'));
      addListener(tr, 'drop', (e: DragEvent) => {
        e.preventDefault();
        tr.classList.remove('sl-row-drag-over');
        if (e.dataTransfer) {
          try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (dragData.type === 'row' && typeof dragData.index === 'number' && dragData.index !== originalIndex) {
              if (callbacks.onRowReorder) callbacks.onRowReorder(dragData.index, originalIndex);
            }
          } catch (err) {}
        }
      });
      addListener(tr, 'dragend', () => tr.classList.remove('sl-row-dragging'));

      data.columns.forEach((col, colIndex) => {
        const td = createElement('div') as HTMLElement;
        td.className = 'sl-td';
        td.setAttribute('data-col-name', col.name);
        
        if (colIndex === 0) {
          td.style.position = 'relative';

          const dragHandle = createElement('div') as HTMLElement;
          dragHandle.className = 'sl-drag-handle';
          dragHandle.innerHTML = '⋮⋮';
          
          addListener(dragHandle, 'mousedown', () => { tr.draggable = true; });
          addListener(dragHandle, 'mouseup', () => { tr.draggable = false; });
          addListener(dragHandle, 'mouseleave', () => { tr.draggable = false; });
          td.appendChild(dragHandle);

          const insertRowBtn = createElement('div') as HTMLElement;
          insertRowBtn.className = 'sl-insert-row-btn';
          insertRowBtn.title = 'Añadir fila debajo';
          insertRowBtn.innerHTML = '+';
          addListener(insertRowBtn, 'click', (e) => {
            e.stopPropagation();
            if (callbacks.onRowAdd) callbacks.onRowAdd(originalIndex + 1);
          });
          td.appendChild(insertRowBtn);
        }
        
        const val = row[col.id] ?? null;
        const lookupVals = lookupValuesMap ? lookupValuesMap.get(col.id) : undefined;
        
        const cellElement = renderCell(
          col,
          val,
          (newVal) => {
            if (callbacks.onCellChange) {
              callbacks.onCellChange(originalIndex, col.id, newVal);
            }
          },
          lookupVals,
          persons
        );

        td.appendChild(cellElement);
        tr.appendChild(td);
      });

      const tdActions = createElement('div') as HTMLElement;
      tdActions.className = 'sl-td-actions';
      const delBtn = createElement('button') as HTMLButtonElement;
      delBtn.className = 'sl-row-delete-btn';
      delBtn.textContent = 'X';
      
      addListener(delBtn, 'click', () => {
        if (callbacks.onRowDelete) {
          callbacks.onRowDelete(originalIndex);
        }
      });

      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    wrapper.appendChild(tableWrapper);
  };

  renderTableContents();

  renderTableContents();

  addListener(copyBtn, 'click', async () => {
    let html = '<table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #1e1e1e; color: #d4d4d4; font-size: 13px; width: 100%; border: 1px solid #333;">';
    html += '<thead><tr>';
    const plainLines: string[] = [];
    const plainHeaders: string[] = [];
    data.columns.forEach(col => {
      html += `<th style="padding: 10px 12px; background-color: #111827; color: #9ca3af; text-align: left; font-weight: 600; border-bottom: 1px solid #374151; white-space: nowrap;">${col.name}</th>`;
      plainHeaders.push(col.name);
    });
    html += '</tr></thead><tbody>';
    plainLines.push(plainHeaders.join('\t'));

    currentRows.forEach(item => {
      html += '<tr>';
      const plainRow: string[] = [];
      data.columns.forEach(col => {
        const text = getCellText(item.row[col.id]);
        plainRow.push(text.replace(/\t/g, ' ').replace(/\n/g, ' '));
        
        const htmlText = text.replace(/\n/g, '<br>');
        let cellHtml = htmlText;

        if (text && (col.type === ColumnType.Select || col.type === ColumnType.MultiSelect)) {
          const vals = col.type === ColumnType.MultiSelect ? text.split(', ') : [text];
          cellHtml = vals.map(v => {
            const opt = col.options?.find(o => o.label === v);
            const color = opt?.color || '#4b5563';
            return `<span style="background-color: ${color}; color: #ffffff; padding: 3px 10px; border-radius: 12px; font-size: 12px; display: inline-block; font-weight: 500; margin-right: 4px; white-space: nowrap;">${v}</span>`;
          }).join('');
        } else if (text && col.type === ColumnType.Person) {
          const vals = text.split(', ');
          cellHtml = vals.map(v => `<span style="background-color: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; padding: 3px 10px; border-radius: 12px; font-size: 12px; display: inline-block; font-weight: 500; margin-right: 4px; white-space: nowrap;">👤 ${v}</span>`).join('');
        }
        
        html += `<td style="padding: 10px 12px; border-bottom: 1px solid #374151; vertical-align: top;">${cellHtml}</td>`;
      });
      html += '</tr>';
      plainLines.push(plainRow.join('\t'));
    });
    html += '</tbody></table>';

    try {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainLines.join('\n')], { type: 'text/plain' })
      });
      await navigator.clipboard.write([clipboardItem]);
      
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✅ Copiado';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Error copying to clipboard', err);
    }
  });

  container.appendChild(wrapper);
}
