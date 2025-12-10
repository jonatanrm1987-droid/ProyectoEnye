<?php
/**
 * Save Project API
 * POST /api/save-project.php
 * Body: { "projectId": "slug", "data": {...} }
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Método no permitido', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['projectId']) || !isset($input['data'])) {
        error('projectId y data son requeridos', 400);
    }
    
    $projectSlug = $input['projectId'];
    $projectData = $input['data'];
    
    // Validar proyecto
    $projectPath = validateProject($projectSlug);
    $jsonFile = $projectPath . '/project.json';
    
    // Actualizar timestamp
    if (!isset($projectData['metadata'])) {
        $projectData['metadata'] = [];
    }
    $projectData['metadata']['modifiedAt'] = date('c');
    
    // Hacer backup del archivo anterior
    if (file_exists($jsonFile)) {
        $backupFile = $projectPath . '/project.backup.json';
        copy($jsonFile, $backupFile);
    }
    
    // Guardar nuevo JSON
    $result = file_put_contents(
        $jsonFile,
        json_encode($projectData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
    );
    
    if ($result === false) {
        error('Error al guardar archivo', 500);
    }
    
    success([
        'projectId' => $projectSlug,
        'size' => $result,
        'timestamp' => date('c')
    ], 'Proyecto guardado exitosamente');
    
} catch (Exception $e) {
    error('Error al guardar proyecto: ' . $e->getMessage(), 500);
}
