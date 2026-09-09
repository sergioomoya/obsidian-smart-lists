import { App, Modal, Notice, Setting } from 'obsidian';
import { FathomService } from '../services/fathom.service';

export interface ReprocessSteps {
  minutes: boolean;
  actions: boolean;
  transcript: boolean;
  video: boolean;
  contacts: boolean;
}

export class ReprocessModal extends Modal {
  private sourcePath: string;
  private apiUrl: string;
  private isFull = false;
  private steps: ReprocessSteps = {
    minutes: true,
    actions: true,
    transcript: false,
    video: false,
    contacts: false,
  };
  private isProcessing = false;

  constructor(app: App, sourcePath: string, apiUrl: string) {
    super(app);
    this.sourcePath = sourcePath;
    this.apiUrl = apiUrl;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('fathom-reprocess-modal');

    contentEl.createEl('h2', { text: '⚡ Reprocesar Sesión de Fathom' });
    contentEl.createEl('p', {
      text: 'Selecciona qué componentes deseas regenerar o volver a sincronizar para esta sesión:',
      cls: 'setting-item-description'
    });

    // Selector de Modo
    new Setting(contentEl)
      .setName('Modo de reprocesamiento')
      .setDesc('Elige si deseas regenerar todo desde cero o seleccionar pasos específicos')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('custom', 'Personalizado (Seleccionar pasos)')
          .addOption('full', 'Completo (Todos los artefactos)')
          .setValue(this.isFull ? 'full' : 'custom')
          .onChange((value) => {
            this.isFull = value === 'full';
            this.renderStepToggles(stepContainer);
          });
      });

    const stepContainer = contentEl.createDiv({ cls: 'fathom-steps-container' });
    this.renderStepToggles(stepContainer);

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container', attr: { style: 'margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem;' } });

    const cancelBtn = buttonContainer.createEl('button', { text: 'Cancelar' });
    cancelBtn.onclick = () => this.close();

    const startBtn = buttonContainer.createEl('button', {
      text: '⚡ Iniciar Reprocesamiento',
      cls: 'mod-cta'
    });

    startBtn.onclick = async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;
      startBtn.disabled = true;
      startBtn.setText('⏳ Reprocesando...');

      try {
        const success = await FathomService.reprocess(
          this.sourcePath,
          {
            full: this.isFull,
            steps: this.isFull ? undefined : this.steps
          },
          this.apiUrl
        );

        if (success) {
          this.close();
        }
      } finally {
        this.isProcessing = false;
        startBtn.disabled = false;
        startBtn.setText('⚡ Iniciar Reprocesamiento');
      }
    };
  }

  private renderStepToggles(container: HTMLElement) {
    container.empty();
    if (this.isFull) {
      container.createEl('div', {
        text: 'ℹ️ Se volverán a procesar: Metadatos, Transcripción, Minutas con IA, Plan de Acción (PDA) y Descarga de Vídeo MP4.',
        attr: { style: 'padding: 0.75rem; background: var(--background-secondary); border-radius: 6px; font-size: 0.9em; margin: 0.5rem 0;' }
      });
      return;
    }

    new Setting(container)
      .setName('🤖 Minutas de la Sesión (IA)')
      .setDesc('Regenera minutas.md usando Gemini 3.7 Flash a partir de la transcripción (~3s)')
      .addToggle((toggle) => {
        toggle.setValue(this.steps.minutes).onChange((val) => (this.steps.minutes = val));
      });

    new Setting(container)
      .setName('📋 Plan de Acción (PDA)')
      .setDesc('Re-extrae tareas y actualiza acciones.json y PDA.md reemplazando las filas de esta sesión')
      .addToggle((toggle) => {
        toggle.setValue(this.steps.actions).onChange((val) => (this.steps.actions = val));
      });

    new Setting(container)
      .setName('📝 Transcripción')
      .setDesc('Vuelve a descargar la transcripción original desde la API de Fathom')
      .addToggle((toggle) => {
        toggle.setValue(this.steps.transcript).onChange((val) => (this.steps.transcript = val));
      });

    new Setting(container)
      .setName('📇 Registro de Contactos')
      .setDesc('Re-analiza participantes y actualiza CONTACTOS.md')
      .addToggle((toggle) => {
        toggle.setValue(this.steps.contacts).onChange((val) => (this.steps.contacts = val));
      });

    new Setting(container)
      .setName('🎥 Vídeo MP4')
      .setDesc('Vuelve a descargar el archivo de vídeo .mp4 mediante navegador (puede tardar 1-2 min)')
      .addToggle((toggle) => {
        toggle.setValue(this.steps.video).onChange((val) => (this.steps.video = val));
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
