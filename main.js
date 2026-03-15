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
let isPinned = false;
let isWatching = store.get('isWatching', false);

// Performance optimization: disable hardware acceleration if needed, but for small app it's fine.
// app.disableHardwareAcceleration();

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
        skipTaskbar: false, // Show in taskbar when visible
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false, // Ensure clipboard watcher runs well
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));

    // Performance: Remove menu
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
    // Using a simple transparent icon or a placeholder
    // In a real scenario, you'd have tray-icon.png in assets/
    const iconPath = path.join(__dirname, 'assets/tray-icon.png');
    
    // Check if icon exists, otherwise it might crash or show nothing
    try {
        tray = new Tray(iconPath);
    } catch (e) {
        // Fallback or empty tray icon
        console.error("Tray icon not found at", iconPath);
        // Create an empty tray if possible or handle gracefully
        // For development, we might not have the PNG yet
    }

    if (tray) {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show Argo by neorw', click: () => mainWindow ? mainWindow.show() : createWindow() },
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

        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
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
            { label: 'Show Argo by neorw', click: () => mainWindow ? mainWindow.show() : createWindow() },
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
        toggleWatch(true);
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
    if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
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
