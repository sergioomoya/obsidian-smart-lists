import { App, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownView, TFile } from 'obsidian';
import { SmartListData, UIState } from './models/types';
import { addColumn, addRow, deleteColumn, deleteRow, parseSmartListJson, renameColumn, reorderRows, reorderColumns, serializeSmartListJson, updateCell } from './services/data.service';
import { getAvailablePersons, getLookupValues, Person } from './services/person.service';
import { FathomService } from './services/fathom.service';
import { renderSmartList } from './renderers/table.renderer';
import { clearChildren } from './utils/dom.utils';
import SmartListPlugin from './main';
import { generateId } from './utils/id.utils';

export class SmartListView extends MarkdownRenderChild {
  private data: SmartListData;
  private isUpdating = false;
  private persons: Person[] = [];
  private lookupValuesMap = new Map<string, string[]>();
  private uiState: UIState = {
    sortConfig: { columnId: '', dir: null },
    filters: {}
  };

  constructor(
    containerEl: HTMLElement,
    private source: string,
    private ctx: MarkdownPostProcessorContext,
    private plugin: SmartListPlugin
  ) {
    super(containerEl);
    this.data = parseSmartListJson(source);
    
    if (!this.data.id) {
      this.data.id = generateId('tbl');
    }

    if (this.plugin.activeUIStates.has(this.data.id)) {
      this.uiState = this.plugin.activeUIStates.get(this.data.id)!;
    } else if (this.data.defaultUIState) {
      this.uiState = JSON.parse(JSON.stringify(this.data.defaultUIState));
    }
  }

  get app(): App {
    return this.plugin.app;
  }

  async onload() {
    await this.loadDependencies();
    this.render();
  }

  private async loadDependencies() {
    try {
      if (this.data.columns.some(c => c.type === 'person')) {
        this.persons = await getAvailablePersons(this.app, this.ctx.sourcePath);
      }

      const lookupCols = this.data.columns.filter(c => c.type === 'lookup' && c.source && c.sourceColumn);
      for (const col of lookupCols) {
        if (col.source && col.sourceColumn) {
          const values = await getLookupValues(this.app, this.ctx.sourcePath, col.source, col.sourceColumn);
          this.lookupValuesMap.set(col.id, values);
        }
      }
    } catch (e) {
      console.warn("SmartLists: Error loading dependencies", e);
    }
  }

  private render() {
    clearChildren(this.containerEl);

    renderSmartList(
      this.containerEl,
      this.data,
      {
        onCellChange: (rowIndex, columnId, value) => this.handleDataChange(updateCell(this.data, rowIndex, columnId, value)),
        onRowAdd: (index) => this.handleDataChange(addRow(this.data, index)),
        onRowDelete: (rowIndex) => this.handleDataChange(deleteRow(this.data, rowIndex)),
        onColumnAdd: (column, index) => this.handleDataChange(addColumn(this.data, column, index)),
        onColumnDelete: (columnId) => this.handleDataChange(deleteColumn(this.data, columnId)),
        onColumnRename: (columnId, newName) => this.handleDataChange(renameColumn(this.data, columnId, newName)),
        onRowReorder: (from, to) => this.handleDataChange(reorderRows(this.data, from, to)),
        onColumnReorder: (from, to) => this.handleDataChange(reorderColumns(this.data, from, to)),
        onFilter: () => {
          if (this.data.id) this.plugin.activeUIStates.set(this.data.id, this.uiState);
        },
        onSort: () => {
          if (this.data.id) this.plugin.activeUIStates.set(this.data.id, this.uiState);
        },
        onSaveFilters: (uiState) => {
          this.data.defaultUIState = JSON.parse(JSON.stringify(uiState));
          this.handleDataChange(this.data);
        },
        onClearFilters: () => {
          this.uiState.filters = {};
          this.uiState.sortConfig = { columnId: '', dir: null };
          if (this.data.id) this.plugin.activeUIStates.set(this.data.id, this.uiState);
          this.data.defaultUIState = undefined;
          this.handleDataChange(this.data);
        },
        ...(this.plugin.settings.enableFathomSync && {
          onFathomSync: () => {
            FathomService.sync(this.ctx.sourcePath, this.data, this.plugin.settings.fathomApiUrl);
          }
        })
      },
      this.uiState,
      this.lookupValuesMap,
      this.persons,
      this.plugin.settings
    );
  }

  private async handleDataChange(newData: SmartListData) {
    if (this.isUpdating) return;
    this.isUpdating = true;
    
    this.data = newData;
    this.render(); // Optimistic update

    try {
      await this.saveToFile();
    } catch (error) {
      console.error("SmartLists: Error saving data", error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async saveToFile() {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!(file instanceof TFile)) {
      console.error("SmartLists: Archivo no encontrado.");
      return;
    }

    const newSource = serializeSmartListJson(this.data);

    await this.app.vault.process(file, (data) => {
      // Buscar todos los bloques smartlist en el archivo
      const regex = /```smartlist[\r\n]+([\s\S]*?)[\r\n]+```/g;
      return data.replace(regex, (match, p1) => {
        // Normalizar saltos de línea eliminando \r para poder comparar correctamente
        const p1Normalized = p1.replace(/\r/g, '');
        const sourceNormalized = this.source.replace(/\r/g, '');
        
        // Si el contenido del bloque coincide con nuestro source original (ignorando \r), lo reemplazamos
        if (p1Normalized.trim() === sourceNormalized.trim()) {
          return `\`\`\`smartlist\n${newSource}\n\`\`\``;
        }
        return match;
      });
    });

    this.source = newSource;
  }
}
