import { SmartListData } from '../models/types';
import { Notice } from 'obsidian';

export class FathomService {
  /**
   * Determina a qué endpoint de Fathom llamar basándose en el path de Obsidian y dispara el sync.
   * @param sourcePath Ruta en la vault (e.g., CLIENTES/MESBOOK/PDA MESBOOK.md)
   * @param data Los datos de la Smart List
   * @param apiUrl La URL del backend Fathom Notebook
   */
  public static async sync(sourcePath: string, data: SmartListData, apiUrl: string): Promise<boolean> {
    const normalizedPath = sourcePath.replace(/\\/g, '/');

    // 1. Detección de PDA (Plan de Acción Global)
    // Ejemplo: CLIENTES/MARTIDERM/PDA MARTIDERM.md
    const pdaMatch = normalizedPath.match(/PDA\s+([^/\\]+)\.md/i);
    if (pdaMatch && pdaMatch[1]) {
      const client = pdaMatch[1].trim();
      return await this.doSync(`${apiUrl}/api/pdas/${encodeURIComponent(client)}`, data);
    }

    // 2. Detección de Minutas Individuales
    // Ejemplo: CLIENTES/MARTIDERM/2026-07-15 - Sesion/minutas.md
    const minutasMatch = normalizedPath.match(/([^/\\]+)\/([^/\\]+)\/minutas\.md/i);
    if (minutasMatch && minutasMatch[1] && minutasMatch[2]) {
      const client = minutasMatch[1].trim();
      const meetingId = minutasMatch[2].trim();
      // Verificamos si no es "CLIENTES", ya que podría haber capturado mal
      if (client.toLowerCase() !== 'clientes') {
         return await this.doSync(`${apiUrl}/api/meetings/${encodeURIComponent(client)}/${encodeURIComponent(meetingId)}/smartlist`, data);
      }
    }

    new Notice('❌ Fathom Sync: El archivo actual no parece ser un PDA ni unas minutas válidas.');
    return false;
  }

  private static async doSync(endpoint: string, data: SmartListData): Promise<boolean> {
    try {
      new Notice('🔄 Sincronizando con Fathom Notebook...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || response.statusText);
      }

      new Notice('✅ Guardado y propagado en Fathom');
      return true;
    } catch (err: any) {
      console.error('Error sincronizando con Fathom:', err);
      new Notice(`❌ Error de Sincronización Fathom:\n${err.message}`);
      return false;
    }
  }
}
