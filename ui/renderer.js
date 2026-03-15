const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const clearBtn = document.getElementById('clearBtn');
const pinBtn = document.getElementById('pinBtn');
const hideBtn = document.getElementById('hideBtn');
const copyBtn = document.getElementById('copyBtn');
const watchToggle = document.getElementById('watchToggle');
const hotkeyLabel = document.getElementById('hotkeyLabel');
const hotkeySetting = document.getElementById('hotkeySetting');
const bubbleOverlay = document.getElementById('bubbleOverlay');
const bubbleTextarea = document.getElementById('bubbleTextarea');
const closeBubble = document.getElementById('closeBubble');
const expandBtns = document.querySelectorAll('.expand-btn');
const header = document.getElementById('header');

let isPinned = false;
let isRecordingHotkey = false;

// Disable double-click maximize
header.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

// Initialize
async function init() {
    try {
        const hotkey = await window.api.getHotkey();
        updateHotkeyDisplay(hotkey);
        
        const watchState = await window.api.getWatchState();
        watchToggle.checked = watchState;

        isPinned = await window.api.getPinState();
        pinBtn.classList.toggle('active', isPinned);
        pinBtn.style.color = isPinned ? 'var(--accent-color)' : '#86868b';
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

function updateHotkeyDisplay(hotkey) {
    if (!hotkey) return;
    hotkeyLabel.innerText = hotkey
        .replace('CommandOrControl', 'Ctrl')
        .replace('Control', 'Ctrl')
        .replace('Plus', '+');
}

init();

// Text Fixing
inputArea.addEventListener('input', async () => {
    const text = inputArea.value;
    try {
        if (text) {
            const fixed = await window.api.fixText(text);
            outputArea.value = fixed;
        } else {
            outputArea.value = '';
        }
    } catch (err) {
        console.error('Error fixing text:', err);
    }
});

// Clear All
clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    outputArea.value = '';
    if (!bubbleOverlay.classList.contains('hidden')) {
        bubbleTextarea.value = '';
    }
});

// Pin Window
pinBtn.addEventListener('click', () => {
    isPinned = !isPinned;
    window.api.pinWindow(isPinned);
    pinBtn.classList.toggle('active', isPinned);
    // SVG color handling
    pinBtn.style.color = isPinned ? 'var(--accent-color)' : '#86868b';
});

// Hide Window
hideBtn.addEventListener('click', () => {
    window.api.hideWindow();
});

// Copy Result
copyBtn.addEventListener('click', async () => {
    const text = outputArea.value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        copyBtn.style.background = '#34c759';
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.background = 'var(--accent-color)';
        }, 1500);
    } catch (err) {
        console.error('Failed to copy!', err);
        copyBtn.innerText = 'Failed';
        copyBtn.style.background = '#ff3b30';
        setTimeout(() => {
            copyBtn.innerText = 'Copy Result';
            copyBtn.style.background = 'var(--accent-color)';
        }, 1500);
    }
});

// Toggle Watch
watchToggle.addEventListener('change', async () => {
    try {
        await window.api.toggleWatch(watchToggle.checked);
    } catch (err) {
        console.error('Toggle watch error:', err);
    }
});

// Hotkey Recording
hotkeySetting.addEventListener('click', () => {
    if (isRecordingHotkey) return;
    isRecordingHotkey = true;
    hotkeySetting.classList.add('recording');
    hotkeyLabel.innerText = 'Press keys...';
});

window.addEventListener('keydown', async (e) => {
    if (!isRecordingHotkey) return;
    
    e.preventDefault();
    
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('CommandOrControl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');
    if (e.metaKey) modifiers.push('Command');
    
    // If a non-modifier key is pressed
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        let key = e.key.toUpperCase();
        if (key === ' ') key = 'Space';
        
        const newHotkey = [...new Set(modifiers), key].join('+');
            
        try {
            const success = await window.api.updateHotkey(newHotkey);
            if (success) {
                updateHotkeyDisplay(newHotkey);
            } else {
                hotkeyLabel.innerText = 'Invalid';
                setTimeout(async () => {
                    const h = await window.api.getHotkey();
                    updateHotkeyDisplay(h);
                }, 1000);
            }
        } catch (err) {
            console.error('Update hotkey error:', err);
        }
        
        isRecordingHotkey = false;
        hotkeySetting.classList.remove('recording');
    }
});

// Bubble Overlay
let currentTargetArea = null;

expandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        currentTargetArea = document.getElementById(targetId);
        
        bubbleTextarea.value = currentTargetArea.value;
        bubbleTextarea.readOnly = currentTargetArea.readOnly;
        bubbleTextarea.placeholder = currentTargetArea.placeholder;
        
        bubbleOverlay.classList.remove('hidden');
        bubbleTextarea.focus();
    });
});

bubbleTextarea.addEventListener('input', async () => {
    if (currentTargetArea && !currentTargetArea.readOnly) {
        currentTargetArea.value = bubbleTextarea.value;
        // Trigger manual fix if it's the input area
        if (currentTargetArea.id === 'inputArea') {
            try {
                const fixed = await window.api.fixText(bubbleTextarea.value);
                outputArea.value = fixed;
            } catch (err) {
                console.error('Error fixing text from bubble:', err);
            }
        }
    }
});

closeBubble.addEventListener('click', () => {
    bubbleOverlay.classList.add('hidden');
    currentTargetArea = null;
});

// Handle Escape to close bubble
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !bubbleOverlay.classList.contains('hidden')) {
        bubbleOverlay.classList.add('hidden');
        currentTargetArea = null;
    }
});

// Clipboard Fixed event from Main
window.api.onClipboardFixed((text) => {
    outputArea.value = text;
    // If bubble is open and showing output, update it too
    if (!bubbleOverlay.classList.contains('hidden') && currentTargetArea && currentTargetArea.id === 'outputArea') {
        bubbleTextarea.value = text;
    }
});

// Watch State Changed event from Main (Tray Sync)
window.api.onWatchStateChanged((val) => {
    watchToggle.checked = val;
});
