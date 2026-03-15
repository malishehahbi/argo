const { globalShortcut } = require('electron');
const Store = require('electron-store');
const store = new (Store.default || Store)();

let currentHotkey = store.get('hotkey', 'Alt+=');

function registerHotkey(onTrigger) {
    // Unregister everything before re-registering
    globalShortcut.unregisterAll();
    
    try {
        const success = globalShortcut.register(currentHotkey, () => {
            onTrigger();
        });
        
        if (!success) {
            console.error(`Hotkey registration failed: ${currentHotkey}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`Invalid hotkey syntax: ${currentHotkey}`, err);
        return false;
    }
}

function updateHotkey(newHotkey, onTrigger) {
    // Basic validation could be done here or in renderer
    currentHotkey = newHotkey;
    store.set('hotkey', newHotkey);
    return registerHotkey(onTrigger);
}

function getHotkey() {
    return currentHotkey;
}

module.exports = { registerHotkey, updateHotkey, getHotkey };
