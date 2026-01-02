/*******************************************************************************
 * Copyright (c) 2008-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { Preferences } from './preferences.js';
export class Settings {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-preferences');
        ipcRenderer.on('set-preferences', (event: IpcRendererEvent, preferences: Preferences) => {
            (document.getElementById('appLangSelect') as HTMLSelectElement).value = preferences.language;
            (document.getElementById('themeColor') as HTMLSelectElement).value = preferences.theme;
        });
        (document.getElementById('saveSettings') as HTMLButtonElement).addEventListener('click', () => {
            this.saveSettings();
        });

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveSettings();
            }
            if (event.code === 'Escape') {
                ipcRenderer.send('close-preferences');
            }
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'settings', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveSettings() {
        let language: string = (document.getElementById('appLangSelect') as HTMLSelectElement).value;
        let theme: string = (document.getElementById('themeColor') as HTMLSelectElement).value;
        let preferences: Preferences = { language: language, theme: theme };
        ipcRenderer.send('save-preferences', preferences);
    }
}