import { App, PluginSettingTab, Setting } from 'obsidian';
import SmartListPlugin from './main';

export interface SmartListSettings {
  tableDensity: 'comfortable' | 'compact';
  showRowNumbers: boolean;
}

export const DEFAULT_SETTINGS: SmartListSettings = {
  tableDensity: 'comfortable',
  showRowNumbers: false,
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
        .onChange(async (value: 'comfortable' | 'compact') => {
          this.plugin.settings.tableDensity = value;
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
  }
}
