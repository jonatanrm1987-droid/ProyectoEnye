/**
 * ProjectManager - Sistema de gestión de múltiples proyectos
 * Cada proyecto contiene sus propias escenas, sprites, acciones y configuración
 * Versión 2.0: Usa API PHP en lugar de localStorage
 */

class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projects = [];
        this.apiBase = 'api/';
        
        logger.info('ProjectManager inicializado (API PHP)');
    }

    /**
     * Cargar lista de proyectos desde API
     */
    async loadProjects() {
        try {
            const response = await fetch(this.apiBase + 'list-projects.php');
            const result = await response.json();
            
            if (result.success) {
                this.projects = result.data || [];
                logger.info(`${this.projects.length} proyectos cargados desde API`);
                return this.projects;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('Error cargando proyectos:', error);
            this.projects = [];
            throw error;
        }
    }

    /**
     * Migración ya no se usa - Los proyectos se crean con la API PHP
     */
    async migrateFromScenesJSON() {
        logger.info('Migración automática deshabilitada. Use migrate.php para migrar proyectos legacy.');
        return null;
    }

    /**
     * Crear un nuevo proyecto (API)
     */
    async createProject(name, description = '') {
        try {
            const response = await fetch(this.apiBase + 'create-project.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const project = result.data;
                await this.loadProjects(); // Recargar lista
                logger.info(`Proyecto creado: ${name} (${project.id})`);
                return project;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('Error creando proyecto:', error);
            throw error;
        }
    }

    /**
     * Eliminar un proyecto (API)
     */
    async deleteProject(projectId) {
        // No permitir eliminar el proyecto activo
        if (this.currentProject && this.currentProject.id === projectId) {
            throw new Error('No puedes eliminar el proyecto activo. Cambia a otro proyecto primero.');
        }

        try {
            const response = await fetch(this.apiBase + `delete-project.php?projectId=${projectId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                await this.loadProjects(); // Recargar lista
                logger.info(`Proyecto eliminado: ${projectId}`);
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('Error eliminando proyecto:', error);
            throw error;
        }
    }

    /**
     * Obtener datos de un proyecto (API)
     */
    async getProjectData(projectId) {
        try {
            const response = await fetch(this.apiBase + `get-project.php?projectId=${projectId}`);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error(`Error cargando datos del proyecto ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Guardar datos de un proyecto (API)
     */
    async saveProjectData(projectId, data) {
        try {
            const response = await fetch(this.apiBase + 'save-project.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, data })
            });
            
            const result = await response.json();
            
            if (result.success) {
                logger.debug(`Datos del proyecto ${projectId} guardados`);
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error(`Error guardando datos del proyecto ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Cargar un proyecto como activo (API)
     */
    async loadProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }

        const data = await this.getProjectData(projectId);
        this.currentProject = project;
        
        // Guardar referencia al proyecto activo en localStorage
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
     * Cargar último proyecto activo (API)
     */
    async loadLastActiveProject() {
        try {
            await this.loadProjects(); // Cargar lista primero
            
            const lastProjectId = localStorage.getItem('proyectoEnye_currentProject');
            if (lastProjectId && this.projects.find(p => p.id === lastProjectId)) {
                return await this.loadProject(lastProjectId);
            } else if (this.projects.length > 0) {
                // Cargar el primer proyecto disponible
                return await this.loadProject(this.projects[0].id);
            }
            return null;
        } catch (error) {
            logger.error('Error cargando último proyecto activo:', error);
            return null;
        }
    }
    
    /**
     * Subir asset a un proyecto
     */
    async uploadAsset(projectId, assetType, file) {
        try {
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('assetType', assetType);
            formData.append('file', file);
            
            const response = await fetch(this.apiBase + 'upload-asset.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                logger.info(`Asset subido: ${result.data.name}`);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('Error subiendo asset:', error);
            throw error;
        }
    }
}

// Instancia global
window.projectManager = new ProjectManager();
