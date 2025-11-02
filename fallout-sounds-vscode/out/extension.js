"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function activate(context) {
    console.log('Fallout Terminal Sounds extension is now active!');
    let soundManager = new FalloutSoundManager(context);
    // Play power on sound when extension activates
    soundManager.playPowerOnSound();
    // Register commands
    let enableCommand = vscode.commands.registerCommand('fallout-sounds.enable', () => {
        soundManager.enable();
        vscode.window.showInformationMessage('Fallout Terminal Sounds enabled!');
    });
    let disableCommand = vscode.commands.registerCommand('fallout-sounds.disable', () => {
        soundManager.disable();
        vscode.window.showInformationMessage('Fallout Terminal Sounds disabled!');
    });
    context.subscriptions.push(enableCommand);
    context.subscriptions.push(disableCommand);
    context.subscriptions.push(soundManager);
}
exports.activate = activate;
function deactivate(context) {
    // Play power off sound when extension deactivates
    let soundManager = new FalloutSoundManager(context);
    soundManager.playPowerOffSound();
}
exports.deactivate = deactivate;
class FalloutSoundManager {
    constructor(context) {
        this.disposables = [];
        this.lastSoundTime = 0;
        this.soundDelay = 50; // milliseconds
        this.enabled = true;
        this.volume = 0.5;
        this.keystrokeSounds = [];
        this.context = context;
        this.loadConfiguration();
        this.initializeSounds();
        this.setupTextChangeListener();
        // Listen for configuration changes
        let configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('falloutSounds')) {
                this.loadConfiguration();
            }
        });
        this.disposables.push(configListener);
    }
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('falloutSounds');
        this.enabled = config.get('enabled', true);
        this.volume = config.get('volume', 0.5);
        this.soundDelay = config.get('keystrokeDelay', 50);
    }
    initializeSounds() {
        // Initialize keystroke sound file paths
        for (let i = 0; i <= 10; i++) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', `k${i}.wav`);
            this.keystrokeSounds.push(soundPath);
        }
    }
    setupTextChangeListener() {
        let textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
            if (this.enabled && event.contentChanges.length > 0) {
                this.playKeystrokeSound();
            }
        });
        this.disposables.push(textChangeListener);
    }
    playKeystrokeSound() {
        const now = Date.now();
        if (now - this.lastSoundTime < this.soundDelay) {
            return; // Too soon since last sound
        }
        this.lastSoundTime = now;
        // Select a random keystroke sound
        const randomIndex = Math.floor(Math.random() * this.keystrokeSounds.length);
        const soundPath = this.keystrokeSounds[randomIndex];
        this.playSound(soundPath);
    }
    playPowerOnSound() {
        if (this.enabled) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', 'poweron.wav');
            this.playSound(soundPath);
        }
    }
    playPowerOffSound() {
        if (this.enabled) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', 'poweroff.wav');
            this.playSound(soundPath);
        }
    }
    playSound(soundPath) {
        try {
            // Use platform-appropriate sound playing command
            let command;
            if (process.platform === 'win32') {
                // Windows: Use PowerShell to play sound
                command = `powershell -c "(New-Object Media.SoundPlayer '${soundPath}').PlaySync();"`;
            }
            else if (process.platform === 'darwin') {
                // macOS: Use afplay
                command = `afplay "${soundPath}"`;
            }
            else {
                // Linux: Use aplay or paplay
                command = `aplay "${soundPath}" 2>/dev/null || paplay "${soundPath}" 2>/dev/null`;
            }
            (0, child_process_1.exec)(command, (error) => {
                if (error) {
                    console.log(`Sound playback error: ${error.message}`);
                }
            });
        }
        catch (error) {
            console.log(`Failed to play sound: ${error}`);
        }
    }
    enable() {
        this.enabled = true;
        const config = vscode.workspace.getConfiguration('falloutSounds');
        config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }
    disable() {
        this.enabled = false;
        const config = vscode.workspace.getConfiguration('falloutSounds');
        config.update('enabled', false, vscode.ConfigurationTarget.Global);
    }
    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
    }
}
//# sourceMappingURL=extension.js.map