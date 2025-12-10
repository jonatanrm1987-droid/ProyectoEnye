<?php
/**
 * Create Project API
 * POST /api/create-project.php
 * Body: { "name": "Mi Proyecto", "description": "Descripción" }
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Método no permitido', 405);
}

try {
    // Leer datos del body
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name'])) {
        error('Nombre de proyecto requerido', 400);
    }
    
    $projectName = trim($input['name']);
    $projectDescription = $input['description'] ?? '';
    
    if (empty($projectName)) {
        error('El nombre no puede estar vacío', 400);
    }
    
    // Generar slug único
    $slug = sanitizeProjectName($projectName);
    $projectPath = PROJECTS_PATH . '/' . $slug;
    
    // Verificar si ya existe
    if (file_exists($projectPath)) {
        // Agregar sufijo numérico
        $counter = 1;
        while (file_exists(PROJECTS_PATH . '/' . $slug . '-' . $counter)) {
            $counter++;
        }
        $slug = $slug . '-' . $counter;
        $projectPath = PROJECTS_PATH . '/' . $slug;
    }
    
    // Crear estructura de carpetas
    mkdir($projectPath, 0755, true);
    mkdir($projectPath . '/backgrounds', 0755, true);
    mkdir($projectPath . '/sprites', 0755, true);
    mkdir($projectPath . '/audio', 0755, true);
    
    // Crear project.json inicial
    $projectData = [
        'metadata' => [
            'id' => generateId(),
            'slug' => $slug,
            'createdAt' => date('c'),
            'modifiedAt' => date('c')
        ],
        'scene_collection' => [
            'title' => $projectName,
            'author' => '',
            'created' => date('Y-m-d'),
            'start_scene' => 'scene1',
            'scenes' => [
                'scene1' => [
                    'id' => 'scene1',
                    'title' => 'Escena Inicial',
                    'background-color' => '#000000',
                    'background-images' => [],
                    'content' => [
                        'heading' => '',
                        'text' => '',
                        'layout' => 'center'
                    ],
                    'sprites' => [],
                    'actions' => [],
                    'time_events' => []
                ]
            ]
        ],
        'settings' => [
            'screen' => [
                'width' => 1920,
                'height' => 1080
            ],
            'defaultTransitionDuration' => 800
        ]
    ];
    
    // Guardar JSON
    file_put_contents(
        $projectPath . '/project.json',
        json_encode($projectData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
    );
    
    // Crear README
    $readme = "# {$projectName}\n\n";
    $readme .= "{$projectDescription}\n\n";
    $readme .= "Creado: " . date('Y-m-d H:i:s') . "\n";
    file_put_contents($projectPath . '/README.md', $readme);
    
    success([
        'id' => $slug,
        'slug' => $slug,
        'name' => $projectName,
        'description' => $projectDescription,
        'path' => 'projects/' . $slug
    ], 'Proyecto creado exitosamente');
    
} catch (Exception $e) {
    error('Error al crear proyecto: ' . $e->getMessage(), 500);
}
