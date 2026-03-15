const { keyboard, Key } = require('@nut-tree-fork/nut-js');
const { clipboard } = require('electron');
const { fixArabic } = require('./textFixer');

async function autoFix() {
    try {
        const modifier = process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl;
        
        // 1. Reduced delay for faster response (200ms instead of 500ms)
        await new Promise(r => setTimeout(r, 200));

        // 2. Faster canary check
        const canary = `A_${Date.now()}`;
        clipboard.writeText(canary);

        // 3. Perform Copy (Manual sequence is usually most reliable)
        await keyboard.pressKey(modifier);
        await keyboard.pressKey(Key.C);
        await new Promise(r => setTimeout(r, 20)); // Micro delay
        await keyboard.releaseKey(Key.C);
        await keyboard.releaseKey(modifier);
        
        // 4. Faster Polling (check every 30ms, max 15 tries = 450ms total wait)
        let originalText = '';
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 30));
            originalText = clipboard.readText();
            if (originalText && originalText !== canary) break;
        }

        if (!originalText || originalText === canary || !originalText.trim()) return;
        if (!/[\u0600-\u06FF]/.test(originalText)) return;

        // 5. Fix Arabic (Fast CPU operation)
        const fixedText = fixArabic(originalText);
        clipboard.writeText(fixedText);
        
        // 6. Minimal delay before paste
        await new Promise(r => setTimeout(r, 50));
        
        // 7. Perform Paste
        await keyboard.pressKey(modifier);
        await keyboard.pressKey(Key.V);
        await new Promise(r => setTimeout(r, 20));
        await keyboard.releaseKey(Key.V);
        await keyboard.releaseKey(modifier);

    } catch (err) {
        console.error('Automation error:', err);
    }
}

module.exports = { autoFix };
