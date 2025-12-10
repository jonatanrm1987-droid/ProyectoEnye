# ProyectoEñe - Changelog

Todas las versiones y cambios notables del proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.1.0] - 2025-12-10

### ✨ Added - Sistema Multi-Proyecto
- **ProjectManager**: Sistema completo de gestión de múltiples proyectos
  - Crear proyectos con nombre y descripción
  - Listar, cargar, eliminar y exportar proyectos
  - Cada proyecto con su propio espacio de datos aislado
  - Migración automática de datos legacy
- **UI de Gestión de Proyectos**:
  - Modal con lista visual de proyectos (tarjetas)
  - Formulario de creación de proyectos
  - Indicador de proyecto activo en header
  - Botones de acción (Cargar, Exportar, Eliminar)
- **Almacenamiento estructurado**:
  - `proyectoEnye_projects`: Lista de proyectos
  - `proyectoEnye_project_{id}`: Datos por proyecto
  - `proyectoEnye_autoSave_{id}`: Auto-guardado por proyecto

### 🔧 Changed
- **AutoSave**: Adaptado para trabajar con múltiples proyectos
  - `setProject(projectId)`: Configurar proyecto activo
  - Claves de localStorage específicas por proyecto
  - Validaciones de proyecto activo antes de guardar/restaurar
- **Editor**: Integración completa con ProjectManager
  - Carga automática del último proyecto activo
  - Cambio dinámico entre proyectos
  - Sincronización de auto-guardado y guardado manual
  - Exportación por proyecto individual

### 🎨 Styling
- Estilos para modal de gestión de proyectos
- Tarjetas de proyecto con estados (activo/inactivo)
- Header de proyecto con gradiente e icono
- Badges y botones de acción con estados disabled
- Diseño responsivo para modal y formularios

---

## [1.0.0] - 2025-12-10

### ✨ Added - Fase 1: Fundamentos Técnicos

#### 1.1 - Separación de CSS
- `css/common.css`: Estilos compartidos (escenas, sprites, botones, overlays)
- `css/viewer.css`: Estilos del visor (fullscreen, transiciones, loading)
- `css/editor.css`: Estilos del editor (layout 3 columnas, stage, controles)

#### 1.2 - Separación de JavaScript
- `js/viewer.js`: Motor de reproducción de aventuras (193 líneas)
  - `loadScene()`: Carga y renderizado de escenas
  - `executeAction()`: Manejo de acciones y transiciones
  - Soporte para time-events y contenido dinámico
- `js/editor.js`: Editor visual drag-and-drop (412 líneas)
  - Gestión de escenas, sprites y acciones
  - Sistema drag-and-drop para posicionamiento
  - Exportación a JSON
  - Integración con auto-guardado

#### 1.3 - Sistema de Logging y Errores
- `js/logger.js`: Sistema de logs con 4 niveles (ERROR, WARN, INFO, DEBUG)
  - Historial de logs (máximo 100 entradas)
  - Exportación de logs
  - Timestamps automáticos
- `js/error-handler.js`: Validaciones y manejo de errores
  - `validateScene()`: Validación de estructura de escenas
  - `validateAsset()`: Verificación de assets
  - `initGlobalErrorHandler()`: Captura global de errores
  - `safeExecute()`: Wrapper para ejecución segura
- `js/notifications.js`: Sistema de notificaciones toast
  - 4 tipos: error, warning, info, success
  - Auto-dismiss configurable
  - Animaciones suaves
- `css/notifications.css`: Estilos para toasts (121 líneas)

#### 1.4 - Sistema de Auto-Guardado
- `js/auto-save.js`: Persistencia automática en LocalStorage (178 líneas)
  - Auto-guardado cada 30 segundos
  - Restauración al iniciar con confirmación
  - Indicador visual de estado
  - Información de último guardado
  - Guardado manual y limpieza
- Integración en `editor.js`:
  - Detección de datos guardados al iniciar
  - Restauración con confirmación del usuario
  - Controles manuales (💾 Guardar Ahora, Limpiar Auto-guardado)
- Estilos de indicador de guardado en `editor.css`

### 📝 Documentation
- `PROYECTO_DOCUMENTACION.md`: Análisis completo del proyecto
  - 45+ características implementadas
  - 100+ características pendientes
  - Roadmap de 10 fases de mejora
  - Limitaciones técnicas y artísticas identificadas

### 🏗️ Project Structure
```
ProyectoEnye/
├── css/
│   ├── common.css          # Estilos compartidos
│   ├── viewer.css          # Estilos del visor
│   ├── editor.css          # Estilos del editor
│   └── notifications.css   # Estilos de toasts
├── js/
│   ├── viewer.js           # Motor de reproducción
│   ├── editor.js           # Editor visual
│   ├── logger.js           # Sistema de logs
│   ├── error-handler.js    # Validaciones
│   ├── notifications.js    # Notificaciones
│   ├── auto-save.js        # Auto-guardado
│   └── project-manager.js  # Gestión de proyectos
├── backgrounds/            # Fondos de escenas
├── sprites/                # Sprites de personajes/objetos
├── index.html              # Visor de aventuras
├── dashboard.html          # Editor visual
├── scenes.json             # Datos de ejemplo
└── PROYECTO_DOCUMENTACION.md
```

---

## [0.1.0] - Estado Inicial

### Características Base
- Visor de aventuras interactivas (index.html)
- Editor visual básico (dashboard.html)
- Sistema de escenas con sprites y acciones
- Soporte para múltiples sprites por escena
- Animaciones y transiciones CSS
- Time-events para cambios automáticos
- Exportación a JSON

### Limitaciones Iniciales
- Todo el CSS y JS inline en HTML
- Sin sistema de logging
- Sin manejo de errores
- Sin auto-guardado
- Sin gestión de proyectos
- Alertas nativas para feedback
