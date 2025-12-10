/* ===================================
   PROYECTOENYE - ERROR HANDLER
   Manejo centralizado de errores
   Versión: 1.0.0
   =================================== */

class ErrorHandler {
    
    // Validar que una escena existe
    static validateScene(scene, sceneId) {
        if (!scene) {
            logger.error('SceneLoader', `Escena ${sceneId} no encontrada`);
            return false;
        }

        if (!scene.id) {
            logger.warn('SceneValidator', `Escena ${sceneId} sin ID definido`);
        }

        if (!scene.title) {
            logger.warn('SceneValidator', `Escena ${sceneId} sin título`);
        }

        return true;
    }

    // Validar que un asset existe (async)
    static async validateAsset(path, type = 'asset') {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (!response.ok) {
                logger.error('AssetValidator', `${type} no encontrado: ${path}`);
                return false;
            }
            logger.debug('AssetValidator', `${type} válido: ${path}`);
            return true;
        } catch (error) {
            logger.error('AssetValidator', `Error verificando ${type}: ${path}`, error);
            return false;
        }
    }

    // Validar target de acción
    static validateActionTarget(action, sceneId, gameData) {
        if (typeof action.target === 'number') {
            // Validar que la escena objetivo existe
            if (!gameData.scene_collection.scenes[action.target]) {
                logger.error(
                    'ActionValidator',
                    `Acción en escena ${sceneId} apunta a escena inexistente: ${action.target}`
                );
                return false;
            }
        } else if (typeof action.target === 'string' && action.target.startsWith('sprites')) {
            // Validar que el sprite existe
            const spriteId = action.target.replace('sprites', '');
            const scene = gameData.scene_collection.scenes[sceneId];
            if (!scene.sprites || !scene.sprites[spriteId]) {
                logger.error(
                    'ActionValidator',
                    `Acción en escena ${sceneId} apunta a sprite inexistente: ${action.target}`
                );
                return false;
            }
        }
        return true;
    }

    // Capturar errores globales de JavaScript
    static initGlobalErrorHandler() {
        window.addEventListener('error', function(event) {
            logger.error('GlobalError', event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', function(event) {
            logger.error('UnhandledPromise', event.reason);
        });
    }

    // Wrap función con try-catch automático
    static safeExecute(context, fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            logger.error(context, 'Error en ejecución', error);
            return fallback;
        }
    }
}

// Inicializar al cargar
$(document).ready(function() {
    ErrorHandler.initGlobalErrorHandler();
    logger.info('ErrorHandler', 'Sistema de manejo de errores inicializado');
});
