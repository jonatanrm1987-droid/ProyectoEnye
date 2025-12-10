<?php
/**
 * Migration Script
 * Migra el proyecto actual (scenes.json + assets) a la nueva estructura
 */

require_once 'api/config.php';

echo "=== MIGRACIÓN DE PROYECTO ===\n\n";

try {
    // 1. Leer scenes.json
    $scenesFile = BASE_PATH . '/scenes.json';
    if (!file_exists($scenesFile)) {
        die("❌ No se encontró scenes.json\n");
    }
    
    echo "✓ Leyendo scenes.json...\n";
    $scenesData = json_decode(file_get_contents($scenesFile), true);
    
    if (!$scenesData) {
        die("❌ Error al parsear scenes.json\n");
    }
    
    // 2. Crear nombre del proyecto
    $projectName = $scenesData['scene_collection']['title'] ?? 'Aventura Interactiva';
    $projectSlug = sanitizeProjectName($projectName);
    $projectPath = PROJECTS_PATH . '/' . $projectSlug;
    
    echo "✓ Nombre del proyecto: $projectName\n";
    echo "✓ Slug: $projectSlug\n\n";
    
    // 3. Crear estructura de carpetas
    if (file_exists($projectPath)) {
        echo "⚠ El proyecto ya existe en: $projectPath\n";
        echo "¿Desea sobrescribir? (s/n): ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        if (trim($line) !== 's') {
            die("Migración cancelada.\n");
        }
    }
    
    echo "✓ Creando estructura de carpetas...\n";
    mkdir($projectPath, 0755, true);
    mkdir($projectPath . '/backgrounds', 0755, true);
    mkdir($projectPath . '/sprites', 0755, true);
    mkdir($projectPath . '/audio', 0755, true);
    
    // 4. Copiar backgrounds
    echo "\n✓ Copiando backgrounds...\n";
    $bgSource = BASE_PATH . '/backgrounds';
    if (is_dir($bgSource)) {
        function copyDirectory($src, $dst) {
            $dir = opendir($src);
            @mkdir($dst, 0755, true);
            while (($file = readdir($dir)) !== false) {
                if ($file != '.' && $file != '..') {
                    if (is_dir($src . '/' . $file)) {
                        copyDirectory($src . '/' . $file, $dst . '/' . $file);
                    } else {
                        copy($src . '/' . $file, $dst . '/' . $file);
                        echo "  - $file\n";
                    }
                }
            }
            closedir($dir);
        }
        copyDirectory($bgSource, $projectPath . '/backgrounds');
    }
    
    // 5. Copiar sprites
    echo "\n✓ Copiando sprites...\n";
    $spritesSource = BASE_PATH . '/sprites';
    if (is_dir($spritesSource)) {
        $sprites = array_diff(scandir($spritesSource), ['.', '..']);
        foreach ($sprites as $sprite) {
            copy($spritesSource . '/' . $sprite, $projectPath . '/sprites/' . $sprite);
            echo "  - $sprite\n";
        }
    }
    
    // 6. Actualizar rutas en scenes.json
    echo "\n✓ Actualizando rutas de assets...\n";
    $updatedData = json_decode(json_encode($scenesData), true);
    
    function updateAssetPaths(&$data, $projectSlug, $path = '') {
        if (is_array($data)) {
            foreach ($data as $key => &$value) {
                if ($key === 'src' && is_string($value)) {
                    // Actualizar ruta
                    $value = 'projects/' . $projectSlug . '/' . $value;
                    echo "  - Actualizada: $value\n";
                } else if (is_array($value) || is_object($value)) {
                    updateAssetPaths($value, $projectSlug, $path . '/' . $key);
                }
            }
        }
    }
    
    updateAssetPaths($updatedData, $projectSlug);
    
    // 7. Agregar metadata
    $updatedData['metadata'] = [
        'id' => generateId(),
        'slug' => $projectSlug,
        'createdAt' => $scenesData['scene_collection']['created'] ?? date('c'),
        'modifiedAt' => date('c'),
        'migratedFrom' => 'scenes.json'
    ];
    
    // 8. Guardar project.json
    echo "\n✓ Guardando project.json...\n";
    file_put_contents(
        $projectPath . '/project.json',
        json_encode($updatedData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
    );
    
    // 9. Crear README
    $readme = "# $projectName\n\n";
    $readme .= "Autor: " . ($scenesData['scene_collection']['author'] ?? 'Desconocido') . "\n";
    $readme .= "Creado: " . ($scenesData['scene_collection']['created'] ?? 'Sin fecha') . "\n";
    $readme .= "Migrado: " . date('Y-m-d H:i:s') . "\n\n";
    $readme .= "## Estructura\n\n";
    $readme .= "- `project.json`: Configuración y escenas\n";
    $readme .= "- `backgrounds/`: Fondos de escenas\n";
    $readme .= "- `sprites/`: Sprites de personajes/objetos\n";
    $readme .= "- `audio/`: Música y efectos de sonido\n";
    file_put_contents($projectPath . '/README.md', $readme);
    
    echo "\n✅ ¡MIGRACIÓN COMPLETADA!\n\n";
    echo "Proyecto migrado a: $projectPath\n";
    echo "- project.json creado\n";
    echo "- Assets copiados\n";
    echo "- Rutas actualizadas\n\n";
    echo "Ahora puedes:\n";
    echo "1. Abrir dashboard.html en tu navegador\n";
    echo "2. El proyecto '$projectName' aparecerá en la lista\n";
    echo "3. Puedes eliminar scenes.json, backgrounds/ y sprites/ antiguos\n\n";
    
} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
