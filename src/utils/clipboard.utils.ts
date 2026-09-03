import { ColumnDefinition, ColumnType } from '../models/types';
import { getCellDisplayText, ProcessedRow } from '../services/data.service';

export async function copyTableToClipboard(
  columns: ColumnDefinition[],
  rows: ProcessedRow[]
): Promise<boolean> {
  let html = '<table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #1e1e1e; color: #d4d4d4; font-size: 13px; width: 100%; border: 1px solid #333;">';
  html += '<thead><tr>';
  const plainLines: string[] = [];
  const plainHeaders: string[] = [];
  columns.forEach(col => {
    html += `<th style="padding: 10px 12px; background-color: #111827; color: #9ca3af; text-align: left; font-weight: 600; border-bottom: 1px solid #374151; white-space: nowrap;">${col.name}</th>`;
    plainHeaders.push(col.name);
  });
  html += '</tr></thead><tbody>';
  plainLines.push(plainHeaders.join('\t'));

  rows.forEach(item => {
    html += '<tr>';
    const plainRow: string[] = [];
    columns.forEach(col => {
      const text = getCellDisplayText(item.row[col.id]);
      plainRow.push(text.replace(/\t/g, ' ').replace(/\n/g, ' '));
      
      const htmlText = text.replace(/\n/g, '<br>');
      let cellHtml = htmlText;

      if (text && (col.type === ColumnType.Select || col.type === ColumnType.MultiSelect)) {
        const vals = col.type === ColumnType.MultiSelect ? text.split(', ') : [text];
        cellHtml = vals.map(v => {
          const opt = col.options?.find(o => o.label === v);
          const color = opt?.color || '#4b5563';
          return `<span style="background-color: ${color}; color: #ffffff; padding: 3px 10px; border-radius: 12px; font-size: 12px; display: inline-block; font-weight: 500; margin-right: 4px; white-space: nowrap;">${v}</span>`;
        }).join('');
      } else if (text && col.type === ColumnType.Person) {
        const vals = text.split(', ');
        cellHtml = vals.map(v => `<span style="background-color: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; padding: 3px 10px; border-radius: 12px; font-size: 12px; display: inline-block; font-weight: 500; margin-right: 4px; white-space: nowrap;">👤 ${v}</span>`).join('');
      }
      
      html += `<td style="padding: 10px 12px; border-bottom: 1px solid #374151; vertical-align: top;">${cellHtml}</td>`;
    });
    html += '</tr>';
    plainLines.push(plainRow.join('\t'));
  });
  html += '</tbody></table>';

  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainLines.join('\n')], { type: 'text/plain' })
    });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error('Error copying to clipboard', err);
    return false;
  }
}
