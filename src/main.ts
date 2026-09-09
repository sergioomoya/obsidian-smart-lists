import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { SmartListView } from './smart-list.view';
import { ColumnType, SmartListData, UIState } from './models/types';
import { serializeSmartListJson } from './services/data.service';
import { generateId } from './utils/id.utils';
import { SmartListSettings, DEFAULT_SETTINGS, SmartListSettingTab } from './settings';
import { createDefaultSmartList } from './models/defaults';
import { FathomService } from './services/fathom.service';

export default class SmartListPlugin extends Plugin {
  settings!: SmartListSettings;
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
        const defaultData = createDefaultSmartList();

        const block = `\`\`\`smartlist\n${serializeSmartListJson(defaultData)}\n\`\`\`\n`;
        editor.replaceSelection(block);
      }
    });

    this.addCommand({
      id: 'fathom-reprocess-meeting-custom',
      name: 'Fathom: Reprocesar sesión actual (Personalizada)',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;
        const info = FathomService.getMeetingInfoFromPath(activeFile.path);
        if (!info) return false;

        if (!checking) {
          import('./modals/reprocess.modal').then(({ ReprocessModal }) => {
            new ReprocessModal(this.app, activeFile.path, this.settings.fathomApiUrl).open();
          });
        }
        return true;
      }
    });

    this.addCommand({
      id: 'fathom-reprocess-meeting-full',
      name: 'Fathom: Reprocesar sesión actual (Completa)',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;
        const info = FathomService.getMeetingInfoFromPath(activeFile.path);
        if (!info) return false;

        if (!checking) {
          FathomService.reprocess(activeFile.path, { full: true }, this.settings.fathomApiUrl);
        }
        return true;
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
