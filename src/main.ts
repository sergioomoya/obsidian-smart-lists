import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { SmartListView } from './smart-list.view';
import { ColumnType, SmartListData } from './models/types';
import { serializeSmartListJson } from './services/data.service';
import { generateId } from './utils/id.utils';

class SmartListPlugin extends Plugin {
  async onload() {
    console.log('Cargando Smart Lists Plugin');

    this.registerMarkdownCodeBlockProcessor(
      'smartlist',
      (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        ctx.addChild(new SmartListView(el, source, ctx, this.app));
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

  onunload() {
    console.log('Descargando Smart Lists Plugin');
  }
}
module.exports = SmartListPlugin;
