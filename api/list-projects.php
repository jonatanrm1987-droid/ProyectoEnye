<?php
/**
 * List Projects API
 * GET /api/list-projects.php
 * Retorna lista de todos los proyectos disponibles
 */

require_once 'config.php';

try {
    $projects = [];
    
    // Escanear directorio de proyectos
    if (!file_exists(PROJECTS_PATH)) {
        success([], 'No hay proyectos');
    }
    
    $dirs = array_diff(scandir(PROJECTS_PATH), ['.', '..']);
    
    foreach ($dirs as $dir) {
        $projectPath = PROJECTS_PATH . '/' . $dir;
        
        if (!is_dir($projectPath)) continue;
        
        $jsonFile = $projectPath . '/project.json';
        
        if (!file_exists($jsonFile)) continue;
        
        // Leer datos del proyecto
        $jsonContent = file_get_contents($jsonFile);
        $projectData = json_decode($jsonContent, true);
        
        if (!$projectData) continue;
        
        // Información del proyecto
        $projects[] = [
            'id' => $dir,
            'slug' => $dir,
            'name' => $projectData['scene_collection']['title'] ?? 'Sin título',
            'description' => $projectData['scene_collection']['author'] ?? '',
            'createdAt' => $projectData['metadata']['createdAt'] ?? date('c'),
            'modifiedAt' => filemtime($jsonFile) ? date('c', filemtime($jsonFile)) : date('c'),
            'sceneCount' => count($projectData['scene_collection']['scenes'] ?? [])
        ];
    }
    
    success($projects, count($projects) . ' proyectos encontrados');
    
} catch (Exception $e) {
    error('Error al listar proyectos: ' . $e->getMessage(), 500);
}
