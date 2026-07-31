import { ColumnDefinition, CellValue, ColumnType } from '../models/types';
import { Person } from '../services/person.service';
import { createElement, setupClickOutside, positionDropdown, clearChildren, addListener } from '../utils/dom.utils';

const KEY_ENTER = 'Enter';

/**
 * Renderiza una celda de texto que se convierte en input al hacer clic.
 */
function renderTextCell(container: HTMLElement, value: string, onChange: (val: string) => void): void {
  const displayDiv = createElement('div') as HTMLElement;
  displayDiv.className = 'sl-cell-text';
  displayDiv.textContent = value || '';

  addListener(displayDiv, 'click', () => {
    clearChildren(container);
    const input = createElement('textarea') as HTMLTextAreaElement;
    input.className = 'sl-input sl-input-editing';
    input.value = value || '';
    input.style.resize = 'vertical';
    input.style.minHeight = '60px';
    
    const saveValue = () => {
      const newVal = input.value;
      if (newVal !== value) {
        onChange(newVal);
      }
      clearChildren(container);
      displayDiv.textContent = newVal;
      container.appendChild(displayDiv);
    };

    addListener(input, 'blur', saveValue);
    addListener(input, 'keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === KEY_ENTER && !keyEvent.shiftKey) {
        e.preventDefault();
        input.blur();
      }
    });

    container.appendChild(input);
    input.focus();
  });

  container.appendChild(displayDiv);
}

/**
 * Renderiza una celda numérica.
 */
function renderNumberCell(container: HTMLElement, value: number, onChange: (val: number | null) => void): void {
  const displayDiv = createElement('div') as HTMLElement;
  displayDiv.className = 'sl-cell-number';
  displayDiv.textContent = value != null ? String(value) : '';

  addListener(displayDiv, 'click', () => {
    clearChildren(container);
    const input = createElement('input') as HTMLInputElement;
    input.type = 'number';
    input.className = 'sl-input sl-input-editing';
    input.value = value != null ? String(value) : '';
    
    const saveValue = () => {
      const newVal = input.value ? Number(input.value) : null;
      if (newVal !== value) {
        onChange(newVal);
      }
      clearChildren(container);
      displayDiv.textContent = newVal != null ? String(newVal) : '';
      container.appendChild(displayDiv);
    };

    addListener(input, 'blur', saveValue);
    addListener(input, 'keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === KEY_ENTER) {
        input.blur();
      }
    });

    container.appendChild(input);
    input.focus();
  });

  container.appendChild(displayDiv);
}

/**
 * Renderiza una celda de tipo select.
 */
function renderSelectCell(container: HTMLElement, column: ColumnDefinition, value: string, onChange: (val: string) => void): void {
  const pill = createElement('div') as HTMLElement;
  pill.className = 'sl-pill';
  
  const selectedOption = column.options?.find(o => o.label === value);
  if (selectedOption) {
    pill.style.backgroundColor = selectedOption.color;
    pill.textContent = selectedOption.label;
  } else {
    pill.textContent = value || '';
  }

  addListener(pill, 'click', () => {
    const dropdown = createElement('div') as HTMLElement;
    dropdown.className = 'sl-dropdown';

    column.options?.forEach(opt => {
      const item = createElement('div') as HTMLElement;
      item.className = 'sl-dropdown-item';
      if (opt.label === value) {
        item.classList.add('sl-dropdown-item-active');
      }
      item.textContent = opt.label;
      
      addListener(item, 'click', () => {
        if (opt.label !== value) {
          onChange(opt.label);
        }
        closeDropdown();
      });
      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);
    positionDropdown(dropdown, pill);
    
    let cleanupClickOutside: () => void;
    const closeDropdown = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (dropdown.parentElement) document.body.removeChild(dropdown);
    };
    cleanupClickOutside = setupClickOutside(dropdown, closeDropdown, pill);
  });

  container.appendChild(pill);
}

/**
 * Renderiza una celda de selección múltiple.
 */
function renderMultiSelectCell(container: HTMLElement, column: ColumnDefinition, value: string[], onChange: (val: string[]) => void): void {
  const pillsContainer = createElement('div') as HTMLElement;
  pillsContainer.className = 'sl-pills-container';

  const currentValues = Array.isArray(value) ? value : [];
  currentValues.forEach(val => {
    const pill = createElement('div') as HTMLElement;
    pill.className = 'sl-pill';
    const opt = column.options?.find(o => o.label === val);
    if (opt) {
      pill.style.backgroundColor = opt.color;
    }
    pill.textContent = val;
    pillsContainer.appendChild(pill);
  });

  addListener(pillsContainer, 'click', () => {
    const dropdown = createElement('div') as HTMLElement;
    dropdown.className = 'sl-dropdown';

    column.options?.forEach(opt => {
      const label = createElement('label') as HTMLElement;
      label.className = 'sl-dropdown-item';
      
      const checkbox = createElement('input') as HTMLInputElement;
      checkbox.type = 'checkbox';
      checkbox.checked = currentValues.includes(opt.label);
      
      addListener(checkbox, 'change', () => {
        let newValues = [...currentValues];
        if (checkbox.checked) {
          newValues.push(opt.label);
        } else {
          newValues = newValues.filter(v => v !== opt.label);
        }
        onChange(newValues);
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(opt.label));
      dropdown.appendChild(label);
    });

    document.body.appendChild(dropdown);
    positionDropdown(dropdown, pillsContainer);

    let cleanupClickOutside: () => void;
    const closeDropdown = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (dropdown.parentElement) document.body.removeChild(dropdown);
    };
    cleanupClickOutside = setupClickOutside(dropdown, closeDropdown, pillsContainer);
  });

  container.appendChild(pillsContainer);
}

