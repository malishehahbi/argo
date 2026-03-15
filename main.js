const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Modules
const { autoFix } = require('./automation');
const { fixArabic } = require('./textFixer');
const { startWatching, stopWatching } = require('./clipboardWatcher');
const { registerHotkey, updateHotkey, getHotkey } = require('./hotkeyManager');

const store = new (Store.default || Store)();
let mainWindow;
let tray;
let isPinned = store.get('isPinned', true);
let isWatching = store.get('isWatching', false);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 360,
        height: 220,
        frame: false,
        transparent: false,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        alwaysOnTop: isPinned,
        skipTaskbar: false,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));

    // Remove menu
    mainWindow.setMenu(null);

    // DevTools disabled in production
    if (app.isPackaged) {
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets/icon.png');
    
    try {
        tray = new Tray(iconPath);
    } catch (e) {
        console.error("Tray icon not found at", iconPath);
    }

    if (tray) {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show Argo by neorw', click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }},
            { 
                label: 'Toggle Clipboard Watch', 
                type: 'checkbox', 
                checked: isWatching, 
                click: (item) => toggleWatch(item.checked) 
            },
            { type: 'separator' },
            { label: 'Quit', click: () => {
                app.isQuitting = true;
                app.quit();
            }}
        ]);

        tray.setToolTip('Argo by neorw');
        tray.setContextMenu(contextMenu);

        // Single click toggle
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            } else {
                createWindow();
            }
        });
    }
}

function toggleWatch(val) {
    isWatching = val;
    store.set('isWatching', val);
    
    // Notify renderer to sync UI
    if (mainWindow) {
        mainWindow.webContents.send('watch-state-changed', val);
    }

    if (isWatching) {
        startWatching((fixed) => {
            if (mainWindow) mainWindow.webContents.send('clipboard-fixed', fixed);
        });
    } else {
        stopWatching();
    }
    
    // Sync tray menu if it exists
    if (tray) {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show Argo by neorw', click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }},
            { 
                label: 'Toggle Clipboard Watch', 
                type: 'checkbox', 
                checked: isWatching, 
                click: (item) => toggleWatch(item.checked) 
            },
            { type: 'separator' },
            { label: 'Quit', click: () => {
                app.isQuitting = true;
                app.quit();
            }}
        ]);
        tray.setContextMenu(contextMenu);
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Register initial hotkey
    registerHotkey(() => {
        autoFix();
    });

    // Initialize clipboard watch state
    if (isWatching) {
        startWatching((fixed) => {
            if (mainWindow) mainWindow.webContents.send('clipboard-fixed', fixed);
        });
    }
});

// Prevent app from quitting when window is closed (unless Quitting from Tray)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Keep running
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

// IPC Handlers
ipcMain.on('window-hide', () => {
    if (mainWindow) mainWindow.hide();
});

ipcMain.on('window-pin', (event, val) => {
    isPinned = val;
    store.set('isPinned', val);
    if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
});

ipcMain.handle('get-pin-state', () => {
    return isPinned;
});

ipcMain.handle('fix-text', (event, text) => {
    return fixArabic(text);
});

ipcMain.handle('toggle-watch', (event, val) => {
    toggleWatch(val);
    return isWatching;
});

ipcMain.handle('get-hotkey', () => {
    return getHotkey();
});

ipcMain.handle('update-hotkey', (event, val) => {
    const success = updateHotkey(val, () => autoFix());
    return success;
});

ipcMain.handle('get-watch-state', () => {
    return isWatching;
});
