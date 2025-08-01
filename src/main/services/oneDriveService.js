const OneDriveService = require('./onedrive');

class OneDriveServiceWrapper {
    static async syncFiles() {
        try {
            const service = new OneDriveService();
            return await service.sync();
        } catch (error) {
            console.error('OneDriveServiceWrapper error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async uploadFile(localPath, relativePath) {
        try {
            const service = new OneDriveService();
            return await service.uploadFile(localPath, relativePath);
        } catch (error) {
            console.error('OneDriveServiceWrapper upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async downloadFile(relativePath, localPath) {
        try {
            const service = new OneDriveService();
            return await service.downloadFile(relativePath, localPath);
        } catch (error) {
            console.error('OneDriveServiceWrapper download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static isAvailable() {
        try {
            const service = new OneDriveService();
            return service.isOneDriveAvailable();
        } catch (error) {
            return false;
        }
    }

    static getPath() {
        try {
            const service = new OneDriveService();
            return service.getOneDrivePath();
        } catch (error) {
            return null;
        }
    }
}

module.exports = OneDriveServiceWrapper;