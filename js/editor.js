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

$(document).ready(function() {
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
        refreshSpriteList();
        refreshActionList();
        
        // Highlight in selector
        $('#scene-selector').val(sceneId);
    }

    function renderStage(scene) {
        const $stage = $('#stage-container');
        $stage.empty();
        $stage.css('background-color', scene["background-color"] || "#000");

        // Background Images
        if (scene["background-images"]) {
            $.each(scene["background-images"], function(k, bg) {
                const $bg = $('<div class="background-layer"></div>');
                $bg.css('background-image', `url(${bg.src})`);
                if(bg.opacity) $bg.css('opacity', bg.opacity);
                if(bg.fill === 'stretch') $bg.css('background-size', '100% 100%');
                $stage.append($bg);
            });
        }

        // Sprites
        if (scene.sprites) {
            $.each(scene.sprites, function(key, sprite) {
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

    // --- Sprite Logic ---
    function refreshSpriteList() {
        const $list = $('#sprite-list');
        $list.empty();
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if (!scene.sprites) return;

        $.each(scene.sprites, function(key, sprite) {
            const $item = $(`<div class="list-item">Sprite ${key}</div>`);
            $item.click(() => selectSprite(key));
            $list.append($item);
        });
    }

    $('#btn-add-sprite').click(function() {
        if(!currentSceneId) return;
        const scene = gameData.scene_collection.scenes[currentSceneId];
        if(!scene.sprites) scene.sprites = {};
        
        const newKey = Object.keys(scene.sprites).length + 1;
        scene.sprites[newKey] = {
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
        $('#action-properties').hide();
        $('.sprite').removeClass('selected');
        $(`.sprite[data-id="${key}"]`).addClass('selected');

        const sprite = gameData.scene_collection.scenes[currentSceneId].sprites[key];
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
    function loadActiveProject() {
        const result = projectManager.loadLastActiveProject();
        
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
    
    function refreshProjectList() {
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
    
    function handleCreateProject(e) {
        e.preventDefault();
        
        const name = $('#new-project-name').val().trim();
        const description = $('#new-project-description').val().trim();
        
        if (!name) {
            showError('El nombre del proyecto es obligatorio');
            return;
        }
        
        try {
            const project = projectManager.createProject(name, description);
            showSuccess(`Proyecto "${name}" creado`);
            
            // Cargar el nuevo proyecto
            loadProject(project.id);
            
            // Cerrar modal y limpiar formulario
            $('#project-modal').hide();
            $('#new-project-form')[0].reset();
        } catch (error) {
            showError('Error al crear proyecto: ' + error.message);
            logger.error('ProjectCreate', error);
        }
    }
    
    function loadProject(projectId) {
        try {
            // Detener auto-guardado actual
            autoSave.stop();
            
            // Cargar nuevo proyecto
            const result = projectManager.loadProject(projectId);
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
    
    function deleteProject(projectId) {
        const project = projectManager.getAllProjects().find(p => p.id === projectId);
        if (!project) return;
        
        if (confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) {
            try {
                projectManager.deleteProject(projectId);
                showSuccess(`Proyecto "${project.name}" eliminado`);
                refreshProjectList();
            } catch (error) {
                showError('Error al eliminar proyecto: ' + error.message);
                logger.error('ProjectDelete', error);
            }
        }
    }
    
    function exportProject(projectId) {
        try {
            const exportData = projectManager.exportProject(projectId);
            const jsonStr = JSON.stringify(exportData, null, 2);
            
            // Descargar archivo
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportData.projectInfo.name.replace(/\s+/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showSuccess('Proyecto exportado');
        } catch (error) {
            showError('Error al exportar: ' + error.message);
            logger.error('ProjectExport', error);
        }
    }

});
