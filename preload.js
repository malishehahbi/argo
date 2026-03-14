const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    hideWindow: () => ipcRenderer.send('window-hide'),
    pinWindow: (val) => ipcRenderer.send('window-pin', val),
    fixText: (text) => ipcRenderer.invoke('fix-text', text),
    toggleWatch: (val) => ipcRenderer.invoke('toggle-watch', val),
    getHotkey: () => ipcRenderer.invoke('get-hotkey'),
    updateHotkey: (val) => ipcRenderer.invoke('update-hotkey', val),
    getWatchState: () => ipcRenderer.invoke('get-watch-state'),
    onClipboardFixed: (callback) => ipcRenderer.on('clipboard-fixed', (event, text) => callback(text))
});
