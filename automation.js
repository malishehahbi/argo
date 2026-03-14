const { keyboard, Key } = require('@nut-tree-fork/nut-js');
const { clipboard } = require('electron');
const { fixArabic } = require('./textFixer');

async function autoFix() {
    try {
        const modifier = process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl;
        
        // Short delay to avoid key conflicts
        await new Promise(r => setTimeout(r, 100));

        // 1. Copy selected text
        await keyboard.type(modifier, Key.C);
        
        // 2. Wait for clipboard to update
        await new Promise(r => setTimeout(r, 150));
        
        const originalText = clipboard.readText();
        if (!originalText || !originalText.trim()) return;

        // 3. Fix Arabic
        const fixedText = fixArabic(originalText);
        
        // 4. Update clipboard
        clipboard.writeText(fixedText);
        
        // 5. Paste corrected text
        await keyboard.type(modifier, Key.V);
    } catch (err) {
        console.error('Automation error:', err);
    }
}

module.exports = { autoFix };
