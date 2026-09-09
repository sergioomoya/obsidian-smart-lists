# Guía de Usuario - Obsidian Smart Lists

Bienvenido a la guía oficial de **Obsidian Smart Lists**. Este documento te enseñará a crear, personalizar y aprovechar al máximo tus bases de datos interactivas dentro de Obsidian.

---

## 1. ¿Qué es Smart Lists?

Smart Lists es un plugin que convierte bloques de código Markdown con identificador `smartlist` en tablas interactivas con estilo moderno (similar a Notion o Airtable). Toda tu información vive en formato JSON legible y portable dentro de tus propios archivos Markdown.

---

## 2. Cómo Crear una Tabla Smart List

### Método 1: Comando de la Paleta (Recomendado)
1. Abre cualquier nota en Obsidian.
2. Pulsa `Ctrl + P` (o `Cmd + P` en Mac) para abrir la paleta de comandos.
3. Escribe `Insert Smart List` y pulsa Enter.
4. Se insertará automáticamente una tabla de ejemplo lista para usar.

### Método 2: Escribir el Bloque Manualmente
Escribe un bloque de código cercado con tres acentos graves y la palabra `smartlist`:

````markdown
```smartlist
{
  "title": "Mi Proyecto",
  "columns": [
    { "id": "task", "name": "Tarea", "type": "text" },
    { "id": "status", "name": "Estado", "type": "select", "options": [
      { "label": "Pendiente", "color": "#f59e0b" },
      { "label": "Hecho", "color": "#10b981" }
    ]},
    { "id": "due", "name": "Fecha Límite", "type": "date" }
  ],
  "rows": [
    { "_id": "r_1", "task": "Redactar informe", "status": "Pendiente", "due": { "text": "2026-09-15" } }
  ]
}
```
````

En cuanto salgas del modo de edición de código, la tabla se renderizará automáticamente.

---

## 3. Tipos de Columna Soportados

Smart Lists soporta 9 tipos de datos especializados:

| Tipo | Identificador | Descripción |
| :--- | :--- | :--- |
| **Texto** | `text` | Texto libre con edición directa al hacer clic. |
| **Número** | `number` | Valores numéricos con alineación derecha. |
| **Selección** | `select` | Desplegable de opción única con pastillas (pills) de colores personalizables. |
| **Multi-Selección** | `multiselect` | Múltiples etiquetas de colores en la misma celda. |
| **Fecha** | `date` | Selector visual de calendario con formato estándar `YYYY-MM-DD`. |
| **Casilla** | `checkbox` | Casilla de verificación interactiva de un solo clic. |
| **Persona** | `person` | Asignación de responsables con autocompletado inteligente conectado a `contacts.md`. |
| **URL** | `url` | Enlace web clicable con opción de edición directa. |
| **Búsqueda (Lookup)** | `lookup` | Relación que extrae valores dinámicos de otra Smart List en la bóveda. |

---

## 4. Gestión de Columnas y Filas

- **Añadir Fila:** Haz clic en el botón `+ Nueva Fila` al final de la tabla.
- **Eliminar Fila:** Pasa el ratón sobre la fila y haz clic en el icono de papelera situado a la izquierda.
- **Reordenar Filas y Columnas:** Arrastra y suelta (Drag & Drop) usando las manetas de puntos a la izquierda de cada fila o en el encabezado de cada columna.
- **Opciones de Columna:** Haz clic en los tres puntos del encabezado para:
  - Renombrar la columna.
  - Cambiar el tipo de columna.
  - Añadir o cambiar colores de opciones (`select` / `multiselect`).
  - Eliminar la columna.

---

## 5. Ordenación, Filtros y Guardado de Vistas

### Ordenar Datos
- Haz clic en el encabezado de cualquier columna para alternar entre orden **Ascendente**, **Descendente** o **Por Defecto**.

### Filtrar Filas
- Haz clic en el icono de embudo en el encabezado de una columna.
- Selecciona las casillas de los valores que deseas ver.
- Puedes filtrar por múltiples columnas a la vez.

### Guardar Vista por Defecto (`defaultUIState`)
- Si configuras una ordenación o unos filtros que deseas conservar cada vez que abras la nota, haz clic en el botón con icono de disco en la barra de herramientas superior (**"Guardar filtros actuales como predeterminados"**).

---

## 6. Exportación al Portapapeles (Outlook, Word y Gmail)

En la barra de herramientas de la tabla encontrarás el botón **Copiar Tabla**.

Al hacer clic:
1. Smart Lists exporta la tabla respetando únicamente las filas que están visibles según los filtros activos.
2. Copia simultáneamente dos formatos al portapapeles:
   - **Formato TSV:** Para pegar en Excel o Google Sheets.
   - **Formato HTML Estilizado:** Con estilos CSS inline (colores de pastillas, bordes, tipografía corporativa).
3. Pega directamente con `Ctrl + V` en **Microsoft Outlook**, **Word** o **Gmail**: la tabla se pegará perfectamente formateada, idéntica a cómo se ve en Obsidian.

---

## 7. Integración con Fathom Notebook

Si utilizas el backend de Fathom Notebook para procesar reuniones:
- **Sincronización:** Cuando editas una tabla generada por Fathom (`PDA [CLIENTE].md` o `minutas.md`), puedes pulsar el botón de sincronización para propagar los cambios al servidor local de Fathom (`http://localhost:3000`).
- **Reprocesamiento:** Desde la barra de la tabla o desde la paleta de comandos (`Ctrl + P`), puedes ejecutar:
  - *Fathom: Reprocesar sesión actual (Completa):* Vuelve a regenerar metadatos, transcripción, minutas, acciones y vídeo.
  - *Fathom: Reprocesar sesión actual (Personalizada):* Abre un modal interactivo donde eliges qué componentes regenerar (ej: solo minutas con IA y acciones, sin descargar el vídeo).

---

## 8. Ajustes del Plugin

Ve a **Ajustes > Smart Lists** en Obsidian para personalizar:
- **Densidad de la Tabla:** Alterna entre vista Normal y Compacta (ideal para pantallas pequeñas o tablas extensas).
- **Mostrar Números de Fila:** Activa o desactiva la columna de numeración secuencial.
- **URL de la API de Fathom:** Configura la dirección del servidor local de Fathom (por defecto `http://localhost:3000`).
