/* ===================================
   PROYECTOENYE - EDITOR
   Sistema de edición visual (Dashboard)
   Versión: 1.0.0
   =================================== */

let gameData = {
    scene_collection: {
        title: "Nueva Aventura",
        start_scene: 1,
        scenes: {}
    },
    settings: { defaultTransitionDuration: 800 }
};

let currentSceneId = null;
let selectedSpriteId = null;
let selectedActionIndex = null;
let currentProjectId = null;

$(document).ready(async function() {
    // Cargar proyecto activo o mostrar gestión
    loadActiveProject();
    
    // Eventos de gestión de proyectos
    $('#btn-manage-projects').click(showProjectManager);
    $('#new-project-form').submit(handleCreateProject);
    
    // Cargar lista de proyectos al abrir modal
    $('#btn-manage-projects').click(function() {
        refreshProjectList();
        $('#project-modal').show();
    });    // --- Scene Management ---
    function refreshSceneList() {
        const $sel = $('#scene-selector');
        $sel.empty();
        $.each(gameData.scene_collection.scenes, function(id, scene) {
            $sel.append(`<option value="${id}">${id}: ${scene.title}</option>`);
        });
    }

    $('#btn-add-scene').click(createScene);
    $('#btn-delete-scene').click(deleteScene);

    function createScene() {
        const newId = Object.keys(gameData.scene_collection.scenes).length + 1;
        gameData.scene_collection.scenes[newId] = {
            id: newId,
            title: "Nueva Escena",
            "background-color": "#000000",
            content: { heading: "", text: "", layout: "center" },
            sprites: {},
            actions: []
        };
        logger.info('SceneManager', `Nueva escena creada: ${newId}`);
        refreshSceneList();
        loadScene(newId);
    }

    function deleteScene() {
        if (!currentSceneId) {
            showWarning('Selecciona una escena primero');
            return;
        }

        const sceneCount = Object.keys(gameData.scene_collection.scenes).length;
        if (sceneCount <= 1) {
            showError('No puedes eliminar la única escena del proyecto');
            return;
        }

        const sceneName = gameData.scene_collection.scenes[currentSceneId].title;
        
        if (confirm(`¿Estás seguro de eliminar la escena "${sceneName}"? Esta acción no se puede deshacer.`)) {
            delete gameData.scene_collection.scenes[currentSceneId];
            
            // Si es la escena inicial, cambiar a la primera disponible
            if (gameData.scene_collection.start_scene == currentSceneId) {
                const firstSceneId = Object.keys(gameData.scene_collection.scenes)[0];
                gameData.scene_collection.start_scene = firstSceneId;
            }
            
            logger.info('SceneManager', `Escena eliminada: ${currentSceneId}`);
            showSuccess(`Escena "${sceneName}" eliminada`);
            
            refreshSceneList();
            
            // Cargar la primera escena disponible
            const nextSceneId = Object.keys(gameData.scene_collection.scenes)[0];
            loadScene(nextSceneId);
        }
    }

    $('#scene-selector').change(function() {
        loadScene($(this).val());
    });

    // Bind Scene Properties inputs
    $('#scene-title').on('input', function() {
        if(!currentSceneId) return;
        gameData.scene_collection.scenes[currentSceneId].title = $(this).val();
        $(`#scene-selector option[value="${currentSceneId}"]`).text(`${currentSceneId}: ${$(this).val()}`);
    });
    $('#scene-bg-color').on('input', function() {
        if(!currentSceneId) return;
        const color = $(this).val();
        gameData.scene_collection.scenes[currentSceneId]["background-color"] = color;
        $('#stage-container').css('background-color', color);
    });
    $('#scene-text').on('input', function() {
        if(!currentSceneId) return;
        gameData.scene_collection.scenes[currentSceneId].content.text = $(this).val();
        renderContentOverlay();
    });
    $('#scene-layout').change(function() {
        if(!currentSceneId) return;
        gameData.scene_collection.scenes[currentSceneId].content.layout = $(this).val();
        renderContentOverlay();
    });


    // --- Main Loading Logic ---
    function loadScene(sceneId) {
        currentSceneId = sceneId;
        selectedSpriteId = null;
        selectedActionIndex = null;
        
        const scene = gameData.scene_collection.scenes[sceneId];
        
        // Update UI Inputs
        $('#scene-properties').show();
        $('#scene-id').val(scene.id);
        $('#scene-title').val(scene.title);
        $('#scene-bg-color').val(scene["background-color"] || "#000000");
        $('#scene-text').val(scene.content ? scene.content.text : "");
        $('#scene-layout').val(scene.content ? scene.content.layout : "center");

        // Render Stage
        renderStage(scene);
        
        // Update Lists
        refreshBackgroundList();
        refreshSpriteList();
        refreshActionList();
        
        // Highlight in selector
        $('#scene-selector').val(sceneId);
    }

    // Aplicar efectos y animaciones a fondos
    function applyBackgroundEffect($element, effect) {
        const duration = effect.duration || 1;
        const delay = effect.delay || 0;
        const easing = effect.easing || 'ease';
        const loop = effect.loop || false;
        
        // Añadir clase para el tipo de efecto
        $element.addClass(`effect-${effect.type}`);
        
        // Manejar Loop Infinito
        if (effect.type === 'loop') {
            const direction = effect.direction || 'left';
            const loopDuration = effect.duration || 30;
            const distance = effect.distance || 'medium';
            
            // Configurar background-repeat para loop
            $element.css('background-repeat', 'repeat');
            
            // Aplicar animación según dirección
            $element.css({
                'animation-name': `bg-loop-${direction}`,
                'animation-duration': `${loopDuration}s`,
                'animation-timing-function': 'linear',
                'animation-iteration-count': 'infinite'
            });
            
            return; // Salir, no aplicar animaciones genéricas
        }
        
        // Para parallax, añadir atributos especiales
        if (effect.type === 'parallax') {
            $element.attr('data-parallax-speed', effect.speed || 0.5);
            $element.attr('data-parallax-direction', effect.direction || 'vertical');
            return; // Parallax se maneja con JS, no CSS animations
        }
        
        // CSS para animaciones estándar (fade, slide, zoom)
        const animationName = `bg-effect-${effect.type}`;
        $element.css({
            'animation-name': animationName,
            'animation-duration': `${duration}s`,
            'animation-delay': `${delay}s`,
            'animation-timing-function': easing,
            'animation-iteration-count': loop ? 'infinite' : '1',
            'animation-fill-mode': 'forwards'
        });
    }
    
    // Habilitar preview de parallax con movimiento del mouse
    function enableParallaxPreview($stage) {
        // Remover listener previo si existe
        $stage.off('mousemove.parallax');
        
        // Añadir nuevo listener
        $stage.on('mousemove.parallax', function(e) {
            const stageWidth = $stage.width();
            const stageHeight = $stage.height();
            const mouseX = e.pageX - $stage.offset().left;
            const mouseY = e.pageY - $stage.offset().top;
            
            // Normalizar posición del mouse (-1 a 1)
            const normalizedX = (mouseX / stageWidth) * 2 - 1;
            const normalizedY = (mouseY / stageHeight) * 2 - 1;
            
            // Aplicar parallax a capas con efecto parallax
            $('.background-layer[data-parallax-speed]').each(function() {
                const $layer = $(this);
                const speed = parseFloat($layer.attr('data-parallax-speed')) || 0.5;
                const direction = $layer.attr('data-parallax-direction') || 'vertical';
                
                let offsetX = 0;
                let offsetY = 0;
                
                // Calcular offset según dirección
                if (direction === 'horizontal') {
                    offsetX = normalizedX * 50 * speed;
                } else if (direction === 'vertical') {
                    offsetY = normalizedY * 50 * speed;
                } else if (direction === 'both') {
                    offsetX = normalizedX * 50 * speed;
                    offsetY = normalizedY * 50 * speed;
                }
                
                // Aplicar transformación
                $layer.css('transform', `translate(${offsetX}px, ${offsetY}px)`);
            });
        });
    }

    function renderStage(scene) {
        const $stage = $('#stage-container');
        $stage.empty();
        $stage.css('background-color', scene["background-color"] || "#000");

        // Background Images
        if (scene["background-images"]) {
            $.each(scene["background-images"], function(k, bg) {
                if (!bg || !bg.src) return; // Skip invalid backgrounds
                const $bg = $('<div class="background-layer"></div>');
                $bg.css('background-image', `url(${bg.src})`);
                $bg.attr('data-bg-id', k);
                
                // Posición
                if (bg.position) {
                    $bg.css('background-position', `${bg.position.x} ${bg.position.y}`);
                }
                
                // Opacidad
                if (bg.opacity !== undefined) {
                    $bg.css('opacity', bg.opacity);
                }
                
                // Tamaño del fondo
                const sizeMode = bg.size || bg.fill || 'cover'; // Compatibilidad con fill antiguo
                if (sizeMode === 'stretch') {
                    $bg.css('background-size', '100% 100%');
                } else if (sizeMode === 'auto') {
                    $bg.css('background-size', 'auto');
                } else {
                    $bg.css('background-size', sizeMode); // cover o contain
                }
                
                // Repetición del fondo
                const repeatMode = bg.repeat || 'no-repeat';
                $bg.css('background-repeat', repeatMode);
                
                // Aplicar efectos/animaciones
                if (bg.effect && bg.effect.type !== 'none') {
                    applyBackgroundEffect($bg, bg.effect);
                }
                
                // --- Dependencias de animación ---
                if (bg.dependency) {
                    $bg.attr('data-dependency', bg.dependency);
                    $bg.attr('data-dependency-type', bg.dependencyType || 'onstart');
                }
                
                $stage.append($bg);
            });
            
            // Activar preview de parallax con movimiento del mouse
            enableParallaxPreview($stage);
        }

        // Sprites
        if (scene.sprites) {
            $.each(scene.sprites, function(key, sprite) {
                if (!sprite || !sprite.src) return; // Skip invalid sprites
                const $el = $('<img class="sprite">');
                $el.attr('src', sprite.src);
                $el.attr('data-id', key);
                
                // Default to position 1 for preview
                const pos = sprite.positions && sprite.positions["1"] ? sprite.positions["1"] : {x: "50%", y: "50%"};
                $el.css({ left: pos.x, top: pos.y, width: sprite.size || "10%" });

                // Make Draggable
                $el.draggable({
                    containment: "parent",
                    stop: function(event, ui) {
                        // Just visual update, saving is manual
                        selectSprite(key);
                    }
                });

                $el.click(function(e) {
                    e.stopPropagation();
                    selectSprite(key);
                });

                $stage.append($el);
            });
        }

        // Buttons
        if (scene.actions) {
            scene.actions.forEach((action, index) => {
                if (action.type === 'button') {
                    const $btn = $('<button class="action-button"></button>');
                    $btn.text(action.label);
                    $btn.attr('data-index', index);
                    
                    const pos = action.position || {top: "50%", left: "50%"};
                    $btn.css({ top: pos.top, left: pos.left });

                    $btn.draggable({
                        containment: "parent",
                        stop: function(event, ui) {
                            // Auto-save button position
                            const parentWidth = $stage.width();
                            const parentHeight = $stage.height();
                            const leftPerc = Math.round((ui.position.left / parentWidth) * 100) + "%";
                            const topPerc = Math.round((ui.position.top / parentHeight) * 100) + "%";
                            
                            gameData.scene_collection.scenes[currentSceneId].actions[index].position = {
                                top: topPerc,
                                left: leftPerc
                            };
                            selectAction(index);
                        }
                    });

                    $btn.click(function(e) {
                        e.stopPropagation();
                        selectAction(index);
                    });

                    $stage.append($btn);
                }
            });
        }

        renderContentOverlay();
        
        // --- Sincronización de animaciones entre capas ---
        function syncBackgroundDependencies() {
            const $layers = $('.background-layer');
            $layers.each(function() {
                const $layer = $(this);
                const dep = $layer.attr('data-dependency');
                const depType = $layer.attr('data-dependency-type');
                if (dep) {
                    const $depLayer = $(`.background-layer[data-bg-id='${dep}']`);
                    if ($depLayer.length) {
                        // Escuchar animación de la capa dependiente
                        if (depType === 'onstart') {
                            $depLayer.on('animationstart', function handler() {
                                $layer[0].style.animationPlayState = '';
                                $depLayer.off('animationstart', handler);
                            });
                            $layer[0].style.animationPlayState = 'paused';
                        } else if (depType === 'onend') {
                            $depLayer.on('animationend', function handler() {
                                $layer[0].style.animationPlayState = '';
                                $depLayer.off('animationend', handler);
                            });
                            $layer[0].style.animationPlayState = 'paused';
                        } else if (depType === 'sync') {
                            // Sincronizar movimiento: igualar tiempo y playstate
                            const syncAnim = () => {
                                $layer[0].style.animationDuration = getComputedStyle($depLayer[0]).animationDuration;
                                $layer[0].style.animationPlayState = getComputedStyle($depLayer[0]).animationPlayState;
                            };
                            syncAnim();
                            $depLayer.on('animationstart animationend', syncAnim);
                        }
                    }
                }
            });
        }

        // Llamar después de renderizar stage
        $(document).on('renderStageDone', syncBackgroundDependencies);
        
        // Lanzar evento para sincronización de dependencias
        $(document).trigger('renderStageDone');
    }

    function renderContentOverlay() {
        $('.content-overlay').remove();
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene.content) return;

        const $overlay = $('<div class="content-overlay"></div>');
        if (scene.content.heading) $overlay.append(`<h1>${scene.content.heading}</h1>`);
        if (scene.content.text) $overlay.append(`<p>${scene.content.text}</p>`);
        
        if (scene.content.layout === 'center') $overlay.addClass('content-center');
        else if (scene.content.layout === 'top') $overlay.addClass('content-top');
        else if (scene.content.layout === 'bottom') $overlay.addClass('content-bottom');

        $('#stage-container').append($overlay);
    }

    // --- Background Management ---
    function refreshBackgroundList() {
        const $list = $('#background-list');
        
        // Destruir sortable si ya existe
        if ($list.hasClass('ui-sortable')) {
            $list.sortable('destroy');
        }
        
        $list.empty();
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene || !scene['background-images']) return;

        $.each(scene['background-images'], function(key, bg) {
            if (!bg) return;
            const displayName = bg.name || (bg.src ? bg.src.split('/').pop() : 'Sin nombre');
            const $item = $(`
                <div class="list-item bg-layer-item" data-key="${key}" style="padding: 5px; margin: 2px 0; background: #f8f9fa; border-radius: 3px; user-select: none; cursor: move;">
                    <span class="bg-handle" style="user-select: none;">🖼️ ${displayName}</span>
                </div>
            `);
            
            // Click para seleccionar
            $item.click(function(e) {
                e.stopPropagation();
                // Quitar selección previa
                $('.bg-layer-item').removeClass('selected');
                $item.addClass('selected');
                selectedBackgroundId = key;
                selectBackground(key);
            });
            
            $list.append($item);
        });

        // Hacer la lista sortable (drag and drop)
        $list.sortable({
            axis: 'y',
            cursor: 'move',
            placeholder: 'ui-sortable-placeholder',
            tolerance: 'pointer',
            update: function(event, ui) {
                reorderBackgrounds();
            }
        });
    }

    function reorderBackgrounds() {
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene || !scene['background-images']) return;

        console.log('Reordenando fondos...');

        // Obtener el nuevo orden basado en la posición visual
        const newOrder = {};
        let index = 0;
        $('#background-list .bg-layer-item').each(function() {
            const key = $(this).data('key');
            const bg = scene['background-images'][key];
            if (bg) {
                newOrder[index] = bg;
                console.log(`Fondo "${bg.name || 'sin nombre'}" movido de key ${key} a index ${index}`);
                index++;
            }
        });

        // Actualizar el objeto con el nuevo orden
        scene['background-images'] = newOrder;
        
        // Re-renderizar el stage para aplicar el nuevo orden
        renderStage(scene);
        
        // Refrescar la lista para actualizar los data-key
        refreshBackgroundList();
        
        // Guardar cambios
        showInfo('Orden de capas actualizado');
        
        // Trigger auto-save si está disponible
        if (typeof autoSave !== 'undefined' && autoSave.saveData) {
            autoSave.saveData();
        }
    }

    $('#btn-add-background').click(function() {
        if (!currentSceneId) {
            showWarning('Selecciona una escena primero');
            return;
        }
        $('#background-file-input').click();
    });

    $('#btn-delete-background').click(function() {
        if (!currentSceneId) {
            showWarning('Selecciona una escena primero');
            return;
        }
        if (!selectedBackgroundId && selectedBackgroundId !== 0) {
            showWarning('Selecciona un fondo de la lista primero');
            return;
        }
        deleteBackground(selectedBackgroundId);
        selectedBackgroundId = null;
    });

    $('#background-file-input').change(async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!currentProjectId) {
            showError('No hay proyecto activo');
            return;
        }

        const bgName = prompt('Nombre del fondo:', file.name.replace(/\.[^/.]+$/, ''));
        if (!bgName) {
            $(this).val('');
            return;
        }

        try {
            showInfo('Subiendo fondo...');
            const result = await projectManager.uploadAsset(currentProjectId, 'backgrounds', file);
            
            // Agregar a la escena
            const scene = gameData.scene_collection.scenes[currentSceneId];
            if (!scene['background-images']) {
                scene['background-images'] = {};
            }

            const newKey = Object.keys(scene['background-images']).length + 1;
            scene['background-images'][newKey] = {
                name: bgName,
                src: result.path,
                position: 'center',
                fill: 'cover',
                opacity: 1
            };

            showSuccess('Fondo agregado');
            refreshBackgroundList();
            renderStage(scene);

            // Limpiar input
            $(this).val('');
        } catch (error) {
            showError('Error al subir fondo: ' + error.message);
            logger.error('BackgroundUpload', error);
        }
    });

    function deleteBackground(key) {
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene['background-images'] || !scene['background-images'][key]) return;

        if (confirm('¿Eliminar este fondo de la escena?')) {
            delete scene['background-images'][key];
            showSuccess('Fondo eliminado');
            $('#background-properties').hide();
            refreshBackgroundList();
            renderStage(scene);
        }
    }

    let selectedBackgroundId = null;

    // Modificar refreshBackgroundList para hacer los fondos seleccionables
    function selectBackground(key) {
        selectedBackgroundId = key;
        $('#background-properties').show();
        $('#sprite-properties').hide();
        $('#action-properties').hide();

        const scene = gameData.scene_collection.scenes[currentSceneId];
        const bg = scene['background-images'][key];
        
        // Propiedades básicas
        $('#background-name').val(bg.name || '');
        $('#background-src').val(bg.src || '');
        $('#bg-size').val(bg.size || bg.fill || 'cover'); // Compatibilidad con fill antiguo
        $('#bg-repeat').val(bg.repeat || 'no-repeat');
        
        // Determinar tipo de efecto
        const effect = bg.effect || {};
        const effectType = effect.type || 'static';
        $('#bg-effect-type').val(effectType);
        
        // Cargar opciones específicas según el tipo
        loadEffectOptions(effectType, effect);
        
        // Mostrar/ocultar paneles
        toggleEffectOptions();

        // --- Dependencia de capa ---
        // Rellenar selector de dependencias
        const $depSelect = $('#bg-dependency');
        $depSelect.empty();
        const fondos = Object.entries(scene['background-images']).filter(([depKey, depBg]) => depBg && depKey != key);
        $depSelect.append('<option value="">Sin dependencia</option>');
        if (fondos.length > 0) {
            fondos.forEach(([depKey, depBg]) => {
                const name = depBg.name || (depBg.src ? depBg.src.split('/').pop() : 'Fondo ' + depKey);
                $depSelect.append(`<option value="${depKey}">${name}</option>`);
            });
        }
        // Seleccionar si ya hay dependencia
        $depSelect.val(bg.dependency || '');
        // Mostrar tipo de dependencia si aplica
        if (bg.dependency) {
            $('#bg-dependency-type-container').show();
            $('#bg-dependency-type').val(bg.dependencyType || 'onstart');
        } else {
            $('#bg-dependency-type-container').hide();
        }

        // Mostrar/ocultar tipo según selección
        $depSelect.off('change').on('change', function() {
            if ($(this).val()) {
                $('#bg-dependency-type-container').show();
            } else {
                $('#bg-dependency-type-container').hide();
            }
        });
        
        // Disparar evento de selección de fondo
        $(document).trigger('backgroundSelected', [bg]);
    }
    
    function loadEffectOptions(type, effect) {
        switch(type) {
            case 'static':
                $('#static-pos-x').val(effect.position?.x || 'center');
                $('#static-pos-y').val(effect.position?.y || 'center');
                $('#static-opacity').val(effect.opacity || 1);
                $('#static-opacity-value').text(Math.round((effect.opacity || 1) * 100) + '%');
                break;
                
            case 'fade-in':
            case 'fade-out':
                $('#fade-opacity-start').val(effect.opacityStart || 0);
                $('#fade-opacity-start-value').text(Math.round((effect.opacityStart || 0) * 100) + '%');
                $('#fade-opacity-end').val(effect.opacityEnd || 1);
                $('#fade-opacity-end-value').text(Math.round((effect.opacityEnd || 1) * 100) + '%');
                $('#fade-duration').val(effect.duration || 1);
                $('#fade-delay').val(effect.delay || 0);
                $('#fade-easing').val(effect.easing || 'ease');
                break;
                
            case 'slide':
                $('#slide-start-x').val(effect.startPosition?.x || '-100%');
                $('#slide-start-y').val(effect.startPosition?.y || '0%');
                $('#slide-end-x').val(effect.endPosition?.x || '0%');
                $('#slide-end-y').val(effect.endPosition?.y || '0%');
                $('#slide-duration').val(effect.duration || 1);
                $('#slide-delay').val(effect.delay || 0);
                $('#slide-easing').val(effect.easing || 'ease');
                break;
                
            case 'zoom-in':
            case 'zoom-out':
                $('#zoom-scale-start').val(effect.scaleStart || 0);
                $('#zoom-scale-start-value').text((effect.scaleStart || 0) + 'x');
                $('#zoom-scale-end').val(effect.scaleEnd || 1);
                $('#zoom-scale-end-value').text((effect.scaleEnd || 1) + 'x');
                $('#zoom-origin').val(effect.origin || 'center');
                $('#zoom-duration').val(effect.duration || 1);
                $('#zoom-delay').val(effect.delay || 0);
                $('#zoom-easing').val(effect.easing || 'ease');
                break;
                
            case 'loop':
                $('#loop-direction').val(effect.direction || 'left');
                $('#loop-duration').val(effect.duration || 30);
                $('#loop-distance').val(effect.distance || 'medium');
                break;
                
            case 'parallax':
                $('#parallax-speed').val(effect.speed || 0.5);
                $('#parallax-speed-value').text((effect.speed || 0.5) + 'x');
                $('#parallax-direction').val(effect.direction || 'vertical');
                break;
        }
    }
    
    // Mostrar/ocultar opciones según el tipo de efecto
    function toggleEffectOptions() {
        const effectType = $('#bg-effect-type').val();
        
        // Ocultar todas las opciones primero
        $('.effect-options').hide();
        
        // Mostrar solo la sección relevante
        switch(effectType) {
            case 'static':
                $('#static-options').show();
                break;
            case 'fade-in':
            case 'fade-out':
                $('#fade-options').show();
                break;
            case 'slide':
                $('#slide-options').show();
                break;
            case 'zoom-in':
            case 'zoom-out':
                $('#zoom-options').show();
                break;
            case 'loop':
                $('#loop-options').show();
                break;
            case 'parallax':
                $('#parallax-options').show();
                break;
        }
    }
    
    // Event listeners para cambio de tipo
    $('#bg-effect-type').change(function() {
        toggleEffectOptions();
        
        // Si se cambia a loop, aplicar preview inmediatamente
        if ($(this).val() === 'loop') {
            setTimeout(applyLoopPreview, 100);
        }
    });
    
    // Event listeners para sliders con valores dinámicos y preview en tiempo real
    $('#static-opacity').on('input', function() {
        const opacity = $(this).val();
        $('#static-opacity-value').text(Math.round(opacity * 100) + '%');
        
        // Preview en tiempo real
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
        }
    });
    
    // Preview en tiempo real para posición estática
    $('#static-pos-x, #static-pos-y').on('change', function() {
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const posX = $('#static-pos-x').val() || 'center';
            const posY = $('#static-pos-y').val() || 'center';
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('background-position', `${posX} ${posY}`);
            showInfo('Posición actualizada: ' + posX + ' ' + posY);
        }
    });
    
    $('#fade-opacity-start').on('input', function() {
        const opacity = $(this).val();
        $('#fade-opacity-start-value').text(Math.round(opacity * 100) + '%');
        
        // Preview: mostrar opacidad inicial
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
            showInfo('Vista previa: Opacidad inicial ' + Math.round(opacity * 100) + '%');
        }
    });
    
    $('#fade-opacity-end').on('input', function() {
        const opacity = $(this).val();
        $('#fade-opacity-end-value').text(Math.round(opacity * 100) + '%');
        
        // Preview: mostrar opacidad final
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
            showInfo('Vista previa: Opacidad final ' + Math.round(opacity * 100) + '%');
        }
    });
    
    $('#zoom-scale-start').on('input', function() {
        const scale = $(this).val();
        $('#zoom-scale-start-value').text(scale + 'x');
        
        // Preview: mostrar escala inicial
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            const origin = $('#zoom-origin').val() || 'center';
            $bgLayer.css({
                'transform': `scale(${scale})`,
                'transform-origin': origin
            });
            showInfo('Vista previa: Escala inicial ' + scale + 'x');
        }
    });
    
    $('#zoom-scale-end').on('input', function() {
        const scale = $(this).val();
        $('#zoom-scale-end-value').text(scale + 'x');
        
        // Preview: mostrar escala final
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            const origin = $('#zoom-origin').val() || 'center';
            $bgLayer.css({
                'transform': `scale(${scale})`,
                'transform-origin': origin
            });
            showInfo('Vista previa: Escala final ' + scale + 'x');
        }
    });
    
    // Preview cuando cambia el punto de origen del zoom
    $('#zoom-origin').on('change', function() {
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const origin = $(this).val();
            const scale = $('#zoom-scale-end').val() || 1;
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css({
                'transform': `scale(${scale})`,
                'transform-origin': origin
            });
            showInfo('Punto de origen: ' + origin);
        }
    });
    
    // Sistema de picking de posiciones para Slide
    let pickingPosition = null; // 'start' o 'end'
    let positionMarker = null;
    
    function startPickingPosition(type) {
        pickingPosition = type;
        const $stage = $('#stage-container');
        
        // Cambiar cursor
        $stage.css('cursor', 'crosshair');
        
        // Mostrar overlay de ayuda
        if (!positionMarker) {
            positionMarker = $('<div id="position-marker"></div>').css({
                position: 'absolute',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '3px solid #007bff',
                background: 'rgba(0, 123, 255, 0.3)',
                pointerEvents: 'none',
                display: 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999
            });
            $stage.append(positionMarker);
        }
        
        showInfo(`Click en el stage para posición ${type === 'start' ? 'inicial' : 'final'}`);
    }
    
    // Mover marcador con el mouse
    $('#stage-container').on('mousemove.positionPicker', function(e) {
        if (!pickingPosition || !positionMarker) return;
        
        const offset = $(this).offset();
        const x = e.pageX - offset.left;
        const y = e.pageY - offset.top;
        
        positionMarker.css({
            display: 'block',
            left: x + 'px',
            top: y + 'px'
        });
    });
    
    // Click para seleccionar posición
    $('#stage-container').on('click.positionPicker', function(e) {
        if (!pickingPosition) return;
        
        e.stopPropagation();
        
        const $stage = $(this);
        const stageWidth = $stage.width();
        const stageHeight = $stage.height();
        const offset = $stage.offset();
        const clickX = e.pageX - offset.left;
        const clickY = e.pageY - offset.top;
        
        // Convertir a porcentaje relativo al centro
        const percentX = ((clickX / stageWidth) * 100).toFixed(1) + '%';
        const percentY = ((clickY / stageHeight) * 100).toFixed(1) + '%';
        
        // Actualizar campos
        if (pickingPosition === 'start') {
            $('#slide-start-x').val(percentX);
            $('#slide-start-y').val(percentY);
        } else {
            $('#slide-end-x').val(percentX);
            $('#slide-end-y').val(percentY);
        }
        
        // Aplicar preview del slide completo
        applySlidePreview();
        
        // Limpiar
        pickingPosition = null;
        $stage.css('cursor', '');
        if (positionMarker) positionMarker.hide();
        
        showSuccess(`Posición guardada: ${percentX}, ${percentY}`);
    });
    
    // Botones para iniciar picking
    $('#btn-pick-start-position').click(function() {
        startPickingPosition('start');
    });
    
    $('#btn-pick-end-position').click(function() {
        startPickingPosition('end');
    });
    
    // Función para aplicar preview de slide
    function applySlidePreview() {
        if (selectedBackgroundId === null && selectedBackgroundId !== 0) return;
        
        const startX = $('#slide-start-x').val() || '-100%';
        const startY = $('#slide-start-y').val() || '50%';
        const endX = $('#slide-end-x').val() || '0%';
        const endY = $('#slide-end-y').val() || '0%';
        const duration = $('#slide-duration').val() || 1;
        
        const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
        
        // Limpiar animaciones previas
        $bgLayer.css({
            'animation': 'none',
            'background-position': `${startX} ${startY}`
        });
        
        // Forzar reflow
        void $bgLayer[0].offsetWidth;
        
        // Crear keyframes dinámicos
        const animationName = 'slide-preview-' + selectedBackgroundId;
        const keyframes = `
            @keyframes ${animationName} {
                from { background-position: ${startX} ${startY}; }
                to { background-position: ${endX} ${endY}; }
            }
        `;
        
        // Eliminar estilo previo si existe
        $('#slide-preview-style').remove();
        
        // Añadir nuevo estilo
        $('<style id="slide-preview-style">' + keyframes + '</style>').appendTo('head');
        
        // Aplicar animación
        $bgLayer.css({
            'animation': `${animationName} ${duration}s ease forwards`
        });
    }
    
    // Botones de presets
    $('.preset-btn').click(function() {
        const type = $(this).data('pos');
        const x = $(this).data('x');
        const y = $(this).data('y');
        
        if (type === 'start') {
            $('#slide-start-x').val(x);
            $('#slide-start-y').val(y);
        } else {
            $('#slide-end-x').val(x);
            $('#slide-end-y').val(y);
        }
        
        // Aplicar preview del slide completo
        applySlidePreview();
        showInfo(`Preset aplicado: ${x}, ${y}`);
    });
    
    $('#parallax-speed').on('input', function() {
        const speed = $(this).val();
        $('#parallax-speed-value').text(speed + 'x');
        
        // Preview: simular movimiento parallax
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            const direction = $('#parallax-direction').val() || 'vertical';
            
            // Guardar velocidad como atributo
            $bgLayer.attr('data-parallax-speed', speed);
            $bgLayer.attr('data-parallax-direction', direction);
            
            showInfo('Parallax configurado: ' + speed + 'x (' + direction + ')');
        }
    });
    
    // Preview para dirección de parallax
    $('#parallax-direction').on('change', function() {
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const direction = $(this).val();
            $bgLayer.attr('data-parallax-speed', speed);
            $bgLayer.attr('data-parallax-direction', direction);
            
            showInfo('Dirección parallax: ' + direction);
        }
    });
    
    // Preview en tiempo real para Loop Infinito
    function applyLoopPreview() {
        if (selectedBackgroundId === null && selectedBackgroundId !== 0) return;
        
        const direction = $('#loop-direction').val() || 'left';
        const duration = $('#loop-duration').val() || 30;
        const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
        
        // Asegurar que el fondo se repite
        $bgLayer.css('background-repeat', 'repeat');
        
        // Aplicar animación
        $bgLayer.css({
            'animation-name': `bg-loop-${direction}`,
            'animation-duration': `${duration}s`,
            'animation-timing-function': 'linear',
            'animation-iteration-count': 'infinite'
        });
        
        showInfo(`Loop: ${duration}s hacia ${direction}`);
    }
    
    $('#loop-direction').on('change', applyLoopPreview);
    $('#loop-duration').on('change', applyLoopPreview);
    
    // Preview en tiempo real para slide cuando cambian los parámetros
    $('#slide-duration, #slide-easing').on('change', applySlidePreview);
    
    // Preview en tiempo real del tamaño del fondo
    $('#bg-size').on('change', function() {
        if (selectedBackgroundId === null && selectedBackgroundId !== 0) return;
        
        const sizeMode = $(this).val();
        const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
        
        // Aplicar tamaño
        if (sizeMode === 'stretch') {
            $bgLayer.css('background-size', '100% 100%');
        } else if (sizeMode === 'auto') {
            $bgLayer.css('background-size', 'auto');
        } else {
            $bgLayer.css('background-size', sizeMode); // cover o contain
        }
        
        showInfo('Tamaño: ' + sizeMode);
    });
    
    // Preview en tiempo real de la repetición del fondo
    $('#bg-repeat').on('change', function() {
        if (selectedBackgroundId === null && selectedBackgroundId !== 0) return;
        
        const repeatMode = $(this).val();
        const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
        
        $bgLayer.css('background-repeat', repeatMode);
        
        showInfo('Repetición: ' + repeatMode);
    });

    $('#btn-upload-background').click(function() {
        $('#background-update-input').click();
    });

    $('#background-update-input').change(async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showInfo('Subiendo archivo...');
            const result = await projectManager.uploadAsset(currentProjectId, 'backgrounds', file);
            $('#background-src').val(result.path);
            showSuccess('Archivo subido. Haz clic en "Guardar Cambios"');
            $(this).val('');
        } catch (error) {
            showError('Error al subir: ' + error.message);
        }
    });

    // Botón para contraer/expandir propiedades del fondo
    $('#btn-toggle-bg-properties').click(function() {
        const $content = $('#bg-properties-content');
        const $btn = $(this);
        
        if ($content.is(':visible')) {
            $content.slideUp(200);
            $btn.text('▶');
        } else {
            $content.slideDown(200);
            $btn.text('▼');
        }
    });

    $('#btn-save-background').click(function() {
        if (selectedBackgroundId === null && selectedBackgroundId !== 0) return;
        
        const scene = gameData.scene_collection.scenes[currentSceneId];
        const bg = scene['background-images'][selectedBackgroundId];
        
        // Propiedades básicas
        bg.name = $('#background-name').val();
        bg.src = $('#background-src').val();
        bg.size = $('#bg-size').val() || 'cover';
        bg.repeat = $('#bg-repeat').val() || 'no-repeat';
        
        // Recopilar efecto según el tipo seleccionado
        const effectType = $('#bg-effect-type').val();
        
        switch(effectType) {
            case 'static':
                bg.effect = {
                    type: 'static',
                    position: {
                        x: $('#static-pos-x').val() || 'center',
                        y: $('#static-pos-y').val() || 'center'
                    },
                    opacity: parseFloat($('#static-opacity').val()) || 1
                };
                break;
                
            case 'fade-in':
            case 'fade-out':
                bg.effect = {
                    type: effectType,
                    opacityStart: parseFloat($('#fade-opacity-start').val()) || 0,
                    opacityEnd: parseFloat($('#fade-opacity-end').val()) || 1,
                    duration: parseFloat($('#fade-duration').val()) || 1,
                    delay: parseFloat($('#fade-delay').val()) || 0,
                    easing: $('#fade-easing').val() || 'ease'
                };
                break;
                
            case 'slide':
                bg.effect = {
                    type: 'slide',
                    startPosition: {
                        x: $('#slide-start-x').val() || '-100%',
                        y: $('#slide-start-y').val() || '0%'
                    },
                    endPosition: {
                        x: $('#slide-end-x').val() || '0%',
                        y: $('#slide-end-y').val() || '0%'
                    },
                    duration: parseFloat($('#slide-duration').val()) || 1,
                    delay: parseFloat($('#slide-delay').val()) || 0,
                    easing: $('#slide-easing').val() || 'ease'
                };
                break;
                
            case 'zoom-in':
            case 'zoom-out':
                bg.effect = {
                    type: effectType,
                    scaleStart: parseFloat($('#zoom-scale-start').val()) || 0,
                    scaleEnd: parseFloat($('#zoom-scale-end').val()) || 1,
                    origin: $('#zoom-origin').val() || 'center',
                    duration: parseFloat($('#zoom-duration').val()) || 1,
                    delay: parseFloat($('#zoom-delay').val()) || 0,
                    easing: $('#zoom-easing').val() || 'ease'
                };
                break;
                
            case 'loop':
                bg.effect = {
                    type: 'loop',
                    direction: $('#loop-direction').val() || 'left',
                    duration: parseFloat($('#loop-duration').val()) || 30,
                    distance: $('#loop-distance').val() || 'medium'
                };
                break;
                
            case 'parallax':
                bg.effect = {
                    type: 'parallax',
                    speed: parseFloat($('#parallax-speed').val()) || 0.5,
                    direction: $('#parallax-direction').val() || 'vertical'
                };
                break;
        }
        
        // Guardar dependencia
        bg.dependency = $('#bg-dependency').val() || '';
        bg.dependencyType = $('#bg-dependency-type').val() || 'onstart';
        
        showSuccess('Fondo actualizado con configuración ' + effectType);
        refreshBackgroundList();
        renderStage(scene);
        
        // Trigger auto-save
        if (typeof autoSave !== 'undefined' && autoSave.saveData) {
            autoSave.saveData();
        }
    });

    // --- Sprite Logic ---
    function refreshSpriteList() {
        const $list = $('#sprite-list');
        $list.empty();
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene || !scene.sprites) return;

        $.each(scene.sprites, function(key, sprite) {
            if (!sprite) return; // Skip null/undefined sprites
            const displayName = sprite.name || `Sprite ${key}`;
            const $item = $(`<div class="list-item">${displayName}</div>`);
            $item.click(() => selectSprite(key));
            $list.append($item);
        });
    }

    $('#btn-add-sprite').click(function() {
        if(!currentSceneId) return;
        
        const spriteName = prompt('Nombre del sprite:', 'Sprite ' + (Object.keys(gameData.scene_collection.scenes[currentSceneId].sprites || {}).length + 1));
        if (!spriteName) return;
        
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if(!scene.sprites) scene.sprites = {};
        
        const newKey = Object.keys(scene.sprites).length + 1;
        scene.sprites[newKey] = {
            name: spriteName,
            src: "sprites/personaje1.png", // Default
            size: "10%",
            positions: { "1": {x: "50%", y: "50%"} }
        };
        
        loadScene(currentSceneId); // Reload to render
        selectSprite(newKey.toString());
    });

    function selectSprite(key) {
        selectedSpriteId = key;
        $('#sprite-properties').show();
        $('#background-properties').hide();
        $('#action-properties').hide();
        $('.sprite').removeClass('selected');
        $(`.sprite[data-id="${key}"]`).addClass('selected');

        const sprite = gameData.scene_collection.scenes[currentSceneId].sprites[key];
        $('#sprite-name').val(sprite.name || "");
        $('#sprite-src').val(sprite.src);
        $('#sprite-size').val(sprite.size);

        // List positions
        const $posList = $('#sprite-positions-list');
        $posList.empty();
        if(sprite.positions) {
            $.each(sprite.positions, function(pKey, pos) {
                $posList.append(`<div><strong>${pKey}:</strong> x:${pos.x}, y:${pos.y}</div>`);
            });
        }
    }

    $('#sprite-src').change(function() {
        if(!selectedSpriteId) return;
        gameData.scene_collection.scenes[currentSceneId].sprites[selectedSpriteId].src = $(this).val();
        $(`.sprite[data-id="${selectedSpriteId}"]`).attr('src', $(this).val());
    });

    $('#sprite-size').change(function() {
        if(!selectedSpriteId) return;
        gameData.scene_collection.scenes[currentSceneId].sprites[selectedSpriteId].size = $(this).val();
        $(`.sprite[data-id="${selectedSpriteId}"]`).css('width', $(this).val());
    });

    $('#btn-save-sprite-pos').click(function() {
        if(!selectedSpriteId) return;
        const $el = $(`.sprite[data-id="${selectedSpriteId}"]`);
        const $stage = $('#stage-container');
        
        // Calculate percentage
        const leftPerc = Math.round(($el.position().left / $stage.width()) * 100) + "%";
        const topPerc = Math.round(($el.position().top / $stage.height()) * 100) + "%";

        const sprite = gameData.scene_collection.scenes[currentSceneId].sprites[selectedSpriteId];
        const nextPosIndex = Object.keys(sprite.positions).length + 1;
        
            sprite.positions[nextPosIndex] = { x: leftPerc, y: topPerc };
            
            selectSprite(selectedSpriteId); // Refresh list
            showSuccess(`Posición guardada como ID: ${nextPosIndex}`);
        });

    $('#btn-upload-sprite').click(function() {
        $('#sprite-file-input').click();
    });

    $('#sprite-file-input').change(async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!currentProjectId) {
            showError('No hay proyecto activo');
            return;
        }

        try {
            showInfo('Subiendo sprite...');
            const result = await projectManager.uploadAsset(currentProjectId, 'sprites', file);
            $('#sprite-src').val(result.path);
            
            // Actualizar sprite inmediatamente
            if (selectedSpriteId) {
                const sprite = gameData.scene_collection.scenes[currentSceneId].sprites[selectedSpriteId];
                sprite.src = result.path;
                renderStage(gameData.scene_collection.scenes[currentSceneId]);
            }
            
            showSuccess('Sprite subido y actualizado');
            $(this).val('');
        } catch (error) {
            showError('Error al subir sprite: ' + error.message);
        }
    });

    // Guardar cambios de nombre y tamaño del sprite
    $('#sprite-name, #sprite-size').on('change', function() {
        if (!selectedSpriteId) return;
        const sprite = gameData.scene_collection.scenes[currentSceneId].sprites[selectedSpriteId];
        sprite.name = $('#sprite-name').val();
        sprite.size = $('#sprite-size').val();
        refreshSpriteList();
        renderStage(gameData.scene_collection.scenes[currentSceneId]);
    });

    // --- Action/Button Logic ---
    function refreshActionList() {
        const $list = $('#action-list');
        $list.empty();
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene.actions) return;

        scene.actions.forEach((action, index) => {
            if(action.type === 'button') {
                const $item = $(`<div class="list-item">Botón: ${action.label}</div>`);
                $item.click(() => selectAction(index));
                $list.append($item);
            }
        });
    }

    $('#btn-add-button').click(function() {
        if(!currentSceneId) return;
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if(!scene.actions) scene.actions = [];
        
        scene.actions.push({
            type: "button",
            label: "Nuevo Botón",
            target: 1,
            position: { top: "50%", left: "50%" }
        });
        
        loadScene(currentSceneId);
    });

    function selectAction(index) {
        selectedActionIndex = index;
        $('#action-properties').show();
        $('#sprite-properties').hide();
        $('.action-button').removeClass('selected');
        $(`.action-button[data-index="${index}"]`).addClass('selected');

        const action = gameData.scene_collection.scenes[currentSceneId].actions[index];
        $('#action-label').val(action.label);
        $('#action-type').val(action.target && typeof action.target === 'string' && action.target.startsWith('sprites') ? 'sprite-move' : 'button');
        
        updateActionTypeUI();

        if ($('#action-type').val() === 'button') {
            $('#action-target-scene').val(action.target);
        } else {
            // Parse sprite target
            $('#action-target-sprite').val(action.target);
            $('#action-next-pos').val(action['next-position']);
        }
    }

    function updateActionTypeUI() {
        const type = $('#action-type').val();
        if (type === 'button') {
            $('#target-scene-group').show();
            $('#target-sprite-group').hide();
        } else {
            $('#target-scene-group').hide();
            $('#target-sprite-group').show();
        }
    }

    $('#action-type').change(updateActionTypeUI);

    // Save Action Changes
    $('#action-label, #action-type, #action-target-scene, #action-target-sprite, #action-next-pos').on('change input', function() {
        if (selectedActionIndex === null) return;
        
        const action = gameData.scene_collection.scenes[currentSceneId].actions[selectedActionIndex];
        action.label = $('#action-label').val();
        
        const type = $('#action-type').val();
        if (type === 'button') {
            action.target = parseInt($('#action-target-scene').val()) || 1;
            delete action['next-position'];
        } else {
            action.target = $('#action-target-sprite').val();
            action['next-position'] = parseInt($('#action-next-pos').val()) || 1;
        }

        // Update button text on stage
        $(`.action-button[data-index="${selectedActionIndex}"]`).text(action.label);
    });

    $('#btn-delete-action').click(function() {
        if (selectedActionIndex === null) return;
        gameData.scene_collection.scenes[currentSceneId].actions.splice(selectedActionIndex, 1);
        loadScene(currentSceneId);
    });

    // --- Time Events ---
    $('#btn-add-time-event').click(function() {
        if(!currentSceneId) return;
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if(!scene.actions) scene.actions = [];
        
        const delay = prompt("Retraso en milisegundos (ej: 3000):", "3000");
        if(delay) {
                scene.actions.push({
                    type: "time-event",
                    delay: parseInt(delay),
                    target: 1 // Default
                });
                showInfo("Evento de tiempo añadido. Edítalo en el JSON final por ahora.");
            }
        });    // --- Export ---
    $('#btn-export-json').click(function() {
        const jsonStr = JSON.stringify(gameData, null, 2);
        $('#json-textarea').val(jsonStr);
        $('#json-output-modal').css('display', 'flex');
    });
    
    // --- Auto-Save Controls ---
    $('#btn-save-manual').click(function() {
        if (autoSave.save()) {
            showSuccess('Guardado manualmente');
            // También guardar en ProjectManager
            if (currentProjectId) {
                projectManager.saveProjectData(currentProjectId, gameData);
            }
        }
    });
    
    $('#btn-clear-autosave').click(function() {
        if (confirm('¿Estás seguro de eliminar el auto-guardado?')) {
            autoSave.clear();
            showInfo('Auto-guardado eliminado');
        }
    });

    // --- Project Management Functions ---
    async function loadActiveProject() {
        const result = await projectManager.loadLastActiveProject();
        
        if (result) {
            currentProjectId = result.project.id;
            gameData = result.data;
            updateProjectUI(result.project);
            
            // Configurar auto-save para este proyecto
            autoSave.setProject(currentProjectId);
            
            // Verificar auto-guardado
            if (autoSave.hasSavedData()) {
                const info = autoSave.getLastSaveInfo();
                const lastSave = new Date(info.timestamp).toLocaleString('es-ES');
                
                if (confirm(`Se encontró un guardado automático del ${lastSave}. ¿Deseas restaurarlo?`)) {
                    const restored = autoSave.restore();
                    if (restored) {
                        gameData = restored.data;
                        projectManager.saveProjectData(currentProjectId, gameData);
                        showSuccess('Datos restaurados correctamente');
                    }
                } else {
                    autoSave.clear();
                }
            }
            
            // Renderizar escenas
            refreshSceneList();
            if (gameData.scene_collection.start_scene) {
                loadScene(gameData.scene_collection.start_scene);
            }
            
            // Iniciar auto-guardado
            setTimeout(() => {
                autoSave.start(() => {
                    // También guardar en ProjectManager periódicamente
                    projectManager.saveProjectData(currentProjectId, gameData);
                    return gameData;
                });
            }, 1000);
            
            logger.info('ProjectLoader', `Proyecto cargado: ${result.project.name}`);
        } else {
            // No hay proyectos, mostrar gestor
            showProjectManager();
        }
    }
    
    function updateProjectUI(project) {
        $('#current-project-name').text(project.name);
        document.title = `${project.name} - Editor`;
    }
    
    function showProjectManager() {
        refreshProjectList();
        $('#project-modal').show();
    }
    
    async function refreshProjectList() {
        await projectManager.loadProjects();
        const projects = projectManager.getAllProjects();
        const $list = $('#project-list');
        $list.empty();
        
        if (projects.length === 0) {
            $list.html('<p class="empty-message">No hay proyectos. Crea uno nuevo.</p>');
            return;
        }
        
        projects.forEach(project => {
            const isActive = currentProjectId === project.id;
            const created = new Date(project.createdAt).toLocaleDateString('es-ES');
            const modified = new Date(project.modifiedAt).toLocaleDateString('es-ES');
            
            const $card = $(`
                <div class="project-card ${isActive ? 'active' : ''}" data-id="${project.id}">
                    <div class="project-card-header">
                        <h4>${project.name}</h4>
                        ${isActive ? '<span class="badge-active">ACTIVO</span>' : ''}
                    </div>
                    <p class="project-description">${project.description || 'Sin descripción'}</p>
                    <div class="project-meta">
                        <small>Creado: ${created}</small>
                        <small>Modificado: ${modified}</small>
                    </div>
                    <div class="project-actions">
                        <button class="btn-load" data-id="${project.id}" ${isActive ? 'disabled' : ''}>
                            ${isActive ? 'Cargado' : 'Cargar'}
                        </button>
                        <button class="btn-export" data-id="${project.id}">Exportar</button>
                        <button class="btn-delete" data-id="${project.id}" ${isActive ? 'disabled' : ''}>Eliminar</button>
                    </div>
                </div>
            `);
            
            $list.append($card);
        });
        
        // Event handlers
        $('.btn-load').click(function() {
            const projectId = $(this).data('id');
            loadProject(projectId);
        });
        
        $('.btn-export').click(function() {
            const projectId = $(this).data('id');
            exportProject(projectId);
        });
        
        $('.btn-delete').click(function() {
            const projectId = $(this).data('id');
            deleteProject(projectId);
        });
    }
    
    async function handleCreateProject(e) {
        e.preventDefault();
        
        const name = $('#new-project-name').val().trim();
        const description = $('#new-project-description').val().trim();
        
        if (!name) {
            showError('El nombre del proyecto es obligatorio');
            return;
        }
        
        try {
            const project = await projectManager.createProject(name, description);
            showSuccess(`Proyecto "${name}" creado`);
            
            // Cargar el nuevo proyecto
            await loadProject(project.id);
            
            // Cerrar modal y limpiar formulario
            $('#project-modal').hide();
            $('#new-project-form')[0].reset();
        } catch (error) {
            showError('Error al crear proyecto: ' + error.message);
            logger.error('ProjectCreate', error);
        }
    }
    
    async function loadProject(projectId) {
        try {
            // Detener auto-guardado actual
            autoSave.stop();
            
            // Cargar nuevo proyecto
            const result = await projectManager.loadProject(projectId);
            currentProjectId = result.project.id;
            gameData = result.data;
            
            // Actualizar UI
            updateProjectUI(result.project);
            
            // Configurar auto-save
            autoSave.setProject(currentProjectId);
            autoSave.start(() => {
                projectManager.saveProjectData(currentProjectId, gameData);
                return gameData;
            });
            
            // Renderizar escenas
            refreshSceneList();
            if (gameData.scene_collection.start_scene) {
                loadScene(gameData.scene_collection.start_scene);
            }
            
            $('#project-modal').hide();
            showSuccess(`Proyecto "${result.project.name}" cargado`);
            logger.info('ProjectSwitch', `Cambiado a proyecto: ${result.project.name}`);
        } catch (error) {
            showError('Error al cargar proyecto: ' + error.message);
            logger.error('ProjectLoad', error);
        }
    }
    
    async function deleteProject(projectId) {
        const project = projectManager.getAllProjects().find(p => p.id === projectId);
        if (!project) return;
        
        if (confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) {
            try {
                await projectManager.deleteProject(projectId);
                showSuccess(`Proyecto "${project.name}" eliminado`);
                await refreshProjectList();
            } catch (error) {
                showError('Error al eliminar proyecto: ' + error.message);
                logger.error('ProjectDelete', error);
            }
        }
    }
    
    async function exportProject(projectId) {
        try {
            const exportData = await projectManager.getProjectData(projectId);
            const jsonStr = JSON.stringify(exportData, null, 2);
            
            const project = projectManager.getAllProjects().find(p => p.id === projectId);
            
            // Descargar archivo
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.replace(/\s+/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showSuccess('Proyecto exportado');
        } catch (error) {
            showError('Error al exportar: ' + error.message);
            logger.error('ProjectExport', error);
        }
    }

    // --- Comportamientos de fondo ---
    function generateBehaviorId() {
        return 'b' + Math.random().toString(36).substr(2, 9);
    }

    function addBackgroundBehavior(bg, type, config) {
        if (!bg.behaviors) bg.behaviors = [];
        const behavior = {
            id: generateBehaviorId(),
            type: type,
            config: config || {}
        };
        bg.behaviors.push(behavior);
        return behavior;
    }

    function renderBackgroundBehaviors(bg) {
        // Eliminado: lógica de comportamientos de fondo
        // Si necesitas renderizar algo aquí, déjalo vacío o solo el drag & drop de fondos
    }

    // Mostrar panel de configuración justo debajo del comportamiento seleccionado
    function showBehaviorConfigPanel(bg, behaviorId) {
        // Eliminado: panel de configuración de comportamientos de fondo
        // Esta función queda vacía
    }

    // Conectar botón de añadir comportamiento
    $('#btn-add-behavior').click(function() {
        // Eliminado: botón de añadir comportamiento de fondo
        // No hace nada
    });

    // Renderizar comportamientos al seleccionar fondo
    $(document).on('backgroundSelected', function(e, bg) {
        renderBackgroundBehaviors(bg);
        $('.behavior-config-panel').remove();
    });

    // Modificar selectBackground para disparar evento
    function selectBackground(key) {
        selectedBackgroundId = key;
        $('#background-properties').show();
        $('#sprite-properties').hide();
        $('#action-properties').hide();

        const scene = gameData.scene_collection.scenes[currentSceneId];
        const bg = scene['background-images'][key];
        
        // Propiedades básicas
        $('#background-name').val(bg.name || '');
        $('#background-src').val(bg.src || '');
        $('#bg-size').val(bg.size || bg.fill || 'cover'); // Compatibilidad con fill antiguo
        $('#bg-repeat').val(bg.repeat || 'no-repeat');
        
        // Determinar tipo de efecto
        const effect = bg.effect || {};
        const effectType = effect.type || 'static';
        $('#bg-effect-type').val(effectType);
        
        // Cargar opciones específicas según el tipo
        loadEffectOptions(effectType, effect);
        
        // Mostrar/ocultar paneles
        toggleEffectOptions();

        // --- Dependencia de capa ---
        // Rellenar selector de dependencias
        const $depSelect = $('#bg-dependency');
        $depSelect.empty();
        $depSelect.append('<option value="">Sin dependencia</option>');
        $.each(scene['background-images'], function(depKey, depBg) {
            if (!depBg) return;
            if (depKey != key) {
                const name = depBg.name || (depBg.src ? depBg.src.split('/').pop() : 'Fondo ' + depKey);
                $depSelect.append(`<option value="${depKey}">${name}</option>`);
            }
        });
        // Seleccionar si ya hay dependencia
        $depSelect.val(bg.dependency || '');
        // Mostrar tipo de dependencia si aplica
        if (bg.dependency) {
            $('#bg-dependency-type-container').show();
            $('#bg-dependency-type').val(bg.dependencyType || 'onstart');
        } else {
            $('#bg-dependency-type-container').hide();
        }

        // Mostrar/ocultar tipo según selección
        $depSelect.off('change').on('change', function() {
            if ($(this).val()) {
                $('#bg-dependency-type-container').show();
            } else {
                $('#bg-dependency-type-container').hide();
            }
        });
        
        // Disparar evento de selección de fondo
        $(document).trigger('backgroundSelected', [bg]);
    }
    
    function loadEffectOptions(type, effect) {
        switch(type) {
            case 'static':
                $('#static-pos-x').val(effect.position?.x || 'center');
                $('#static-pos-y').val(effect.position?.y || 'center');
                $('#static-opacity').val(effect.opacity || 1);
                $('#static-opacity-value').text(Math.round((effect.opacity || 1) * 100) + '%');
                break;
                
            case 'fade-in':
            case 'fade-out':
                $('#fade-opacity-start').val(effect.opacityStart || 0);
                $('#fade-opacity-start-value').text(Math.round((effect.opacityStart || 0) * 100) + '%');
                $('#fade-opacity-end').val(effect.opacityEnd || 1);
                $('#fade-opacity-end-value').text(Math.round((effect.opacityEnd || 1) * 100) + '%');
                $('#fade-duration').val(effect.duration || 1);
                $('#fade-delay').val(effect.delay || 0);
                $('#fade-easing').val(effect.easing || 'ease');
                break;
                
            case 'slide':
                $('#slide-start-x').val(effect.startPosition?.x || '-100%');
                $('#slide-start-y').val(effect.startPosition?.y || '0%');
                $('#slide-end-x').val(effect.endPosition?.x || '0%');
                $('#slide-end-y').val(effect.endPosition?.y || '0%');
                $('#slide-duration').val(effect.duration || 1);
                $('#slide-delay').val(effect.delay || 0);
                $('#slide-easing').val(effect.easing || 'ease');
                break;
                
            case 'zoom-in':
            case 'zoom-out':
                $('#zoom-scale-start').val(effect.scaleStart || 0);
                $('#zoom-scale-start-value').text((effect.scaleStart || 0) + 'x');
                $('#zoom-scale-end').val(effect.scaleEnd || 1);
                $('#zoom-scale-end-value').text((effect.scaleEnd || 1) + 'x');
                $('#zoom-origin').val(effect.origin || 'center');
                $('#zoom-duration').val(effect.duration || 1);
                $('#zoom-delay').val(effect.delay || 0);
                $('#zoom-easing').val(effect.easing || 'ease');
                break;
                
            case 'loop':
                $('#loop-direction').val(effect.direction || 'left');
                $('#loop-duration').val(effect.duration || 30);
                $('#loop-distance').val(effect.distance || 'medium');
                break;
                
            case 'parallax':
                $('#parallax-speed').val(effect.speed || 0.5);
                $('#parallax-speed-value').text((effect.speed || 0.5) + 'x');
                $('#parallax-direction').val(effect.direction || 'vertical');
                break;
        }
    }
    
    // Mostrar/ocultar opciones según el tipo de efecto
    function toggleEffectOptions() {
        const effectType = $('#bg-effect-type').val();
        
        // Ocultar todas las opciones primero
        $('.effect-options').hide();
        
        // Mostrar solo la sección relevante
        switch(effectType) {
            case 'static':
                $('#static-options').show();
                break;
            case 'fade-in':
            case 'fade-out':
                $('#fade-options').show();
                break;
            case 'slide':
                $('#slide-options').show();
                break;
            case 'zoom-in':
            case 'zoom-out':
                $('#zoom-options').show();
                break;
            case 'loop':
                $('#loop-options').show();
                break;
            case 'parallax':
                $('#parallax-options').show();
                break;
        }
    }
    
    // Event listeners para cambio de tipo
    $('#bg-effect-type').change(function() {
        toggleEffectOptions();
        
        // Si se cambia a loop, aplicar preview inmediatamente
        if ($(this).val() === 'loop') {
            setTimeout(applyLoopPreview, 100);
        }
    });
    
    // Event listeners para sliders con valores dinámicos y preview en tiempo real
    $('#static-opacity').on('input', function() {
        const opacity = $(this).val();
        $('#static-opacity-value').text(Math.round(opacity * 100) + '%');
        
        // Preview en tiempo real
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
        }
    });
    
    // Preview en tiempo real para posición estática
    $('#static-pos-x, #static-pos-y').on('change', function() {
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const posX = $('#static-pos-x').val() || 'center';
            const posY = $('#static-pos-y').val() || 'center';
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('background-position', `${posX} ${posY}`);
            showInfo('Posición actualizada: ' + posX + ' ' + posY);
        }
    });
    
    $('#fade-opacity-start').on('input', function() {
        const opacity = $(this).val();
        $('#fade-opacity-start-value').text(Math.round(opacity * 100) + '%');
        
        // Preview: mostrar opacidad inicial
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
            showInfo('Vista previa: Opacidad inicial ' + Math.round(opacity * 100) + '%');
        }
    });
    
    $('#fade-opacity-end').on('input', function() {
        const opacity = $(this).val();
        $('#fade-opacity-end-value').text(Math.round(opacity * 100) + '%');
        
        // Preview: mostrar opacidad final
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            $bgLayer.css('opacity', opacity);
            showInfo('Vista previa: Opacidad final ' + Math.round(opacity * 100) + '%');
        }
    });
    
    $('#zoom-scale-start').on('input', function() {
        const scale = $(this).val();
        $('#zoom-scale-start-value').text(scale + 'x');
        
        // Preview: mostrar escala inicial
        if (selectedBackgroundId !== null || selectedBackgroundId === 0) {
            const $bgLayer = $(`.background-layer[data-bg-id="${selectedBackgroundId}"]`);
            const origin = $('#zoom-origin').val() || 'center';
            $bgLayer.css({
                'transform': `scale(${scale})`,
                'transform-origin': origin
            });
        }
    });

    // ...puedes agregar más listeners aquí...

}); // Fin de $(document).ready