/**
 * Renderiza una celda de fecha.
 */
function renderDateCell(container: HTMLElement, value: string, onChange: (val: string) => void): void {
  const displayDiv = createElement('div') as HTMLElement;
  displayDiv.className = 'sl-cell-text';
  if (!value) {
    displayDiv.classList.add('sl-date-empty');
  }
  displayDiv.textContent = value || '';

  addListener(displayDiv, 'click', () => {
    clearChildren(container);
    const input = createElement('input') as HTMLInputElement;
    input.type = 'date';
    input.className = 'sl-input sl-input-editing';
    input.value = value || '';

    const saveValue = () => {
      const newVal = input.value;
      if (newVal !== value) {
        onChange(newVal);
      }
      clearChildren(container);
      if (newVal) {
        displayDiv.classList.remove('sl-date-empty');
      } else {
        displayDiv.classList.add('sl-date-empty');
      }
      displayDiv.textContent = newVal || '';
      container.appendChild(displayDiv);
    };

    addListener(input, 'blur', saveValue);
    addListener(input, 'keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === KEY_ENTER) {
        input.blur();
      }
    });

    container.appendChild(input);
    input.focus();
    // Intenta abrir el calendario nativo (no todos los navegadores lo soportan vía JS, pero focus suele ayudar)
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      }
    } catch (e) {}
  });

  container.appendChild(displayDiv);
}

/**
 * Renderiza una celda de checkbox.
 */
function renderCheckboxCell(container: HTMLElement, value: boolean, onChange: (val: boolean) => void): void {
  const toggle = createElement('div') as HTMLElement;
  toggle.className = 'sl-toggle';
  if (value) {
    toggle.classList.add('sl-toggle-active');
  }

  const slider = createElement('div') as HTMLElement;
  slider.className = 'sl-toggle-slider';
  toggle.appendChild(slider);

  addListener(toggle, 'click', () => {
    const newVal = !value;
    onChange(newVal);
  });

  container.appendChild(toggle);
}

/**
 * Renderiza una celda de persona con autocompletado.
 */
