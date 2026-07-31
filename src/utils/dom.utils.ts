/**
 * Crea un elemento HTML con clases CSS y atributos opcionales.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    cls?: string | string[];
    text?: string;
    attr?: Record<string, string>;
    parent?: HTMLElement;
  },
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options?.cls) {
    const classes = Array.isArray(options.cls) ? options.cls : [options.cls];
    element.classList.add(...classes);
  }

  if (options?.text) {
    element.textContent = options.text;
  }

  if (options?.attr) {
    for (const [key, value] of Object.entries(options.attr)) {
      element.setAttribute(key, value);
    }
  }

  if (options?.parent) {
    options.parent.appendChild(element);
  }

  return element;
}

/**
 * Crea un icono SVG usando los iconos integrados de Obsidian (Lucide).
 * Renderiza un span con la clase apropiada para que Obsidian inyecte el SVG.
 */
export function createIcon(iconName: string, parent?: HTMLElement): HTMLSpanElement {
  const span = createElement('span', {
    cls: 'sl-icon',
    parent,
  });
  // Usamos el método setIcon de Obsidian si está disponible globalmente
  // Fallback a un texto placeholder si no está en contexto de Obsidian
  span.dataset.icon = iconName;
  return span;
}

/**
 * Detecta clics fuera de un elemento para cerrar dropdowns y modales.
 * Retorna una función para limpiar el event listener.
 */
export function setupClickOutside(element: HTMLElement, onClose: () => void, ignoreElement?: HTMLElement): () => void {
  const clickOutsideHandler = (e: MouseEvent) => {
    const target = e.target as Node;
    if (!element.contains(target) && (!ignoreElement || !ignoreElement.contains(target))) {
      onClose();
    }
  };
  
  // Usamos setTimeout para no atrapar el click que abrió el popup
  setTimeout(() => {
    document.addEventListener('click', clickOutsideHandler);
  }, 0);

  return () => {
    document.removeEventListener('click', clickOutsideHandler);
  };
}

/**
 * Posiciona un elemento dropdown relativo a un elemento ancla.
 * Ajusta la posición si se sale de la ventana visible.
 */
export function positionDropdown(dropdown: HTMLElement, anchor: HTMLElement): void {
  const anchorRect = anchor.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let top = anchorRect.bottom + 4;
  let left = anchorRect.left;

  // Ajustar si se sale por abajo
  if (top + dropdownRect.height > viewportHeight) {
    top = anchorRect.top - dropdownRect.height - 4;
  }

  // Ajustar si se sale por la derecha
  if (left + dropdownRect.width > viewportWidth) {
    left = viewportWidth - dropdownRect.width - 8;
  }

  // Ajustar si se sale por la izquierda
  if (left < 8) {
    left = 8;
  }

  dropdown.style.position = 'fixed';
  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
}

/**
 * Elimina todos los hijos de un elemento DOM.
 */
export function clearChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Wrapper seguro para event listeners con cleanup automático.
 * Retorna una función para remover el listener.
 */
export function addListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
): () => void {
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
}
