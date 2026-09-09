# 📊 Obsidian Smart Lists

**Obsidian Smart Lists** es un plugin para [Obsidian](https://obsidian.md/) que transforma bloques de código Markdown con datos JSON en bases de datos interactivas con interfaz visual enriquecida (estilo Notion o Airtable). Trabaja con tus datos de forma visual e intuitiva mientras mantienes tus notas Markdown limpias, portables y sincronizables.

---

## 🌟 Características Principales

- 📱 **Soporte Completo (Desktop y Mobile):** Rendimiento ágil y diseño totalmente responsivo adaptado a dispositivos móviles y escritorio.
- 🗄️ **Base de Datos sin Bases de Datos:** Renderiza tablas interactivas a partir de bloques de código `smartlist` en JSON estándar.
- 🔄 **Drag & Drop Nativo:** Reordena filas y columnas arrastrando directamente sus manetas.
- 🔍 **Ordenación y Filtros Dinámicos:** Ordena de forma ascendente/descendente con un clic y filtra filas mediante casillas de verificación multicriterio.
- 💾 **Vistas Persistentes (`defaultUIState`):** Guarda tus filtros y ordenación como vista predeterminada para que la tabla siempre cargue en el estado que necesitas.
- 📝 **9 Tipos de Campos Especializados:** Texto, número, selección única (pills), multi-selección, fecha con calendario, casillas booleanas, URLs clicables, personas (autocompletado desde `contacts.md`) y relaciones (lookup desde otras tablas).
- 🎨 **Paleta de Pastillas de Color (Pills):** Visualiza estados, prioridades y categorías con pastillas de colores personalizables.
- 📋 **Portapapeles Inteligente:** Copia tablas completas respetando los filtros activos y pégalas como tablas HTML perfectamente estilizadas en **Microsoft Outlook**, **Word** o **Gmail** (o como TSV en hojas de cálculo).
- 🤝 **Integración Nativa con Fathom Notebook:** Sincroniza planes de acción (PDA) y ejecuta reprocesamientos completos o personalizados de reuniones grabadas en Fathom directamente desde Obsidian.
- 🛡️ **Libre de Conflictos (CSS Display Table):** Construido con una arquitectura pura basada en `div` con `display: table`, inmune a conflictos con otros plugins de tablas (como *Advanced Tables*) o temas visuales agresivos.

---

## 📚 Documentación Técnica y Guías

Para explorar a fondo el funcionamiento interno y guías de uso, consulta la carpeta [`docs/`](docs/):

- 🏛️ **[Arquitectura del Plugin](docs/arquitectura.md):** Diseño técnico, ciclo de vida, post-procesador Markdown, sistema de renderizado modular y servicios.
- 📖 **[Guía de Usuario](docs/guia_usuario.md):** Manual paso a paso con sintaxis de bloques, creación de tablas, filtros, atajos y casos de uso.
- ⚖️ **[Registro de Decisiones (ADR)](docs/decisiones.md):** Historial justificado de decisiones técnicas (CSS divs, JSON embebido, `contacts.md` como fuente de verdad, integración HTTP).

---

## 🚀 Cómo Usar

Crea un bloque de código cercado en cualquier nota Markdown con el lenguaje establecido en `smartlist`:

````markdown
```smartlist
{
  "title": "Seguimiento de Tareas",
  "columns": [
    {
      "id": "task_name",
      "name": "Tarea",
      "type": "text"
    },
    {
      "id": "status",
      "name": "Estado",
      "type": "select",
      "options": [
        { "label": "Pendiente", "color": "#f59e0b" },
        { "label": "En Curso", "color": "#3b82f6" },
        { "label": "Hecho", "color": "#10b981" }
      ]
    },
    {
      "id": "due_date",
      "name": "Fecha Límite",
      "type": "date"
    },
    {
      "id": "owner",
      "name": "Responsable",
      "type": "person"
    }
  ],
  "rows": [
    {
      "_id": "r_001",
      "task_name": "Revisar arquitectura del sistema",
      "status": "Hecho",
      "due_date": { "text": "2026-09-10" },
      "owner": "Sergio Moya"
    }
  ]
}
```
````

Cualquier cambio que realices en la interfaz gráfica actualizará automáticamente el JSON subyacente en el archivo Markdown.

---

## ⌨️ Paleta de Comandos (`Ctrl + P`)

- **`Insert Smart List`:** Inserta una nueva tabla interactiva de ejemplo en la posición actual del cursor.
- **`Fathom: Reprocesar sesión actual (Personalizada)`:** Abre un diálogo interactivo para regenerar selectivamente minutas, acciones, transcripciones o vídeos de la sesión abierta.
- **`Fathom: Reprocesar sesión actual (Completa)`:** Dispara la regeneración integral de la sesión de Fathom actual.

---

## 🛠️ Instalación y Compilación

```bash
# Instalar dependencias
npm install

# Compilar para desarrollo / producción
npm run build
```

