const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
    dbRun: (query, params) => ipcRenderer.invoke('db-run', query, params),
    dbGet: (query, params) => ipcRenderer.invoke('db-get', query, params),
    
    // File operations
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    
    // PDF generation
    generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),
    
    // OneDrive sync
    syncOneDrive: () => ipcRenderer.invoke('sync-onedrive'),
    
    // Menu actions
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Platform info
    platform: process.platform
});

// Security: prevent Node.js API access
window.addEventListener('DOMContentLoaded', () => {
    // You can add any initialization code here if needed
    console.log('JURMAQ Gestión - Aplicación iniciada');
});