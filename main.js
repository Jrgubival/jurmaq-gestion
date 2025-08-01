const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Import database and services
const Database = require('./src/main/database/connection');
const OneDriveService = require('./src/main/services/onedrive');
const PDFGenerator = require('./src/main/services/pdf-generator');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Menu Template - Spanish interface
const menuTemplate = [
    {
        label: 'Archivo',
        submenu: [
            {
                label: 'Nuevo',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    mainWindow.webContents.send('menu-action', 'new');
                }
            },
            { type: 'separator' },
            {
                label: 'Configuración',
                click: () => {
                    mainWindow.webContents.send('menu-action', 'settings');
                }
            },
            { type: 'separator' },
            {
                label: 'Salir',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Editar',
        submenu: [
            { label: 'Deshacer', role: 'undo' },
            { label: 'Rehacer', role: 'redo' },
            { type: 'separator' },
            { label: 'Cortar', role: 'cut' },
            { label: 'Copiar', role: 'copy' },
            { label: 'Pegar', role: 'paste' },
            { label: 'Seleccionar todo', role: 'selectall' }
        ]
    },
    {
        label: 'Ver',
        submenu: [
            { label: 'Recargar', role: 'reload' },
            { label: 'Forzar recarga', role: 'forceReload' },
            { label: 'Herramientas de desarrollador', role: 'toggleDevTools' },
            { type: 'separator' },
            { label: 'Zoom real', role: 'resetZoom' },
            { label: 'Acercar', role: 'zoomIn' },
            { label: 'Alejar', role: 'zoomOut' },
            { type: 'separator' },
            { label: 'Pantalla completa', role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Ayuda',
        submenu: [
            {
                label: 'Acerca de JURMAQ Gestión',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Acerca de',
                        message: 'JURMAQ Gestión Empresarial',
                        detail: 'Versión 1.0.0\n© 2024 JURMAQ EIRL\nDesarrollado por Jorge Ubilla'
                    });
                }
            }
        ]
    }
];

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, query, params) => {
    try {
        const db = Database.getInstance();
        return await db.all(query, params);
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
});

ipcMain.handle('db-run', async (event, query, params) => {
    try {
        const db = Database.getInstance();
        return await db.run(query, params);
    } catch (error) {
        console.error('Database run error:', error);
        throw error;
    }
});

// File dialog handlers
ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

// PDF generation handler
ipcMain.handle('generate-pdf', async (event, options) => {
    try {
        const pdfGenerator = new PDFGenerator();
        return await pdfGenerator.generate(options);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
});

// OneDrive sync handler
ipcMain.handle('sync-onedrive', async (event) => {
    try {
        const oneDrive = new OneDriveService();
        return await oneDrive.sync();
    } catch (error) {
        console.error('OneDrive sync error:', error);
        throw error;
    }
});

// Create the application menu
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

// App event handlers
app.whenReady().then(() => {
    createWindow();
    
    // Initialize database
    Database.initialize();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});