function renderPersonCell(container: HTMLElement, value: string, onChange: (val: string) => void, persons: Person[] = []): void {
  const wrapper = createElement('div') as HTMLElement;
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';

  const icon = createElement('span') as HTMLElement;
  icon.className = 'sl-person-icon';
  icon.textContent = '👤';
  wrapper.appendChild(icon);

  const input = createElement('input') as HTMLInputElement;
  input.type = 'text';
  input.className = 'sl-input';
  input.value = value || '';
  wrapper.appendChild(input);

  let dropdown: HTMLElement | null = null;
  let cleanupClickOutside: (() => void) | null = null;

  const closeDropdown = () => {
    if (cleanupClickOutside) {
      cleanupClickOutside();
      cleanupClickOutside = null;
    }
    if (dropdown && dropdown.parentNode) {
      dropdown.parentNode.removeChild(dropdown);
      dropdown = null;
    }
  };

  addListener(input, 'input', () => {
    closeDropdown();
    const query = input.value.toLowerCase();
    const matches = persons.filter(p => p.name.toLowerCase().includes(query));

    if (matches.length > 0) {
      dropdown = createElement('div') as HTMLElement;
      dropdown.className = 'sl-autocomplete';

      matches.forEach(match => {
        const item = createElement('div') as HTMLElement;
        item.className = 'sl-autocomplete-item';
        item.textContent = match.name;
        
        addListener(item, 'click', (e: Event) => {
          e.preventDefault();
          input.value = match.name;
          onChange(match.name);
          closeDropdown();
        });
        
        if (dropdown) dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);
      positionDropdown(dropdown, input);
      cleanupClickOutside = setupClickOutside(dropdown, closeDropdown, wrapper);
    }
  });

  addListener(input, 'blur', () => {
    if (input.value !== value) {
      onChange(input.value);
    }
  });

  container.appendChild(wrapper);
}

/**
 * Renderiza una celda de URL.
 */
function renderUrlCell(container: HTMLElement, value: string, onChange: (val: string) => void): void {
  if (value) {
    const link = createElement('a') as HTMLAnchorElement;
    link.className = 'sl-link';
    link.href = value;
    link.target = '_blank';
    link.textContent = value;
    
    const editBtn = createElement('button') as HTMLButtonElement;
    editBtn.className = 'sl-link-edit-btn';
    editBtn.textContent = '✎';

    addListener(editBtn, 'click', () => {
      clearChildren(container);
      showUrlInput(container, value, onChange);
    });

    container.appendChild(link);
    container.appendChild(editBtn);
  } else {
    showUrlInput(container, '', onChange);
  }
}

function showUrlInput(container: HTMLElement, value: string, onChange: (val: string) => void): void {
  const input = createElement('input') as HTMLInputElement;
  input.type = 'url';
  input.className = 'sl-input sl-input-editing';
  input.value = value || '';

  const saveValue = () => {
    if (input.value !== value) {
      onChange(input.value);
    }
  };

  addListener(input, 'blur', saveValue);
  addListener(input, 'keydown', (e: Event) => {
    if ((e as KeyboardEvent).key === KEY_ENTER) {
      input.blur();
    }
  });

  container.appendChild(input);
  input.focus();
}

/**
 * Renderiza una celda de tipo lookup.
 */
function renderLookupCell(container: HTMLElement, value: string, onChange: (val: string) => void, lookupValues: string[] = []): void {
  const pill = createElement('div') as HTMLElement;
  pill.className = 'sl-pill';
  pill.textContent = value || '';

  addListener(pill, 'click', () => {
    const dropdown = createElement('div') as HTMLElement;
    dropdown.className = 'sl-dropdown';

    lookupValues.forEach(optVal => {
      const item = createElement('div') as HTMLElement;
      item.className = 'sl-dropdown-item';
      if (optVal === value) {
        item.classList.add('sl-dropdown-item-active');
      }
      item.textContent = optVal;
      
      addListener(item, 'click', () => {
        if (optVal !== value) {
          onChange(optVal);
        }
        closeDropdown();
      });
      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);
    positionDropdown(dropdown, pill);

    let cleanupClickOutside: () => void;
    const closeDropdown = () => {
      if (cleanupClickOutside) cleanupClickOutside();
      if (dropdown.parentElement) document.body.removeChild(dropdown);
    };
    cleanupClickOutside = setupClickOutside(dropdown, closeDropdown, pill);
  });

  container.appendChild(pill);
}

/**
 * Factoría principal: renderiza una celda según el tipo de columna.
 *
 * @param column - La definición de la columna.
 * @param value - El valor actual.
 * @param onChange - Callback invocado al cambiar.
 * @param lookupValues - Valores para autocompletar lookup.
 * @param persons - Sugerencias de personas.
 * @returns Elemento HTML de la celda.
 */
export function renderCell(
  column: ColumnDefinition,
  value: CellValue,
  onChange: (newValue: CellValue) => void,
  lookupValues?: string[],
  persons?: Person[]
): HTMLElement {
  const container = createElement('div') as HTMLElement;
  container.className = 'sl-cell';

  let displayValue = value;
  let isObjectValue = false;
  let originalObject: any = null;

  if (value !== null && typeof value === 'object' && !Array.isArray(value) && 'text' in value) {
    displayValue = (value as any).text;
    if ((value as any).tooltip) {
      container.title = (value as any).tooltip;
    }
    isObjectValue = true;
    originalObject = value;
  }

  const wrappedOnChange = (newVal: any) => {
    if (isObjectValue) {
      onChange({ ...originalObject, text: newVal });
    } else {
      onChange(newVal);
    }
  };

  if (displayValue === null || displayValue === undefined || displayValue === '') {
    container.classList.add('sl-cell-empty');
  }

  switch (column.type) {
    case ColumnType.Text:
      renderTextCell(container, displayValue as string, wrappedOnChange);
      break;
    case ColumnType.Number:
      renderNumberCell(container, displayValue as number, wrappedOnChange);
      break;
    case ColumnType.Select:
      renderSelectCell(container, column, displayValue as string, wrappedOnChange);
      break;
    case ColumnType.MultiSelect:
      renderMultiSelectCell(container, column, displayValue as string[], wrappedOnChange);
      break;
    case ColumnType.Date:
      renderDateCell(container, displayValue as string, wrappedOnChange);
      break;
    case ColumnType.Checkbox:
      renderCheckboxCell(container, displayValue as boolean, wrappedOnChange);
      break;
    case ColumnType.Person:
      renderPersonCell(container, displayValue as string, wrappedOnChange, persons);
      break;
    case ColumnType.Url:
      renderUrlCell(container, displayValue as string, wrappedOnChange);
      break;
    case ColumnType.Lookup:
      renderLookupCell(container, displayValue as string, wrappedOnChange, lookupValues);
      break;
    default:
      container.textContent = String(displayValue || '');
  }

  return container;
}
