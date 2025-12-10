/* ===================================
   PROYECTOENYE - NOTIFICATIONS
   Sistema de notificaciones visuales para el editor
   Versión: 1.0.0
   =================================== */

// Función para mostrar notificaciones
function showNotification(type, message, duration = 5000) {
    // Crear contenedor si no existe
    let container = $('#notification-container');
    if (container.length === 0) {
        container = $('<div id="notification-container"></div>');
        $('body').append(container);
    }

    // Crear notificación
    const notification = $(`
        <div class="notification ${type}">
            <div class="notification-icon"></div>
            <div class="notification-content">${message}</div>
            <div class="notification-close">×</div>
        </div>
    `);

    // Añadir al contenedor
    container.append(notification);

    // Botón cerrar
    notification.find('.notification-close').click(function() {
        notification.addClass('slide-out');
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-cerrar después de duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parent().length) {
                notification.addClass('slide-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
}

// Shortcuts para tipos específicos
function showError(message, duration = 5000) {
    showNotification('error', message, duration);
}

function showWarning(message, duration = 5000) {
    showNotification('warning', message, duration);
}

function showInfo(message, duration = 3000) {
    showNotification('info', message, duration);
}

function showSuccess(message, duration = 3000) {
    showNotification('success', message, duration);
}
