import { addListener } from './dom.utils';

interface DragConfig {
  type: 'row' | 'col';
  index: number;
  draggingClass: string;
  dragOverClass: string;
  onReorder: (from: number, to: number) => void;
}

export function attachDragHandlers(element: HTMLElement, config: DragConfig): void {
  addListener(element, 'dragstart', (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: config.type, index: config.index }));
      e.dataTransfer.effectAllowed = 'move';
    }
    element.classList.add(config.draggingClass);
  });

  addListener(element, 'dragover', (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    element.classList.add(config.dragOverClass);
  });

  addListener(element, 'dragleave', () => element.classList.remove(config.dragOverClass));

  addListener(element, 'drop', (e: DragEvent) => {
    e.preventDefault();
    element.classList.remove(config.dragOverClass);
    if (e.dataTransfer) {
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (dragData.type === config.type && typeof dragData.index === 'number' && dragData.index !== config.index) {
          config.onReorder(dragData.index, config.index);
        }
      } catch (err) {}
    }
  });

  addListener(element, 'dragend', () => element.classList.remove(config.draggingClass));
}

export function attachDragHandle(handle: HTMLElement, draggableElement: HTMLElement): void {
  addListener(handle, 'mousedown', () => { draggableElement.draggable = true; });
  addListener(handle, 'mouseup', () => { draggableElement.draggable = false; });
  addListener(handle, 'mouseleave', () => { draggableElement.draggable = false; });
}
