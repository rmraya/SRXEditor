/*******************************************************************************
 * Copyright (c) 2008-2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

class Settings {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.send('get-preferences');
        this.electron.ipcRenderer.on('set-preferences', (event: Electron.IpcRendererEvent, preferences: Preferences) => {
            (document.getElementById('appLangSelect') as HTMLSelectElement).value = preferences.language;
            (document.getElementById('themeColor') as HTMLSelectElement).value = preferences.theme;
        });
        (document.getElementById('saveSettings') as HTMLButtonElement).addEventListener('click', () => {
            this.saveSettings();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'settings', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveSettings() {
        let language: string = (document.getElementById('appLangSelect') as HTMLSelectElement).value;
        let theme: string = (document.getElementById('themeColor') as HTMLSelectElement).value;
        let preferences: Preferences = { language: language, theme: theme };
        this.electron.ipcRenderer.send('save-preferences', preferences);
    }
}