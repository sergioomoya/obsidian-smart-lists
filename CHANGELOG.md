# Changelog - Smart Lists (Add-on Obsidian)

## [0.1.0] - 2026-07-30
### Añadido
- Interfaz nativa tipo base de datos inyectada en bloques ````smartlist`.
- Edición multilínea de celdas soportada vía `<textarea>` con atajo `Shift+Enter`.
- Drag and Drop para reordenación de filas utilizando el manejador lateral `⋮⋮`.
- Drag and Drop para reordenación de columnas desde la cabecera.
- Botones flotantes (hover) para añadir filas y columnas, sustituyendo al menú estático inferior.
- Componente de Fecha dinámico: renderiza como texto en modo lectura y como selector de calendario nativo al hacer clic.
- **Exportación Inteligente al Portapapeles (Rich HTML):** Interceptación del evento de copia (`Ctrl+C`) en la tabla para inyectar un HTML renderizado con estilos en línea (CSS inline). Ahora, al pegar en correos u otros clientes ricos, se respetan los colores oscuros, los formatos de píldoras y los iconos en lugar del código JSON.

### Modificado
- La estructura principal de la tabla ya no usa etiquetas HTML `<table>`, sino un sistema basado en etiquetas `<div>` con propiedades de `display: table` de CSS puro. 

### Solucionado
- **Inmunidad contra Plugins de Terceros**: Al prescindir de las etiquetas `<table>`, el plugin evita por completo los fallos catastróficos de diseño y superposiciones causados por plugins externos de Obsidian (como Dynamic Wide Content o Advanced Tables).
- Se implementó un controlador universal de clics externos ("click-away") usando `AbortController` para asegurar que cualquier menú desplegable, formulario emergente o selector de fecha se cierre limpiamente si el usuario pincha fuera del área.
