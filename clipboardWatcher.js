const { clipboard } = require('electron');
const { fixArabic } = require('./textFixer');

let lastText = '';
let watchInterval = null;

function startWatching(onFixCallback) {
    if (watchInterval) return;
    
    // Initialize with current clipboard to avoid immediate re-fix
    lastText = clipboard.readText();

    watchInterval = setInterval(() => {
        const text = clipboard.readText();
        
        if (text && text !== lastText) {
            // Arabic detection regex: /[\u0600-\u06FF]/
            if (/[\u0600-\u06FF]/.test(text)) {
                const fixed = fixArabic(text);
                
                // Only write back if it actually changed
                if (fixed !== text) {
                    clipboard.writeText(fixed);
                    lastText = fixed;
                    if (onFixCallback) onFixCallback(fixed);
                    return;
                }
            }
            lastText = text;
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
