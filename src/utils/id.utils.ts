/**
 * Genera un ID único corto para filas y columnas.
 * Formato: prefijo + timestamp base36 + random base36.
 */
export function generateId(prefix: string = 'r'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Genera un ID seguro para columnas a partir de un nombre legible.
 * Convierte a lowercase, reemplaza espacios por guiones bajos,
 * elimina caracteres especiales y añade sufijo único si es necesario.
 */
export function generateColumnId(name: string, existingIds: string[]): string {
  const baseId = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'col';

  let candidateId = baseId;
  let counter = 1;

  while (existingIds.includes(candidateId)) {
    candidateId = `${baseId}_${counter}`;
    counter++;
  }

  return candidateId;
}
