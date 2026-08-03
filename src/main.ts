import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { SmartListView } from './smart-list.view';
import { ColumnType, SmartListData, UIState } from './models/types';
import { serializeSmartListJson } from './services/data.service';
import { generateId } from './utils/id.utils';
import { SmartListSettings, DEFAULT_SETTINGS, SmartListSettingTab } from './settings';

class SmartListPlugin extends Plugin {
  settings: SmartListSettings;
  activeUIStates = new Map<string, UIState>();

  async onload() {
    console.log('Cargando Smart Lists Plugin');
    await this.loadSettings();

    this.addSettingTab(new SmartListSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      'smartlist',
      (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        ctx.addChild(new SmartListView(el, source, ctx, this));
      }
    );

    this.addCommand({
      id: 'insert-smart-list',
      name: 'Insert Smart List',
      editorCallback: (editor) => {
        const defaultData: SmartListData = {
          title: 'Nueva Lista',
          columns: [
            { id: 'col_text', name: 'Nombre', type: ColumnType.Text },
            { 
              id: 'col_status', 
              name: 'Estado', 
              type: ColumnType.Select, 
              options: [
                { label: 'Pendiente', color: '#f59e0b' },
                { label: 'Completado', color: '#10b981' }
              ] 
            }
          ],
          rows: [
            { _id: generateId('r'), col_text: 'Ejemplo 1', col_status: 'Pendiente' },
            { _id: generateId('r'), col_text: 'Ejemplo 2', col_status: 'Completado' }
          ]
        };

        const block = `\`\`\`smartlist\n${serializeSmartListJson(defaultData)}\n\`\`\`\n`;
        editor.replaceSelection(block);
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Disparar evento global para repintar las tablas activas
    this.app.workspace.trigger('smart-lists:settings-updated');
  }

  onunload() {
    console.log('Descargando Smart Lists Plugin');
  }
}
module.exports = SmartListPlugin;
