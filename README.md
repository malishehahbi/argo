# Argo by neorw

Argo by neorw is a high-performance, lightweight Electron utility designed to provide Arabic text support for Affinity applications, including Affinity Designer, Affinity Photo, and Affinity Publisher. It solves the lack of native Right-to-Left (RTL) rendering and character shaping by intercepting Arabic text, applying necessary transformations, and returning correctly formatted text for use within the Affinity suite.

## Primary Functionality

The application addresses two critical requirements for Arabic text display:
1. Character Shaping: Converting Arabic characters into their correct positional forms (Initial, Medial, Final, or Isolated).
2. Bidirectional Reordering: Reordering the text segments to ensure the visual order is correct for RTL display.

## Key Features

### Manual and Automatic Correction
Users can manually paste text into the application to receive a fixed version, or use the global hotkey to automatically process selected text in any Affinity app.

### Global Hotkey Integration
By default, pressing Alt+= will trigger an automated sequence:
1. The application copies the currently selected text.
2. The text is processed through the Arabic shaping and reordering engine.
3. The corrected text is pasted back into the active application.

### Clipboard Watch Mode
When enabled, the application monitors the system clipboard in the background. Any Arabic text copied to the clipboard is automatically reshaped and reordered, allowing for a seamless "copy from browser, paste to Affinity" workflow.

### Modern Minimal Interface
The UI follows a modern design language with a focus on simplicity:
- Frameless, draggable window.
- Always-on-top pinning support (enabled by default).
- Bubble expansion for editing larger blocks of text.
- Integrated system tray support for background operation.

## Architecture and Performance

Argo by neorw is built with performance as a priority, utilizing a minimal footprint:
- Zero heavy UI frameworks (No React, Vue, or Angular).
- Built using Vanilla JavaScript, HTML, and CSS.
- Optimized startup time and memory usage.

## Installation and Development

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm

### Setup
1. Clone the repository to your local machine.
2. Run the following command to install dependencies:
   ```bash
   npm install
   ```

### Running the Application
To start the application in development mode:
```bash
npm start
```

### Building for Production
To generate an optimized, standalone executable for Windows or macOS:
```bash
npm run build
```

## Configuration

Settings are automatically persisted using a local store:
- Hotkey: Users can change the global shortcut by clicking the hotkey display in the footer.
- Watch State: The clipboard monitor state is saved across sessions.
- Pin State: The always-on-top preference is remembered.

## Project Structure

- main.js: Primary Electron process management and IPC handling.
- textFixer.js: Core Arabic processing logic.
- automation.js: Simulated keyboard input for the global hotkey workflow.
- hotkeyManager.js: Management of global system shortcuts.
- clipboardWatcher.js: Background clipboard monitoring logic.
- ui/: Frontend assets including HTML, CSS, and the renderer process.
- assets/: Application icons and static resources.

## License

This project is released under the MIT License.
