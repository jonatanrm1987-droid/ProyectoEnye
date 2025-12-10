# ProyectoEñe - Changelog

Todas las versiones y cambios notables del proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.2.0] - 2025-12-10

### ✨ Added - Sistema de Gestión de Assets y Fondos Avanzados

#### **Backend PHP API**
- **API REST completa** para gestión de proyectos y assets:
  - `api/config.php`: Configuración común, helpers, validaciones
  - `api/list-projects.php`: Listar todos los proyectos
  - `api/get-project.php`: Obtener datos completos de un proyecto
  - `api/create-project.php`: Crear nuevo proyecto con estructura de carpetas
  - `api/save-project.php`: Guardar cambios con sistema de backups
  - `api/delete-project.php`: Eliminar proyecto (recursivo)
  - `api/upload-asset.php`: Subir assets (imágenes, audio) con validación MIME

#### **Estructura de Proyectos en Disco**
- Sistema de carpetas físicas por proyecto:
  - `projects/{slug}/project.json`: Datos del proyecto
  - `projects/{slug}/backgrounds/`: Fondos de escena
  - `projects/{slug}/sprites/`: Sprites e imágenes
  - `projects/{slug}/audio/`: Archivos de audio
  - `projects/{slug}/README.md`: Documentación del proyecto
- Script de migración `migrate.php` para convertir proyectos legacy

#### **Gestión de Fondos con Animaciones**
- **Sistema contextual de propiedades** según tipo de efecto:
  - **Estático**: Posición fija (X, Y) y opacidad
  - **Fade In/Out**: Opacidad inicial/final, duración, easing
  - **Slide**: Posición inicial y final (X, Y), permite movimientos desde fuera de pantalla
  - **Zoom In/Out**: Escala inicial/final, punto de origen, duración
  - **Parallax**: Velocidad y dirección (vertical/horizontal/ambas)
- **Modos de relleno**: cover, contain, stretch, repeat, no-repeat
- **Panel dinámico**: Solo muestra campos relevantes según el tipo seleccionado
- **Animaciones CSS**: Keyframes para fade, slide, zoom con control completo

#### **Gestión de Assets Mejorada**
- **Upload de fondos y sprites** con selector de archivos
- **Naming system**: Nombres editables para todos los assets
- **Preview inmediato**: Los cambios se reflejan automáticamente en el stage
- **Validaciones**: Tipo MIME, tamaño máximo (10MB), sanitización de nombres

#### **UI/UX Improvements**
- **Drag-and-drop para reordenar capas de fondos**:
  - jQuery UI Sortable para reorganización visual
  - Actualización automática del z-index
  - Indicadores visuales durante el arrastre
  - Soporte para `user-select: none` evitando selección de texto
- **Botones unificados**: Eliminar fondo ahora es un botón global
- **Selección visual**: Fondos seleccionados con highlight azul
- **File upload buttons**: Botón 📁 junto a cada campo de archivo

### 🔧 Changed

#### **ProjectManager Refactorizado**
- Migrado de **localStorage a API REST**:
  - Todas las operaciones ahora son `async/await`
  - Uso de `fetch()` para comunicación con backend
  - `FormData` para uploads multipart
  - Manejo de errores con try-catch y logger
- **Métodos actualizados**:
  - `loadProjects()`: GET desde API
  - `createProject()`: POST con validaciones
  - `saveProjectData()`: POST con backups automáticos
  - `deleteProject()`: DELETE con confirmación
  - `uploadAsset()`: POST multipart con FormData
- **Eliminados**: Métodos legacy de migración (`migrateLegacyProject`, `migrateFromScenesJSON`)

#### **Editor.js Mejorado**
- **refreshBackgroundList()**: Ahora con sortable y selección
- **selectBackground()**: Carga contextual de opciones según tipo de efecto
- **loadEffectOptions()**: Sistema de carga dinámica por tipo
- **toggleEffectOptions()**: Muestra/oculta paneles según selección
- **reorderBackgrounds()**: Reorganiza índices tras drag-and-drop
- **applyBackgroundEffect()**: Aplica animaciones CSS en tiempo real
- **renderStage()**: Soporte para posición, opacidad, fill mode y efectos
- Auto-save con validación de disponibilidad del objeto

#### **Dashboard HTML Reorganizado**
- Sección de fondos con lista sortable
- Botón global "Eliminar Fondo"
- Panel de propiedades expandido con secciones colapsables
- Inputs ocultos para file uploads
- Organización por pestañas contextuales según efecto

### 🎨 Styling
- **Animaciones CSS** para efectos de fondos:
  - `@keyframes bg-effect-fade-in/out`
  - `@keyframes bg-effect-slide-left/right/up/down`
  - `@keyframes bg-effect-zoom-in/out`
  - Clase `.effect-parallax` con transitions
- **UI Sortable**:
  - `.bg-layer-item`: Estados hover y selected
  - `.ui-sortable-helper`: Estilo durante drag
  - `.ui-sortable-placeholder`: Indicador de posición
- **Badges y etiquetas** para valores en tiempo real (opacidad, escala, velocidad)

### 🐛 Fixed
- **Null reference errors**: Validaciones en renderStage para backgrounds/sprites eliminados
- **Sortable conflicts**: Destruir instancia antes de recrear
- **Text selection**: `user-select: none` en items dragables
- **Auto-save call**: Uso correcto de `autoSave.saveData()` en lugar de `autoSave()`
- **Código duplicado**: Eliminada función `refreshBackgroundList` duplicada

### 📝 Documentation
- Comentarios en código para cada tipo de efecto
- JSDoc para funciones principales del API
- README.md generado automáticamente en cada proyecto

### 🔒 Security
- Validación MIME type en uploads
- Sanitización de nombres de archivo
- Límite de tamaño (10MB)
- Prevención de path traversal
- CORS headers configurados

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
