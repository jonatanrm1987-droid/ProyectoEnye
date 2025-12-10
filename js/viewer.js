/* ===================================
   PROYECTOENYE - VIEWER
   Sistema de reproducción de aventuras
   Versión: 1.0.0
   =================================== */

$(document).ready(function() {
    let gameData = null;
    let currentSceneId = null;
    let activeTimeouts = [];

    // Load the JSON data
    $.getJSON('scenes.json', function(data) {
        gameData = data;
        logger.info('GameLoader', 'Datos de juego cargados correctamente');
        initGame();
    }).fail(function() {
        logger.error('GameLoader', 'No se pudo cargar scenes.json');
        $('#loading').text('Error al cargar scenes.json');
    });

    function initGame() {
        $('#loading').remove();
        if (gameData.scene_collection && gameData.scene_collection.start_scene) {
            loadScene(gameData.scene_collection.start_scene);
        } else {
            alert('No se encontró la escena inicial.');
        }
    }

    function clearScene() {
        $('#scene-container').empty();
        // Clear any pending time events
        activeTimeouts.forEach(timeout => clearTimeout(timeout));
        activeTimeouts = [];
    }

    function loadScene(sceneId) {
        clearScene();
        currentSceneId = sceneId;
        
        // Handle string/number mismatch for keys
        const scene = gameData.scene_collection.scenes[sceneId];
        
        if (!ErrorHandler.validateScene(scene, sceneId)) {
            return;
        }
        
        logger.info('SceneLoader', `Cargando escena ${sceneId}: ${scene.title}`);

        const $container = $('#scene-container');

        // 1. Background Color
        if (scene['background-color']) {
            $container.css('background-color', scene['background-color']);
        }

        // 2. Background Images
        if (scene['background-images']) {
            $.each(scene['background-images'], function(key, bg) {
                const $bgLayer = $('<div class="background-layer"></div>');
                $bgLayer.css('background-image', `url(${bg.src})`);
                
                if (bg.opacity) {
                    $bgLayer.css('opacity', bg.opacity);
                }
                
                // Handle fill/size
                if (bg.fill === 'stretch') {
                    $bgLayer.css('background-size', '100% 100%');
                } else {
                    $bgLayer.css('background-size', 'cover');
                }

                $container.append($bgLayer);
            });
        }

        // 3. Sprites
        if (scene.sprites) {
            $.each(scene.sprites, function(key, spriteData) {
                const $sprite = $('<img class="sprite">');
                $sprite.attr('src', spriteData.src);
                $sprite.attr('id', 'sprite-' + key); // ID for targeting
                
                // Initial position (default to position "1")
                const initialPos = spriteData.positions["1"];
                if (initialPos) {
                    $sprite.css({
                        left: initialPos.x,
                        top: initialPos.y,
                        width: spriteData.size
                    });
                }

                $container.append($sprite);
            });
        }

        // 4. Content (Text)
        if (scene.content) {
            const $content = $('<div class="content-overlay"></div>');
            
            if (scene.content.heading) {
                $content.append(`<h1>${scene.content.heading}</h1>`);
            }
            if (scene.content.text) {
                $content.append(`<p>${scene.content.text}</p>`);
            }

            if (scene.content.layout === 'center') {
                $content.addClass('content-center');
            }
            // Add other layouts as needed

            $container.append($content);
        }

        // 5. Actions (Buttons & Time Events)
        if (scene.actions) {
            scene.actions.forEach(function(action) {
                if (action.type === 'button') {
                    const $btn = $('<button class="action-button"></button>');
                    $btn.text(action.label);
                    
                    if (action.position) {
                        $btn.css({
                            top: action.position.top,
                            left: action.position.left
                        });
                    }

                    $btn.on('click', function() {
                        executeAction(action);
                    });

                    $container.append($btn);
                } else if (action.type === 'time-event') {
                    const timeoutId = setTimeout(function() {
                        executeAction(action);
                    }, action.delay);
                    activeTimeouts.push(timeoutId);
                }
            });
        }
    }

    function executeAction(action) {
        // Check if target is a scene change (number) or sprite manipulation (string)
        // Note: JSON target might be string "2" for scene 2, so we need to be careful.
        // Based on the provided JSON, sprite targets look like "sprites1" and scene targets look like 2 (int).
        
        if (typeof action.target === 'number') {
            // Change Scene
            loadScene(action.target);
        } else if (typeof action.target === 'string') {
            // Check if it's a sprite target
            if (action.target.startsWith('sprites')) {
                // Extract sprite ID. Assuming "sprites1" -> "1"
                const spriteId = action.target.replace('sprites', '');
                const nextPosId = action['next-position'];
                
                // Find the sprite element
                const $sprite = $('#sprite-' + spriteId);
                
                // Find the new position data from the current scene data
                const currentScene = gameData.scene_collection.scenes[currentSceneId];
                if (currentScene && currentScene.sprites && currentScene.sprites[spriteId]) {
                    const newPos = currentScene.sprites[spriteId].positions[nextPosId];
                    if (newPos) {
                        $sprite.css({
                            left: newPos.x,
                            top: newPos.y
                        });
                    }
                }
            } else {
                // Fallback: try to load it as a scene ID if it's a string but not a sprite
                // (e.g. "2")
                loadScene(action.target);
            }
        }
    }
});
