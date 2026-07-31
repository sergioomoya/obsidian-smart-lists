import { setIcon } from 'obsidian';
import { ColumnDefinition, TableCallbacks, COLUMN_TYPE_ICONS } from '../models/types';
import { createElement, addListener, clearChildren, setupClickOutside, positionDropdown } from '../utils/dom.utils';

const KEY_ENTER = 'Enter';

/**
 * Renderiza la cabecera de una columna.
 *
 * @param column - La definición de la columna.
 * @param callbacks - Funciones de callback de la tabla.
 * @returns El elemento th de la cabecera.
 */
export interface HeaderRenderOptions {
  sortState?: 'asc' | 'desc' | null;
  activeFilters?: string[];
  uniqueValues?: string[];
  onSortClick?: (columnId: string) => void;
  onFilterChange?: (columnId: string, values: string[]) => void;
}

/**
 * Renderiza la cabecera de una columna.
 *
 * @param column - La definición de la columna.
 * @param callbacks - Funciones de callback de la tabla.
 * @param options - Opciones de renderizado (sort, filter).
 * @returns El elemento th de la cabecera.
 */
export function renderHeader(
  column: ColumnDefinition,
  callbacks: TableCallbacks,
  options: HeaderRenderOptions = {}
): HTMLElement {
  const th = createElement('div') as HTMLElement;
  th.className = 'sl-th';
  th.setAttribute('data-col-name', column.name);

  const contentDiv = createElement('div') as HTMLElement;
  contentDiv.className = 'sl-header-content';
  contentDiv.style.display = 'flex';
  contentDiv.style.alignItems = 'center';

  const titleDiv = createElement('div') as HTMLElement;
  titleDiv.className = 'sl-header-title';
  titleDiv.style.display = 'flex';
  titleDiv.style.alignItems = 'center';
  titleDiv.style.flex = '1';
  titleDiv.style.cursor = 'pointer';

  addListener(titleDiv, 'click', () => {
    if (options.onSortClick) {
      options.onSortClick(column.id);
    }
  });

  const iconSpan = createElement('span') as HTMLElement;
  iconSpan.className = 'sl-header-icon';
  setIcon(iconSpan, COLUMN_TYPE_ICONS[column.type] || 'circle');

  const nameSpan = createElement('span') as HTMLElement;
  nameSpan.className = 'sl-header-name';
  nameSpan.textContent = column.name;

  titleDiv.appendChild(iconSpan);
  titleDiv.appendChild(nameSpan);

  if (options.sortState) {
    const sortIcon = createElement('span') as HTMLElement;
    sortIcon.className = 'sl-sort-icon';
    sortIcon.style.marginLeft = '4px';
    setIcon(sortIcon, options.sortState === 'asc' ? 'arrow-up' : 'arrow-down');
    titleDiv.appendChild(sortIcon);
  }

  contentDiv.appendChild(titleDiv);

  const filterIcon = createElement('div') as HTMLElement;
  filterIcon.className = 'sl-filter-icon';
  filterIcon.style.cursor = 'pointer';
  filterIcon.style.marginLeft = 'auto';
  filterIcon.style.padding = '2px 4px';
  if (options.activeFilters && options.activeFilters.length > 0) {
    filterIcon.style.color = 'var(--interactive-accent)';
  }
  setIcon(filterIcon, 'filter');

  addListener(filterIcon, 'click', (e) => {
    e.stopPropagation();
    const menu = createElement('div') as HTMLElement;
    menu.className = 'sl-filter-menu';
    
    const searchInput = createElement('input') as HTMLInputElement;
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar...';
    searchInput.className = 'sl-input';
    searchInput.style.marginBottom = '8px';
    
    const checkboxesDiv = createElement('div') as HTMLElement;
    checkboxesDiv.className = 'sl-filter-checkboxes';
    checkboxesDiv.style.maxHeight = '150px';
    checkboxesDiv.style.overflowY = 'auto';
    checkboxesDiv.style.marginBottom = '8px';

    const vals = options.uniqueValues || [];
    let checkedVals = new Set(options.activeFilters && options.activeFilters.length > 0 ? options.activeFilters : vals);

    const renderCheckboxes = (query: string) => {
      clearChildren(checkboxesDiv);
      const filtered = vals.filter(v => v.toLowerCase().includes(query.toLowerCase()));
      
      if (filtered.length > 0) {
        const selectAllLbl = createElement('label') as HTMLElement;
        selectAllLbl.style.display = 'block';
        selectAllLbl.style.cursor = 'pointer';
        selectAllLbl.style.marginBottom = '8px';
        selectAllLbl.style.fontWeight = 'bold';
        selectAllLbl.style.borderBottom = '1px solid var(--background-modifier-border)';
        selectAllLbl.style.paddingBottom = '4px';

        const selectAllChk = createElement('input') as HTMLInputElement;
        selectAllChk.type = 'checkbox';
        selectAllChk.checked = filtered.every(v => checkedVals.has(v));
        
        addListener(selectAllChk, 'change', () => {
          if (selectAllChk.checked) {
            filtered.forEach(v => checkedVals.add(v));
          } else {
            filtered.forEach(v => checkedVals.delete(v));
          }
          renderCheckboxes(query);
        });

        selectAllLbl.appendChild(selectAllChk);
        selectAllLbl.appendChild(document.createTextNode(' (Seleccionar todo)'));
        checkboxesDiv.appendChild(selectAllLbl);
      }

      filtered.forEach(v => {
        const lbl = createElement('label') as HTMLElement;
        lbl.style.display = 'block';
        lbl.style.cursor = 'pointer';
        lbl.style.marginBottom = '4px';

        const chk = createElement('input') as HTMLInputElement;
        chk.type = 'checkbox';
        chk.value = v;
        chk.checked = checkedVals.has(v);
        
        addListener(chk, 'change', () => {
          if (chk.checked) checkedVals.add(v);
          else checkedVals.delete(v);
          
          const allChecked = filtered.every(val => checkedVals.has(val));
          const selectAllEl = checkboxesDiv.querySelector('input[type="checkbox"]') as HTMLInputElement;
          if (selectAllEl) selectAllEl.checked = allChecked;
        });

        lbl.appendChild(chk);
        lbl.appendChild(document.createTextNode(' ' + (v || '(Vacío)')));
        checkboxesDiv.appendChild(lbl);
      });
    };

    renderCheckboxes('');

    addListener(searchInput, 'input', () => {
      renderCheckboxes(searchInput.value);
    });

    const btnDiv = createElement('div') as HTMLElement;
    btnDiv.style.display = 'flex';
    btnDiv.style.gap = '8px';

    const applyBtn = createElement('button') as HTMLButtonElement;
    applyBtn.textContent = 'Aplicar';
    applyBtn.className = 'sl-btn';
    addListener(applyBtn, 'click', () => {
      if (options.onFilterChange) {
        if (checkedVals.size === vals.length) {
          options.onFilterChange(column.id, []);
        } else {
          options.onFilterChange(column.id, Array.from(checkedVals));
        }
      }
      document.body.removeChild(menu);
    });

    const clearBtn = createElement('button') as HTMLButtonElement;
    clearBtn.textContent = 'Limpiar';
    clearBtn.className = 'sl-btn';
    addListener(clearBtn, 'click', () => {
      if (options.onFilterChange) {
        options.onFilterChange(column.id, []);
      }
      document.body.removeChild(menu);
    });

    btnDiv.appendChild(applyBtn);
    btnDiv.appendChild(clearBtn);

    menu.appendChild(searchInput);
    menu.appendChild(checkboxesDiv);
    menu.appendChild(btnDiv);

    document.body.appendChild(menu);
    positionDropdown(menu, filterIcon);

    let cleanupClickOutside: () => void;
    const closeOverlay = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    };
    cleanupClickOutside = setupClickOutside(menu, closeOverlay, filterIcon);
  });

  contentDiv.appendChild(filterIcon);
  th.appendChild(contentDiv);

  addListener(th, 'contextmenu', (e: Event) => {
    e.preventDefault();
    const mouseEvent = e as MouseEvent;

    const menu = createElement('div') as HTMLElement;
    menu.className = 'sl-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${mouseEvent.clientX}px`;
    menu.style.top = `${mouseEvent.clientY}px`;
    menu.style.zIndex = '1000';

    const renameItem = createElement('div') as HTMLElement;
    renameItem.className = 'sl-context-menu-item';
    renameItem.textContent = 'Renombrar';

    addListener(renameItem, 'click', () => {
      document.body.removeChild(menu);
      
      const input = createElement('input') as HTMLInputElement;
      input.type = 'text';
      input.className = 'sl-input sl-input-editing';
      input.value = column.name;
      
      const saveValue = () => {
        const newName = input.value.trim();
        if (newName && newName !== column.name) {
          if (callbacks.onColumnRename) {
            callbacks.onColumnRename(column.id, newName);
          }
        } else {
          // Restaurar visualización si no hay cambios
          clearChildren(contentDiv);
          contentDiv.appendChild(iconSpan);
          contentDiv.appendChild(nameSpan);
        }
      };

      addListener(input, 'blur', saveValue);
      addListener(input, 'keydown', (ev: Event) => {
        if ((ev as KeyboardEvent).key === KEY_ENTER) {
          input.blur();
        }
      });

      clearChildren(contentDiv);
      contentDiv.appendChild(input);
      input.focus();
    });

    const deleteItem = createElement('div') as HTMLElement;
    deleteItem.className = 'sl-context-menu-item sl-context-menu-danger';
    deleteItem.textContent = 'Eliminar columna';

    let deleteConfirmed = false;
    addListener(deleteItem, 'click', (ev: Event) => {
      ev.stopPropagation(); // Evitar cerrar inmediatamente si hacemos clic para confirmar
      if (!deleteConfirmed) {
        deleteConfirmed = true;
        deleteItem.textContent = '¿Seguro? Haz clic de nuevo';
      } else {
        document.body.removeChild(menu);
        if (callbacks.onColumnDelete) {
          callbacks.onColumnDelete(column.id);
        }
      }
    });

    menu.appendChild(renameItem);
    menu.appendChild(deleteItem);

    document.body.appendChild(menu);

    let cleanupClickOutside: () => void;
    const closeOverlay = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    };
    cleanupClickOutside = setupClickOutside(menu, closeOverlay);
  });

  return th;
}
