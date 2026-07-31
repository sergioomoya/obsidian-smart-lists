import { App, TFile } from 'obsidian';
import { SmartListData, ColumnType } from '../models/types';
import { parseSmartListJson } from './data.service';

export interface Person {
  name: string;
  email?: string;
  company?: string;
}

const normalizeName = (name: string): string => {
  return name.replace(/\s*\([^)]*\)\s*/g, '').trim();
};

/**
 * Obtiene el path de un directorio desde un path de archivo.
 * @param filePath Path completo del archivo
 * @returns Path del directorio
 */
const getDirFromPath = (filePath: string): string => {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/');
};

/**
 * Comprueba si un path pertenece a un subdirectorio o al mismo directorio.
 * @param filePath Path del archivo a comprobar
 * @param dirPath Path del directorio base
 * @returns True si pertenece, false en caso contrario
 */
const isInSubdirectory = (filePath: string, dirPath: string): boolean => {
  if (dirPath === '') return true; // Raíz
  return filePath.startsWith(dirPath + '/');
};

/**
 * Busca personas en los archivos metadata.json de Fathom Notebook
 * dentro de la carpeta del cliente y escanea bloques smartlist en archivos .md.
 * @param app Instancia de Obsidian App
 * @param currentFilePath Path del archivo actual
 * @returns Promesa que resuelve a un array de Personas deduplicado por nombre
 */
export const getAvailablePersons = async (app: App, currentFilePath: string): Promise<Person[]> => {
  const personsMap = new Map<string, Person>();
  const currentDir = getDirFromPath(currentFilePath);
  
  const files = app.vault.getFiles();
  
  for (const file of files) {
    if (!isInSubdirectory(file.path, currentDir)) {
      continue;
    }

    if (file.name === 'metadata.json') {
      try {
        const content = await app.vault.read(file);
        const json = JSON.parse(content);
        if (json.participants && Array.isArray(json.participants)) {
          json.participants.forEach((p: any) => {
            if (p.name) {
              const normName = normalizeName(p.name);
              personsMap.set(normName, {
                name: normName,
                email: p.email,
                company: p.domain
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error reading/parsing ${file.path}:`, error);
      }
    } else if (file.extension === 'md') {
      try {
        const content = await app.vault.read(file);
        const smartListRegex = /```smartlist\n([\s\S]*?)```/g;
        let match;
        
        while ((match = smartListRegex.exec(content)) !== null) {
          const jsonStr = match[1] || '';
          const listData = parseSmartListJson(jsonStr);
          
          // Buscar columnas que parezcan de tipo person o texto que contengan nombres (aquí asumimos ColumnType.Person)
          // pero el prompt dice: "que tengan columnas de tipo text con datos de personas".
          // Extraemos de aquellas que tengan nombre 'person', 'contact', 'name', etc.
          const personColumns = listData.columns.filter(c => 
            c.type === ColumnType.Person || 
            (c.type === ColumnType.Text && /name|person|contact/i.test(c.name))
          );
          
          if (personColumns.length > 0) {
            listData.rows.forEach(row => {
              personColumns.forEach(col => {
                const name = row[col.id] as string;
                if (name && typeof name === 'string' && name.trim().length > 0) {
                  const normName = normalizeName(name);
                  if (!personsMap.has(normName)) {
                    personsMap.set(normName, { name: normName });
                  }
                }
              });
            });
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error);
      }
    }
  }

  return Array.from(personsMap.values());
};

/**
 * Busca valores disponibles para un campo lookup.
 * @param app Instancia de Obsidian App
 * @param currentFilePath Path del archivo actual
 * @param source Path relativo o absoluto al archivo fuente del lookup
 * @param sourceColumn Nombre de la columna de donde extraer valores
 * @returns Promesa que resuelve a un array de strings deduplicado
 */
export const getLookupValues = async (
  app: App, 
  currentFilePath: string, 
  source: string, 
  sourceColumn: string
): Promise<string[]> => {
  const currentDir = getDirFromPath(currentFilePath);
  
  // Resuelve el path asumiendo que si no empieza con / y no tiene nombre completo de ruta,
  // es relativo a la carpeta actual. Obsidian usa paths relativos a la bóveda (sin '/' inicial)
  let targetPath = source;
  if (source.startsWith('./')) {
    targetPath = currentDir ? `${currentDir}/${source.substring(2)}` : source.substring(2);
  } else if (!source.includes('/')) {
    targetPath = currentDir ? `${currentDir}/${source}` : source;
  }
  
  // Si no tiene extensión .md, se la agregamos para facilitar
  if (!targetPath.endsWith('.md')) {
    targetPath += '.md';
  }

  const targetFile = app.vault.getAbstractFileByPath(targetPath);
  
  if (!targetFile || !(targetFile instanceof TFile)) {
    console.warn(`Lookup source file not found: ${targetPath}`);
    return [];
  }

  const valuesSet = new Set<string>();

  try {
    const content = await app.vault.read(targetFile);
    const smartListRegex = /```smartlist\n([\s\S]*?)```/g;
    let match;
    
    while ((match = smartListRegex.exec(content)) !== null) {
      const jsonStr = match[1] || '';
      const listData = parseSmartListJson(jsonStr);
      
      const column = listData.columns.find(c => c.name === sourceColumn || c.id === sourceColumn);
      if (column) {
        listData.rows.forEach(row => {
          const val = row[column.id];
          if (val !== undefined && val !== null && val !== '') {
            // Convertimos el valor a string para mantenerlo simple
            valuesSet.add(String(val).trim());
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error reading/parsing lookup file ${targetPath}:`, error);
  }

  return Array.from(valuesSet);
};
