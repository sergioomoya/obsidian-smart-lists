import { App, PluginSettingTab, Setting } from 'obsidian';
import SmartListPlugin from './main';

export interface SmartListSettings {
  tableDensity: 'comfortable' | 'compact';
  showRowNumbers: boolean;
  enableFathomSync: boolean;
  fathomApiUrl: string;
}

export const DEFAULT_SETTINGS: SmartListSettings = {
  tableDensity: 'comfortable',
  showRowNumbers: false,
  enableFathomSync: true,
  fathomApiUrl: 'http://127.0.0.1:3847'
}

export class SmartListSettingTab extends PluginSettingTab {
  plugin: SmartListPlugin;

  constructor(app: App, plugin: SmartListPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Configuración de Smart Lists' });

    new Setting(containerEl)
      .setName('Densidad de la tabla')
      .setDesc('Elige si prefieres un diseño más amplio o uno compacto para que quepan más datos.')
      .addDropdown(dropdown => dropdown
        .addOption('comfortable', 'Cómoda (Por defecto)')
        .addOption('compact', 'Compacta')
        .setValue(this.plugin.settings.tableDensity)
        .onChange(async (value: string) => {
          this.plugin.settings.tableDensity = value as 'comfortable' | 'compact';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Mostrar números de fila')
      .setDesc('Muestra un contador al inicio de cada fila.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showRowNumbers)
        .onChange(async (value) => {
          this.plugin.settings.showRowNumbers = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', { text: 'Integración Fathom Notebook' });

    new Setting(containerEl)
      .setName('Activar sincronización de acciones con Fathom')
      .setDesc('Muestra un botón en las tablas compatibles para propagar los cambios al servidor local de Fathom Notebook.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableFathomSync)
        .onChange(async (value) => {
          this.plugin.settings.enableFathomSync = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('URL de la API de Fathom Notebook')
      .setDesc('La URL del backend local (por defecto http://127.0.0.1:3847)')
      .addText(text => text
        .setPlaceholder('http://127.0.0.1:3847')
        .setValue(this.plugin.settings.fathomApiUrl)
        .onChange(async (value) => {
          this.plugin.settings.fathomApiUrl = value;
          await this.plugin.saveSettings();
        }));
  }
}
