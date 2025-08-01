const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

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
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

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

// Basic IPC handlers for demo
ipcMain.handle('db-query', async (event, query, params) => {
    // Demo implementation - return mock data
    console.log('DB Query:', query, params);
    return [];
});

ipcMain.handle('db-run', async (event, query, params) => {
    // Demo implementation
    console.log('DB Run:', query, params);
    return { id: Date.now(), changes: 1 };
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('generate-pdf', async (event, options) => {
    // Demo implementation
    console.log('Generate PDF:', options);
    return { success: true, filename: 'demo.pdf', path: '/tmp/demo.pdf' };
});

ipcMain.handle('sync-onedrive', async (event) => {
    // Demo implementation
    console.log('OneDrive sync requested');
    return { success: true, message: 'Sincronización completada (demo)' };
});

// Create the application menu
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

// App event handlers
app.whenReady().then(() => {
    createWindow();
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
