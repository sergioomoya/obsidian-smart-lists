import { SmartListData, TableCallbacks, ColumnDefinition, ColumnType, COLUMN_TYPE_LABELS, UIState } from '../models/types';
import { SmartListSettings } from '../settings';
import { Person } from '../services/person.service';
import { renderCell } from './cell.renderer';
import { renderHeader } from './header.renderer';
import { generateColumnId } from '../utils/id.utils';
import { createElement, clearChildren, addListener, setupClickOutside } from '../utils/dom.utils';
import { applyFilters, applySorting, getCellDisplayText } from '../services/data.service';
import { attachDragHandlers, attachDragHandle } from '../utils/dnd.utils';
import { copyTableToClipboard } from '../utils/clipboard.utils';

export function renderSmartList(
  container: HTMLElement,
  data: SmartListData,
  callbacks: TableCallbacks,
  uiState: UIState,
  lookupValuesMap?: Map<string, string[]>,
  persons?: Person[],
  settings?: SmartListSettings
): void {
  const getUniqueValues = (columnId: string) => {
    const vals = data.rows.map(r => getCellDisplayText(r[columnId]));
    return Array.from(new Set(vals));
  };

  clearChildren(container);

  const wrapper = createElement('div') as HTMLElement;
  wrapper.className = 'sl-container';
  if (settings?.tableDensity === 'compact') {
    wrapper.classList.add('sl-density-compact');
  }

  // Title bar
  const titleBar = createElement('div') as HTMLElement;
  titleBar.className = 'sl-title-bar sl-title-bar-flex';

  const title = createElement('h3') as HTMLElement;
  title.className = 'sl-title';
  title.textContent = data.title || 'Untitled Smart List';
  titleBar.appendChild(title);

  const controlsContainer = createElement('div') as HTMLElement;
  controlsContainer.className = 'sl-controls-container';

  const clearBtn = createElement('button') as HTMLButtonElement;
  clearBtn.className = 'sl-btn-action sl-btn-icon';
  clearBtn.innerHTML = '✖️';
  clearBtn.title = 'Limpiar filtros (Borrar filtros activos)';
  addListener(clearBtn, 'click', () => {
    if (callbacks.onClearFilters) callbacks.onClearFilters();
  });

  const saveFilterBtn = createElement('button') as HTMLButtonElement;
  saveFilterBtn.className = 'sl-btn-action sl-btn-icon';
  saveFilterBtn.innerHTML = '💾';
  saveFilterBtn.title = 'Guardar filtro actual por defecto';
  addListener(saveFilterBtn, 'click', () => {
    if (callbacks.onSaveFilters) callbacks.onSaveFilters(uiState);
    const originalText = saveFilterBtn.innerHTML;
    saveFilterBtn.innerHTML = '✅';
    setTimeout(() => {
      saveFilterBtn.innerHTML = originalText;
    }, 2000);
  });

  const copyBtn = createElement('button') as HTMLButtonElement;
  copyBtn.className = 'sl-btn-action sl-btn-icon';
  copyBtn.innerHTML = '📋';
  copyBtn.title = 'Copiar tabla renderizada al portapapeles';
  
  controlsContainer.appendChild(clearBtn);
  controlsContainer.appendChild(saveFilterBtn);
  controlsContainer.appendChild(copyBtn);

  if (callbacks.onFathomSync) {
    const syncBtn = createElement('button') as HTMLButtonElement;
    syncBtn.className = 'sl-btn-action sl-btn-icon';
    syncBtn.innerHTML = '🔄';
    syncBtn.title = 'Guardar y Sincronizar con Fathom Notebook';
    addListener(syncBtn, 'click', () => {
      if (callbacks.onFathomSync) callbacks.onFathomSync();
    });
    controlsContainer.appendChild(syncBtn);
  }

  titleBar.appendChild(controlsContainer);

  wrapper.appendChild(titleBar);

  const tableWrapper = createElement('div') as HTMLElement;
  tableWrapper.className = 'sl-table-wrapper sl-overflow-x';
  
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

    if (settings?.showRowNumbers) {
      const thNum = createElement('div') as HTMLElement;
      thNum.className = 'sl-th sl-th-row-num';
      thNum.textContent = '#';
      trHead.appendChild(thNum);
    }

    data.columns.forEach((col, idx) => {
      const th = renderHeader(col, callbacks, {
        sortState: uiState.sortConfig.columnId === col.id ? uiState.sortConfig.dir : null,
        activeFilters: uiState.filters[col.id] || [],
        uniqueValues: getUniqueValues(col.id),
        onSortClick: (colId) => {
          if (uiState.sortConfig.columnId === colId) {
            if (uiState.sortConfig.dir === 'asc') uiState.sortConfig.dir = 'desc';
            else if (uiState.sortConfig.dir === 'desc') {
              uiState.sortConfig.columnId = '';
              uiState.sortConfig.dir = null;
            }
          } else {
            uiState.sortConfig.columnId = colId;
            uiState.sortConfig.dir = 'asc';
          }
          if (callbacks.onSort) callbacks.onSort(uiState.sortConfig.columnId, uiState.sortConfig.dir);
          renderTableContents();
        },
        onFilterChange: (colId, vals) => {
          if (!vals || vals.length === 0 || vals.length === getUniqueValues(colId).length) {
            delete uiState.filters[colId];
          } else {
            uiState.filters[colId] = vals;
          }
          if (callbacks.onFilter) callbacks.onFilter(uiState.filters);
          renderTableContents();
        }
      });
      const iconSpan = th.querySelector('.sl-header-icon');
      if (iconSpan) {
        attachDragHandle(iconSpan as HTMLElement, th);
      }

      attachDragHandlers(th, {
        type: 'col',
        index: idx,
        draggingClass: 'sl-col-dragging',
        dragOverClass: 'sl-col-drag-over',
        onReorder: (from, to) => {
          if (callbacks.onColumnReorder) callbacks.onColumnReorder(from, to);
        }
      });

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

    let processedRows = applyFilters(data.rows, uiState.filters);
    processedRows = applySorting(processedRows, uiState.sortConfig.columnId, uiState.sortConfig.dir, data.columns);

    // Tbody
    const tbody = createElement('div') as HTMLElement;
    tbody.className = 'sl-tbody';
    
    currentRows = processedRows;

    processedRows.forEach((item, visualIndex) => {
      const { row, originalIndex } = item;
      const tr = createElement('div') as HTMLElement;
      tr.className = 'sl-row';
      tr.setAttribute('data-index', originalIndex.toString());

      if (settings?.showRowNumbers) {
        const tdNum = createElement('div') as HTMLElement;
        tdNum.className = 'sl-td sl-td-row-num';
        tdNum.textContent = (visualIndex + 1).toString();
        tr.appendChild(tdNum);
      }

      attachDragHandlers(tr, {
        type: 'row',
        index: originalIndex,
        draggingClass: 'sl-row-dragging',
        dragOverClass: 'sl-row-drag-over',
        onReorder: (from, to) => {
          if (callbacks.onRowReorder) callbacks.onRowReorder(from, to);
        }
      });

      data.columns.forEach((col, colIndex) => {
        const td = createElement('div') as HTMLElement;
        td.className = `sl-td sl-col-${col.type}`;
        td.setAttribute('data-col-name', col.name);
        td.setAttribute('data-col-id', col.id);
        td.setAttribute('data-col-type', col.type);
        if (/tarea|task|descrip|acuerdo|agree|nota/i.test(col.name) || /tarea|task|descrip|acuerdo|agree|nota/i.test(col.id)) {
          td.classList.add('sl-col-wide');
        }
        
        if (colIndex === 0) {
          td.style.position = 'relative';

          const dragHandle = createElement('div') as HTMLElement;
          dragHandle.className = 'sl-drag-handle';
          dragHandle.innerHTML = '⋮⋮';
          
          attachDragHandle(dragHandle, tr);
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

  addListener(copyBtn, 'click', async () => {
    const success = await copyTableToClipboard(data.columns, currentRows);
    if (success) {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✅ Copiado';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    }
  });

  container.appendChild(wrapper);
}
