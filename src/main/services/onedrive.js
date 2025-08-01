const fs = require('fs');
const path = require('path');

class OneDriveService {
    constructor() {
        this.oneDrivePath = path.join(process.env.HOME || process.env.USERPROFILE, 'OneDrive', 'JURMAQ', 'APP');
        this.localPath = path.join(__dirname, '..', '..', '..', 'data');
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.oneDrivePath)) {
            fs.mkdirSync(this.oneDrivePath, { recursive: true });
        }
        
        if (!fs.existsSync(this.localPath)) {
            fs.mkdirSync(this.localPath, { recursive: true });
        }

        // Create subdirectories
        const subdirs = ['database', 'documents', 'templates', 'backups', 'exports'];
        subdirs.forEach(dir => {
            const oneDriveDir = path.join(this.oneDrivePath, dir);
            const localDir = path.join(this.localPath, dir);
            
            if (!fs.existsSync(oneDriveDir)) {
                fs.mkdirSync(oneDriveDir, { recursive: true });
            }
            
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }
        });
    }

    async sync() {
        try {
            console.log('Iniciando sincronización OneDrive...');
            
            // Sync database
            await this.syncDatabase();
            
            // Sync documents
            await this.syncDocuments();
            
            // Sync templates
            await this.syncTemplates();
            
            // Create backup
            await this.createBackup();
            
            console.log('Sincronización OneDrive completada');
            return { success: true, message: 'Sincronización completada exitosamente' };
            
        } catch (error) {
            console.error('Error en sincronización OneDrive:', error);
            return { success: false, message: error.message };
        }
    }

    async syncDatabase() {
        const dbSourcePath = path.join(this.oneDrivePath, 'database.sqlite');
        const dbTargetPath = path.join(this.localPath, 'database.sqlite');
        
        try {
            if (fs.existsSync(dbSourcePath)) {
                const sourceStats = fs.statSync(dbSourcePath);
                const targetExists = fs.existsSync(dbTargetPath);
                
                if (!targetExists || (targetExists && sourceStats.mtime > fs.statSync(dbTargetPath).mtime)) {
                    fs.copyFileSync(dbSourcePath, dbTargetPath);
                    console.log('Base de datos sincronizada desde OneDrive');
                }
            } else if (fs.existsSync(dbTargetPath)) {
                fs.copyFileSync(dbTargetPath, dbSourcePath);
                console.log('Base de datos subida a OneDrive');
            }
        } catch (error) {
            console.error('Error sincronizando base de datos:', error);
        }
    }

    async syncDocuments() {
        const documentsSource = path.join(this.oneDrivePath, 'documents');
        const documentsTarget = path.join(this.localPath, 'documents');
        
        try {
            await this.syncDirectory(documentsSource, documentsTarget);
            console.log('Documentos sincronizados');
        } catch (error) {
            console.error('Error sincronizando documentos:', error);
        }
    }

    async syncTemplates() {
        const templatesSource = path.join(this.oneDrivePath, 'templates');
        const templatesTarget = path.join(__dirname, '..', '..', '..', 'templates');
        
        try {
            await this.syncDirectory(templatesSource, templatesTarget);
            console.log('Plantillas sincronizadas');
        } catch (error) {
            console.error('Error sincronizando plantillas:', error);
        }
    }

    async syncDirectory(sourceDir, targetDir) {
        if (!fs.existsSync(sourceDir)) {
            fs.mkdirSync(sourceDir, { recursive: true });
        }
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const sourceFiles = fs.readdirSync(sourceDir);
        const targetFiles = fs.readdirSync(targetDir);

        // Copy newer files from source to target
        for (const file of sourceFiles) {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                await this.syncDirectory(sourcePath, targetPath);
            } else {
                const sourceStats = fs.statSync(sourcePath);
                const targetExists = fs.existsSync(targetPath);
                
                if (!targetExists || sourceStats.mtime > fs.statSync(targetPath).mtime) {
                    fs.copyFileSync(sourcePath, targetPath);
                }
            }
        }

        // Copy newer files from target to source
        for (const file of targetFiles) {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            
            if (!fs.existsSync(sourcePath) && fs.statSync(targetPath).isFile()) {
                fs.copyFileSync(targetPath, sourcePath);
            }
        }
    }

    async createBackup() {
        const backupDir = path.join(this.oneDrivePath, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup_${timestamp}`;
        const backupPath = path.join(backupDir, backupName);
        
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Create backup directory
            fs.mkdirSync(backupPath);

            // Copy database
            const dbSource = path.join(this.oneDrivePath, 'database.sqlite');
            if (fs.existsSync(dbSource)) {
                fs.copyFileSync(dbSource, path.join(backupPath, 'database.sqlite'));
            }

            // Copy documents directory
            const documentsSource = path.join(this.oneDrivePath, 'documents');
            const documentsBackup = path.join(backupPath, 'documents');
            if (fs.existsSync(documentsSource)) {
                await this.copyDirectory(documentsSource, documentsBackup);
            }

            // Clean old backups (keep only last 10)
            await this.cleanOldBackups(backupDir);

            console.log(`Backup creado: ${backupName}`);
        } catch (error) {
            console.error('Error creando backup:', error);
        }
    }

    async copyDirectory(source, target) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const files = fs.readdirSync(source);
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const targetPath = path.join(target, file);

            if (fs.statSync(sourcePath).isDirectory()) {
                await this.copyDirectory(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    async cleanOldBackups(backupDir) {
        try {
            const backups = fs.readdirSync(backupDir)
                .filter(name => name.startsWith('backup_'))
                .map(name => ({
                    name,
                    path: path.join(backupDir, name),
                    mtime: fs.statSync(path.join(backupDir, name)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            // Keep only the 10 most recent backups
            for (let i = 10; i < backups.length; i++) {
                const backup = backups[i];
                fs.rmSync(backup.path, { recursive: true, force: true });
                console.log(`Backup antiguo eliminado: ${backup.name}`);
            }
        } catch (error) {
            console.error('Error limpiando backups antiguos:', error);
        }
    }

    async uploadFile(localPath, relativePath) {
        try {
            const targetPath = path.join(this.oneDrivePath, relativePath);
            const targetDir = path.dirname(targetPath);
            
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.copyFileSync(localPath, targetPath);
            console.log(`Archivo subido a OneDrive: ${relativePath}`);
            return { success: true, path: targetPath };
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            return { success: false, error: error.message };
        }
    }

    async downloadFile(relativePath, localPath) {
        try {
            const sourcePath = path.join(this.oneDrivePath, relativePath);
            const localDir = path.dirname(localPath);
            
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, localPath);
                console.log(`Archivo descargado de OneDrive: ${relativePath}`);
                return { success: true, path: localPath };
            } else {
                return { success: false, error: 'Archivo no encontrado en OneDrive' };
            }
        } catch (error) {
            console.error('Error descargando archivo:', error);
            return { success: false, error: error.message };
        }
    }

    getOneDrivePath() {
        return this.oneDrivePath;
    }

    isOneDriveAvailable() {
        return fs.existsSync(this.oneDrivePath);
    }
}

module.exports = OneDriveService;