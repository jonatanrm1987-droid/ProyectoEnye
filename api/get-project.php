<?php
/**
 * Get Project API
 * GET /api/get-project.php?projectId=slug
 * Retorna los datos completos de un proyecto
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Método no permitido', 405);
}

try {
    $projectSlug = $_GET['projectId'] ?? null;
    
    if (!$projectSlug) {
        error('projectId es requerido', 400);
    }
    
    // Validar proyecto
    $projectPath = validateProject($projectSlug);
    $jsonFile = $projectPath . '/project.json';
    
    if (!file_exists($jsonFile)) {
        error('Archivo project.json no encontrado', 404);
    }
    
    // Leer y parsear JSON
    $jsonContent = file_get_contents($jsonFile);
    $projectData = json_decode($jsonContent, true);
    
    if (!$projectData) {
        error('Error al leer datos del proyecto', 500);
    }
    
    // Agregar información de assets disponibles
    $assets = [
        'backgrounds' => [],
        'sprites' => [],
        'audio' => []
    ];
    
    foreach (['backgrounds', 'sprites', 'audio'] as $assetType) {
        $assetPath = $projectPath . '/' . $assetType;
        if (is_dir($assetPath)) {
            $files = array_diff(scandir($assetPath), ['.', '..']);
            foreach ($files as $file) {
                if (is_file($assetPath . '/' . $file)) {
                    $assets[$assetType][] = [
                        'name' => $file,
                        'path' => 'projects/' . $projectSlug . '/' . $assetType . '/' . $file,
                        'size' => filesize($assetPath . '/' . $file)
                    ];
                }
            }
        }
    }
    
    $projectData['assets'] = $assets;
    
    success($projectData, 'Proyecto cargado');
    
} catch (Exception $e) {
    error('Error al obtener proyecto: ' . $e->getMessage(), 500);
}
