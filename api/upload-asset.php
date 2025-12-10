<?php
/**
 * Upload Asset API
 * POST /api/upload-asset.php
 * FormData: projectId, assetType (backgrounds|sprites|audio), file
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Método no permitido', 405);
}

try {
    // Validar parámetros
    if (!isset($_POST['projectId']) || !isset($_POST['assetType'])) {
        error('projectId y assetType son requeridos', 400);
    }
    
    if (!isset($_FILES['file'])) {
        error('No se recibió ningún archivo', 400);
    }
    
    $projectSlug = $_POST['projectId'];
    $assetType = $_POST['assetType'];
    $file = $_FILES['file'];
    
    // Validar tipo de asset
    if (!in_array($assetType, ['backgrounds', 'sprites', 'audio'])) {
        error('Tipo de asset inválido. Use: backgrounds, sprites o audio', 400);
    }
    
    // Validar proyecto
    $projectPath = validateProject($projectSlug);
    $assetPath = $projectPath . '/' . $assetType;
    
    if (!is_dir($assetPath)) {
        mkdir($assetPath, 0755, true);
    }
    
    // Validar errores de upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        error('Error al subir archivo: ' . $file['error'], 400);
    }
    
    // Validar tamaño
    if ($file['size'] > MAX_FILE_SIZE) {
        error('Archivo demasiado grande. Máximo: ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB', 400);
    }
    
    // Validar tipo MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedTypes = ($assetType === 'audio') ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
    
    if (!in_array($mimeType, $allowedTypes)) {
        error('Tipo de archivo no permitido: ' . $mimeType, 400);
    }
    
    // Sanitizar nombre de archivo
    $originalName = $file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
    
    // Generar nombre único si ya existe
    $fileName = $safeName . '.' . $extension;
    $counter = 1;
    while (file_exists($assetPath . '/' . $fileName)) {
        $fileName = $safeName . '_' . $counter . '.' . $extension;
        $counter++;
    }
    
    $destinationPath = $assetPath . '/' . $fileName;
    
    // Mover archivo
    if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
        error('Error al guardar archivo', 500);
    }
    
    // Información del archivo guardado
    $fileInfo = [
        'name' => $fileName,
        'originalName' => $originalName,
        'path' => 'projects/' . $projectSlug . '/' . $assetType . '/' . $fileName,
        'type' => $mimeType,
        'size' => filesize($destinationPath)
    ];
    
    // Si es imagen, obtener dimensiones
    if (in_array($mimeType, ALLOWED_IMAGE_TYPES)) {
        $imageInfo = getimagesize($destinationPath);
        if ($imageInfo) {
            $fileInfo['width'] = $imageInfo[0];
            $fileInfo['height'] = $imageInfo[1];
        }
    }
    
    success($fileInfo, 'Archivo subido exitosamente');
    
} catch (Exception $e) {
    error('Error al subir archivo: ' . $e->getMessage(), 500);
}
