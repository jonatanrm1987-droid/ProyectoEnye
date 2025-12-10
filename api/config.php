<?php
/**
 * API Configuration
 * ProyectoEñe - Sistema de gestión de proyectos
 */

// Headers para CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en producción

// Rutas base
define('BASE_PATH', dirname(__DIR__));
define('PROJECTS_PATH', BASE_PATH . '/projects');

// Configuración de uploads
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_AUDIO_TYPES', ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3']);

// Crear directorio de proyectos si no existe
if (!file_exists(PROJECTS_PATH)) {
    mkdir(PROJECTS_PATH, 0755, true);
}

/**
 * Respuesta JSON exitosa
 */
function success($data = null, $message = 'OK') {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Respuesta JSON de error
 */
function error($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Sanitizar nombre de proyecto para usar como nombre de carpeta
 */
function sanitizeProjectName($name) {
    // Convertir a minúsculas, reemplazar espacios y caracteres especiales
    $name = strtolower($name);
    $name = preg_replace('/[^a-z0-9]+/', '-', $name);
    $name = trim($name, '-');
    return $name;
}

/**
 * Validar que el proyecto existe
 */
function validateProject($projectSlug) {
    $projectPath = PROJECTS_PATH . '/' . $projectSlug;
    if (!file_exists($projectPath)) {
        error('Proyecto no encontrado', 404);
    }
    return $projectPath;
}

/**
 * Generar ID único
 */
function generateId() {
    return 'proj_' . time() . '_' . bin2hex(random_bytes(4));
}
