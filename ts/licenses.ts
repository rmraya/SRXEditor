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

class Licenses {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        (document.getElementById('SRXEditor') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('SRXEditor');
        });
        (document.getElementById('electron') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('electron');
        });
        (document.getElementById('TypesXML') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('TypesXML');
        });
        (document.getElementById('TypesBCP47') as HTMLAnchorElement).addEventListener('click', () => {
            this.openLicense('TypesBCP47');
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-licenses');
            }
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'licenses', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    openLicense(type: string) {
        this.electron.ipcRenderer.send('open-license', type);
    }
}
