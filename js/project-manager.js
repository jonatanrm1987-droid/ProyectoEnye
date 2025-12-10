/**
 * ProjectManager - Sistema de gestión de múltiples proyectos
 * Cada proyecto contiene sus propias escenas, sprites, acciones y configuración
 */

class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projects = [];
        this.storageKey = 'proyectoEnye_projects';
        this.projectPrefix = 'proyectoEnye_project_';
        
        this.loadProjects();
        logger.info('ProjectManager inicializado');
    }

    /**
     * Cargar lista de proyectos desde localStorage
     */
    loadProjects() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.projects = JSON.parse(stored);
                logger.info(`${this.projects.length} proyectos cargados`);
            } else {
                // Migrar proyecto legacy si existe auto-guardado antiguo
                this.migrateLegacyProject();
            }
        } catch (error) {
            logger.error('Error cargando proyectos:', error);
            this.projects = [];
        }
    }

    /**
     * Migrar auto-guardado antiguo a formato de proyecto
     */
    migrateLegacyProject() {
        try {
            const legacyData = localStorage.getItem('proyectoEnye_autoSave');
            if (legacyData) {
                const data = JSON.parse(legacyData);
                const project = this.createProject('Proyecto Legacy', 'Proyecto migrado automáticamente');
                this.saveProjectData(project.id, data.data);
                logger.info('Proyecto legacy migrado exitosamente');
                // Limpiar auto-guardado antiguo
                localStorage.removeItem('proyectoEnye_autoSave');
            }
        } catch (error) {
            logger.warn('No se pudo migrar proyecto legacy:', error);
        }
    }

    /**
     * Guardar lista de proyectos en localStorage
     */
    saveProjects() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
            logger.debug('Lista de proyectos guardada');
        } catch (error) {
            logger.error('Error guardando proyectos:', error);
            throw new Error('No se pudo guardar la lista de proyectos');
        }
    }

    /**
     * Crear un nuevo proyecto
     */
    createProject(name, description = '') {
        const project = {
            id: this.generateId(),
            name: name,
            description: description,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };

        // Inicializar estructura de datos del proyecto
        const projectData = {
            scene_collection: {
                title: name,
                author: '',
                start_scene: 'scene1'
            },
            scenes: {
                scene1: {
                    id: 'scene1',
                    backgrounds: [],
                    sprites: [],
                    content: {},
                    actions: [],
                    time_events: []
                }
            },
            settings: {
                screen: {
                    width: 1920,
                    height: 1080
                }
            }
        };

        this.projects.push(project);
        this.saveProjects();
        this.saveProjectData(project.id, projectData);
        
        logger.info(`Proyecto creado: ${name} (${project.id})`);
        return project;
    }

    /**
     * Eliminar un proyecto
     */
    deleteProject(projectId) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index === -1) {
            throw new Error('Proyecto no encontrado');
        }

        const project = this.projects[index];
        
        // No permitir eliminar el proyecto activo sin antes cambiar
        if (this.currentProject && this.currentProject.id === projectId) {
            throw new Error('No puedes eliminar el proyecto activo. Cambia a otro proyecto primero.');
        }

        // Eliminar datos del proyecto
        localStorage.removeItem(this.projectPrefix + projectId);
        
        // Eliminar auto-guardado del proyecto
        localStorage.removeItem(`proyectoEnye_autoSave_${projectId}`);

        // Eliminar de la lista
        this.projects.splice(index, 1);
        this.saveProjects();

        logger.info(`Proyecto eliminado: ${project.name}`);
    }

    /**
     * Obtener datos de un proyecto
     */
    getProjectData(projectId) {
        try {
            const stored = localStorage.getItem(this.projectPrefix + projectId);
            if (!stored) {
                throw new Error('Datos del proyecto no encontrados');
            }
            return JSON.parse(stored);
        } catch (error) {
            logger.error(`Error cargando datos del proyecto ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Guardar datos de un proyecto
     */
    saveProjectData(projectId, data) {
        try {
            localStorage.setItem(this.projectPrefix + projectId, JSON.stringify(data));
            
            // Actualizar fecha de modificación
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                project.modifiedAt = new Date().toISOString();
                this.saveProjects();
            }
            
            logger.debug(`Datos del proyecto ${projectId} guardados`);
        } catch (error) {
            logger.error(`Error guardando datos del proyecto ${projectId}:`, error);
            throw new Error('No se pudo guardar el proyecto');
        }
    }

    /**
     * Cargar un proyecto como activo
     */
    loadProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }

        const data = this.getProjectData(projectId);
        this.currentProject = project;
        
        // Guardar referencia al proyecto activo
        localStorage.setItem('proyectoEnye_currentProject', projectId);
        
        logger.info(`Proyecto cargado: ${project.name}`);
        return { project, data };
    }

    /**
     * Obtener proyecto actualmente cargado
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * Obtener lista de todos los proyectos
     */
    getAllProjects() {
        return [...this.projects];
    }

    /**
     * Renombrar un proyecto
     */
    renameProject(projectId, newName, newDescription) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }

        project.name = newName;
        if (newDescription !== undefined) {
            project.description = newDescription;
        }
        project.modifiedAt = new Date().toISOString();
        
        this.saveProjects();
        logger.info(`Proyecto renombrado: ${newName}`);
    }

    /**
     * Exportar un proyecto a JSON
     */
    exportProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }

        const data = this.getProjectData(projectId);
        
        return {
            projectInfo: project,
            gameData: data
        };
    }

    /**
     * Importar un proyecto desde JSON
     */
    importProject(projectData) {
        if (!projectData.projectInfo || !projectData.gameData) {
            throw new Error('Formato de proyecto inválido');
        }

        const newProject = this.createProject(
            projectData.projectInfo.name + ' (importado)',
            projectData.projectInfo.description
        );

        this.saveProjectData(newProject.id, projectData.gameData);
        
        logger.info(`Proyecto importado: ${newProject.name}`);
        return newProject;
    }

    /**
     * Generar ID único para proyecto
     */
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Cargar último proyecto activo
     */
    loadLastActiveProject() {
        try {
            const lastProjectId = localStorage.getItem('proyectoEnye_currentProject');
            if (lastProjectId && this.projects.find(p => p.id === lastProjectId)) {
                return this.loadProject(lastProjectId);
            } else if (this.projects.length > 0) {
                // Cargar el primer proyecto disponible
                return this.loadProject(this.projects[0].id);
            }
            return null;
        } catch (error) {
            logger.error('Error cargando último proyecto activo:', error);
            return null;
        }
    }
}

// Instancia global
window.projectManager = new ProjectManager();
