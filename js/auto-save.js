/* ===================================
   PROYECTOENYE - AUTO SAVE
   Sistema de auto-guardado en LocalStorage
   Versión: 1.0.0
   =================================== */

class AutoSave {
    constructor(interval = 30000) {
        this.interval = interval;
        this.timerId = null;
        this.lastSaveTime = null;
        this.enabled = true;
        this.currentProjectId = null;
    }

    // Establecer proyecto actual
    setProject(projectId) {
        this.currentProjectId = projectId;
        this.storageKey = `proyectoEnye_autoSave_${projectId}`;
        logger.info('AutoSave', `Proyecto configurado: ${projectId}`);
    }

    // Iniciar auto-guardado
    start(getDataFn) {
        if (!this.enabled) {
            logger.warn('AutoSave', 'Auto-guardado deshabilitado');
            return;
        }

        if (!this.currentProjectId) {
            logger.error('AutoSave', 'No hay proyecto activo configurado');
            return;
        }

        this.getDataFn = getDataFn;
        
        // Guardar inmediatamente
        this.save();
        
        // Configurar intervalo
        this.timerId = setInterval(() => {
            this.save();
        }, this.interval);
        
        logger.info('AutoSave', `Auto-guardado iniciado (cada ${this.interval / 1000}s)`);
        this.showSaveIndicator('Auto-guardado activado', 'info');
    }

    // Detener auto-guardado
    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
            logger.info('AutoSave', 'Auto-guardado detenido');
        }
    }

    // Guardar datos
    save() {
        if (!this.getDataFn) {
            logger.error('AutoSave', 'No hay función de obtención de datos');
            return false;
        }

        try {
            const data = this.getDataFn();
            const saveData = {
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            this.lastSaveTime = new Date();
            
            logger.debug('AutoSave', 'Datos guardados en LocalStorage');
            this.showSaveIndicator('Guardado automático', 'success');
            
            return true;
        } catch (error) {
            logger.error('AutoSave', 'Error al guardar', error);
            
            // Verificar si es error de cuota
            if (error.name === 'QuotaExceededError') {
                this.showSaveIndicator('Error: Almacenamiento lleno', 'error');
            } else {
                this.showSaveIndicator('Error al guardar', 'error');
            }
            
            return false;
        }
    }

    // Restaurar datos guardados
    restore() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            
            if (!saved) {
                logger.info('AutoSave', 'No hay datos guardados para restaurar');
                return null;
            }

            const saveData = JSON.parse(saved);
            
            logger.info('AutoSave', `Datos restaurados (guardado: ${saveData.timestamp})`);
            
            return saveData;
        } catch (error) {
            logger.error('AutoSave', 'Error al restaurar datos', error);
            return null;
        }
    }

    // Verificar si hay guardado disponible
    hasSavedData() {
        if (!this.currentProjectId) return false;
        return localStorage.getItem(this.storageKey) !== null;
    }

    // Limpiar datos guardados
    clear() {
        if (!this.currentProjectId) {
            logger.warn('AutoSave', 'No hay proyecto activo');
            return;
        }
        localStorage.removeItem(this.storageKey);
        logger.info('AutoSave', 'Datos de auto-guardado eliminados');
    }

    // Obtener información del último guardado
    getLastSaveInfo() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return null;

        try {
            const saveData = JSON.parse(saved);
            return {
                timestamp: saveData.timestamp,
                version: saveData.version,
                size: new Blob([saved]).size
            };
        } catch {
            return null;
        }
    }

    // Mostrar indicador visual de guardado
    showSaveIndicator(message, type = 'info') {
        // Buscar o crear indicador
        let indicator = $('#auto-save-indicator');
        
        if (indicator.length === 0) {
            indicator = $('<div id="auto-save-indicator"></div>');
            $('body').append(indicator);
        }

        // Actualizar contenido y clase
        indicator
            .removeClass('success error info warning')
            .addClass(type)
            .text(message)
            .fadeIn(200);

        // Ocultar después de 2 segundos
        setTimeout(() => {
            indicator.fadeOut(400);
        }, 2000);
    }

    // Cambiar intervalo de guardado
    setInterval(newInterval) {
        this.interval = newInterval;
        
        // Reiniciar si está activo
        if (this.timerId && this.getDataFn) {
            this.stop();
            this.start(this.getDataFn);
        }
    }

    // Habilitar/deshabilitar
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled && this.timerId) {
            this.stop();
        }
    }
}

// Instancia global
const autoSave = new AutoSave();
