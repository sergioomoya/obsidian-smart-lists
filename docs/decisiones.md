# Registro de Decisiones (ADR) - Obsidian Smart Lists

Este documento registra las decisiones arquitectónicas fundamentales tomadas durante el diseño e implementación del plugin **Obsidian Smart Lists**.

---

## ADR 1: Arquitectura de Tablas basada en CSS Divs (`display: table`)
- **Estado:** Aceptada
- **Contexto:** Las etiquetas HTML estándar `<table>`, `thead`, `tr` y `td` son el blanco principal de estilos globales de la mayoría de temas de Obsidian y plugins de terceros (ej: *Advanced Tables*, *Dynamic Backgrounds*). Esto provocaba que los menús flotantes se recortaran (overflow hidden) y que el drag & drop fallara.
- **Decisión:** Construir la estructura visual íntegra de la tabla utilizando elementos `div` semánticamente organizados con las reglas CSS `display: table`, `display: table-row` y `display: table-cell`.
- **Consecuencias:** Inmunidad absoluta ante conflictos con otros plugins o temas de Obsidian. Control total sobre el posicionamiento de z-index, dropdowns absolutos y animaciones.

---

## ADR 2: Persistencia JSON Pura Embebida en Bloques Markdown
- **Estado:** Aceptada
- **Contexto:** Se evaluó si almacenar los datos de las tablas en una base de datos SQLite oculta (en `.obsidian/plugins/...`) o en archivos JSON separados.
- **Decisión:** Mantener el 100% de los datos dentro del propio archivo Markdown, dentro del bloque de código ````smartlist ... ```` en formato JSON legible con indentación de 2 espacios.
- **Consecuencias:**
  - Máxima portabilidad: las notas son sincronizables vía Git, OneDrive o Obsidian Sync sin perder integridad.
  - Si el plugin se desactiva, los datos siguen siendo accesibles e inspeccionables en texto plano.
  - Idempotencia total en backups y control de versiones.

---

## ADR 3: `contacts.md` como Fuente de Verdad para Columnas de Persona
- **Estado:** Aceptada
- **Contexto:** Para la columna de tipo `Person`, se necesitaba autocompletar nombres de responsables evitando escribir a mano o cometer erratas de ortografía.
- **Decisión:** Conectar `PersonService` con el archivo `contacts.md` presente en la raíz de la bóveda (generado por Fathom Notebook), detectando la empresa activa a partir de la ruta de la nota e incluyendo automáticamente al equipo interno (`MESBOOK`).
- **Consecuencias:** Coherencia de datos en toda la bóveda. Las asignaciones en PDAs y minutas siempre corresponden a contactos reales registrados.

---

## ADR 4: Integración Desacoplada con Fathom Notebook vía HTTP REST Local
- **Estado:** Aceptada
- **Contexto:** El usuario requería sincronizar y reprocesar reuniones de Fathom directamente desde la vista de minutas o PDA en Obsidian.
- **Decisión:** Implementar un cliente HTTP (`FathomService`) que se comunique con el servidor local de Fathom (`http://localhost:3000`).
- **Consecuencias:** Obsidian y Fathom Notebook permanecen desacoplados. Si el servidor de Fathom está apagado, el plugin muestra una notificación amigable (`Notice`) sin congelar Obsidian ni generar excepciones no capturadas.

---

## ADR 5: Exportación Enriquecida al Portapapeles con Estilos Inline
- **Estado:** Aceptada
- **Contexto:** Los usuarios necesitaban compartir tablas de seguimiento por correo electrónico (Outlook, Gmail) o informes en Word. El copiado de texto plano perdía la riqueza visual de los estados.
- **Decisión:** En `clipboard.utils.ts`, generar un payload binario en el portapapeles que contiene simultáneamente texto plano en formato TSV y HTML con todos los estilos CSS incrustados inline (`style="..."`).
- **Consecuencias:** Pegado perfecto en Microsoft Outlook, Word y Gmail con colores y pastillas intactas, respetando además los filtros activos en pantalla.
