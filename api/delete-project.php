<?php
/**
 * Delete Project API
 * DELETE /api/delete-project.php?projectId=slug
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Método no permitido', 405);
}

try {
    $projectSlug = $_GET['projectId'] ?? null;
    
    if (!$projectSlug) {
        error('projectId es requerido', 400);
    }
    
    // Validar proyecto
    $projectPath = validateProject($projectSlug);
    
    // Función recursiva para eliminar carpeta
    function deleteDirectory($dir) {
        if (!file_exists($dir)) return true;
        if (!is_dir($dir)) return unlink($dir);
        
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
        }
        
        return rmdir($dir);
    }
    
    // Eliminar proyecto
    if (deleteDirectory($projectPath)) {
        success([
            'projectId' => $projectSlug,
            'deleted' => true
        ], 'Proyecto eliminado exitosamente');
    } else {
        error('No se pudo eliminar el proyecto', 500);
    }
    
} catch (Exception $e) {
    error('Error al eliminar proyecto: ' . $e->getMessage(), 500);
}
