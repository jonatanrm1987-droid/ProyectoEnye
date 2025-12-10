# Documentación de cambios (10/12/2025)

## Resumen
Se ha realizado una limpieza completa de la funcionalidad de comportamientos/animaciones de fondo en el editor. Ahora solo se mantiene la gestión de fondos (creación, subida de archivo y orden mediante drag & drop).

## Cambios principales
- Eliminada toda la lógica y UI relacionada con comportamientos/animaciones de fondo en `dashboard.html` y `js/editor.js`.
- Eliminados botones, paneles y listas de comportamientos.
- El código y la interfaz quedan listos para rehacer la gestión de comportamientos desde cero.
- Se mantiene la funcionalidad de:
  - Crear fondos
  - Subir archivos de imagen de fondo
  - Ordenar fondos mediante drag & drop

## Estado actual
- No existe ningún rastro de la gestión anterior de comportamientos.
- El sistema está preparado para implementar una nueva lógica de animaciones o efectos si se requiere.

---

**Commit:** Limpieza completa de comportamientos de fondo: eliminada toda la lógica y UI relacionada con comportamientos/animaciones en JS y HTML. Solo se mantiene la gestión y orden de fondos.
**Fecha:** 10/12/2025
