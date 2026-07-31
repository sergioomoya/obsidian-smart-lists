# Obsidian Smart Lists

A powerful Obsidian plugin that turns raw JSON markdown blocks into rich, interactive, Notion/Airtable-like databases. Work with your data visually while keeping your markdown source perfectly clean and portable.

## Features

- 📱 **Mobile & Desktop**: Fully responsive and compatible with Obsidian Mobile.
- 🗄️ **Database UI**: Render your data as a clean, interactive table without dealing with raw JSON.
- 🔄 **Drag & Drop**: Reorder rows and columns easily with native drag handles.
- 📝 **Rich Field Types**: Supports multi-line text, selects, multi-selects, dates, and people.
- 🎨 **Pill Styling**: Visualize status, priorities, and tags with colored pill indicators.
- 📋 **Smart Clipboard**: Copy your rendered table and paste it as a fully styled HTML table in Outlook, Gmail, or Word (or as TSV in plain text editors).
- 🛡️ **Conflict-Free**: Built with a pure `div`-based architecture (`display: table`), meaning it won't break or conflict with other table-modifying plugins (like Advanced Tables or Dynamic Wide Content).

## How to Use

Create a markdown code block with the language set to `smartlist`.
The plugin will instantly parse the JSON and render it as an interactive table. Any changes you make via the UI will automatically update the underlying JSON in your markdown file.

### Example Markdown
```smartlist
{
  "title": "My Project Tasks",
  "columns": [
    {
      "id": "task_name",
      "name": "Task",
      "type": "text"
    },
    {
      "id": "status",
      "name": "Status",
      "type": "select",
      "options": [
        { "label": "To Do", "color": "#f59e0b" },
        { "label": "In Progress", "color": "#3b82f6" },
        { "label": "Done", "color": "#10b981" }
      ]
    },
    {
      "id": "due_date",
      "name": "Due Date",
      "type": "date"
    }
  ],
  "rows": [
    {
      "_id": "r_12345",
      "task_name": "Implement new UI",
      "status": "In Progress",
      "due_date": { "text": "2026-08-01" }
    }
  ]
}
```

## Manual Installation

1. Download the latest release from the Releases page.
2. Extract the `obsidian-smart-lists` folder into your vault's `.obsidian/plugins/` directory.
3. Reload Obsidian and enable the plugin in Settings > Community Plugins.

## Building from Source

```bash
npm install
npm run build
```
