import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
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

export function deactivate(context: vscode.ExtensionContext) {
    // Play power off sound when extension deactivates
    let soundManager = new FalloutSoundManager(context);
    soundManager.playPowerOffSound();
}

class FalloutSoundManager implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];
    private lastSoundTime: number = 0;
    private soundDelay: number = 50; // milliseconds
    private enabled: boolean = true;
    private volume: number = 0.5;
    private keystrokeSounds: string[] = [];

    constructor(context: vscode.ExtensionContext) {
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

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('falloutSounds');
        this.enabled = config.get('enabled', true);
        this.volume = config.get('volume', 0.5);
        this.soundDelay = config.get('keystrokeDelay', 50);
    }

    private initializeSounds(): void {
        // Initialize keystroke sound file paths
        for (let i = 0; i <= 10; i++) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', `k${i}.wav`);
            this.keystrokeSounds.push(soundPath);
        }
    }

    private setupTextChangeListener(): void {
        let textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
            if (this.enabled && event.contentChanges.length > 0) {
                this.playKeystrokeSound();
            }
        });
        this.disposables.push(textChangeListener);
    }

    private playKeystrokeSound(): void {
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

    public playPowerOnSound(): void {
        if (this.enabled) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', 'poweron.wav');
            this.playSound(soundPath);
        }
    }

    public playPowerOffSound(): void {
        if (this.enabled) {
            const soundPath = path.join(this.context.extensionPath, 'sounds', 'poweroff.wav');
            this.playSound(soundPath);
        }
    }

    private playSound(soundPath: string): void {
        try {
            // Use platform-appropriate sound playing command
            let command: string;
            
            if (process.platform === 'win32') {
                // Windows: Use PowerShell to play sound
                command = `powershell -c "(New-Object Media.SoundPlayer '${soundPath}').PlaySync();"`;
            } else if (process.platform === 'darwin') {
                // macOS: Use afplay
                command = `afplay "${soundPath}"`;
            } else {
                // Linux: Use aplay or paplay
                command = `aplay "${soundPath}" 2>/dev/null || paplay "${soundPath}" 2>/dev/null`;
            }

            exec(command, (error) => {
                if (error) {
                    console.log(`Sound playback error: ${error.message}`);
                }
            });
        } catch (error) {
            console.log(`Failed to play sound: ${error}`);
        }
    }

    public enable(): void {
        this.enabled = true;
        const config = vscode.workspace.getConfiguration('falloutSounds');
        config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }

    public disable(): void {
        this.enabled = false;
        const config = vscode.workspace.getConfiguration('falloutSounds');
        config.update('enabled', false, vscode.ConfigurationTarget.Global);
    }

    dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
    }
}