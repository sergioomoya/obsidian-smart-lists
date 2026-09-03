import { createElement, setupClickOutside, positionDropdown, addListener } from './dom.utils';

export interface DropdownItem {
  label: string;
  value: string;
  color?: string;
  isActive?: boolean;
}

export function createDropdown(
  anchor: HTMLElement,
  items: DropdownItem[],
  onSelect: (value: string) => void
): { element: HTMLElement; close: () => void } {
  const dropdown = createElement('div') as HTMLElement;
  dropdown.className = 'sl-dropdown';

  items.forEach(item => {
    const el = createElement('div') as HTMLElement;
    el.className = 'sl-dropdown-item';
    if (item.isActive) el.classList.add('sl-dropdown-item-active');
    el.textContent = item.label;

    addListener(el, 'click', () => {
      onSelect(item.value);
      close();
    });
    dropdown.appendChild(el);
  });

  document.body.appendChild(dropdown);
  positionDropdown(dropdown, anchor);

  let cleanupClickOutside: () => void;
  const close = () => {
    if (cleanupClickOutside) cleanupClickOutside();
    if (dropdown.parentElement) document.body.removeChild(dropdown);
  };
  cleanupClickOutside = setupClickOutside(dropdown, close, anchor);

  return { element: dropdown, close };
}
