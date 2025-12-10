/* ===================================
   PROYECTOENYE - LOGGER
   Sistema de logging y manejo de errores
   Versión: 1.0.0
   =================================== */

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.enabled = true;
    }

    // Nivel ERROR - Errores críticos
    error(context, message, data = null) {
        this._log('ERROR', context, message, data);
        console.error(`[${context}] ${message}`, data || '');
        
        // En el editor, mostrar visualmente
        if (typeof showNotification === 'function') {
            showNotification('error', `Error en ${context}: ${message}`);
        }
    }

    // Nivel WARNING - Advertencias
    warn(context, message, data = null) {
        this._log('WARN', context, message, data);
        console.warn(`[${context}] ${message}`, data || '');
        
        if (typeof showNotification === 'function') {
            showNotification('warning', `Advertencia: ${message}`);
        }
    }

    // Nivel INFO - Información general
    info(context, message, data = null) {
        this._log('INFO', context, message, data);
        console.log(`[${context}] ${message}`, data || '');
    }

    // Nivel DEBUG - Solo en desarrollo
    debug(context, message, data = null) {
        if (this.enabled) {
            this._log('DEBUG', context, message, data);
            console.log(`[DEBUG][${context}] ${message}`, data || '');
        }
    }

    // Método interno para almacenar logs
    _log(level, context, message, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            context,
            message,
            data
        };

        this.logs.push(logEntry);

        // Limitar tamaño del historial
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    // Obtener todos los logs
    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    // Limpiar logs
    clearLogs() {
        this.logs = [];
    }

    // Exportar logs como JSON
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    // Habilitar/deshabilitar debug
    setDebugMode(enabled) {
        this.enabled = enabled;
    }
}

// Instancia global
const logger = new Logger();
