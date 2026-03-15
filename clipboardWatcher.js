const { clipboard } = require('electron');
const { fixArabic } = require('./textFixer');

let lastText = '';
let watchInterval = null;

function startWatching(onFixCallback) {
    if (watchInterval) return;
    
    // Initialize with current clipboard
    lastText = clipboard.readText();

    watchInterval = setInterval(() => {
        try {
            const text = clipboard.readText();
            
            // Only proceed if clipboard text changed
            if (text && text !== lastText) {
                // Arabic detection regex: /[\u0600-\u06FF]/
                if (/[\u0600-\u06FF]/.test(text)) {
                    const fixed = fixArabic(text);
                    
                    // Only write back if it actually changed during fixing
                    if (fixed !== text) {
                        clipboard.writeText(fixed);
                        // Update lastText to the fixed version to avoid loop
                        lastText = fixed;
                        if (onFixCallback) onFixCallback(fixed);
                        return;
                    }
                }
                // Even if not Arabic, update lastText to track it
                lastText = text;
            }
        } catch (err) {
            console.error('Clipboard watcher error:', err);
        }
    }, 500);
}

function stopWatching() {
    if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
    }
}

module.exports = { startWatching, stopWatching };
