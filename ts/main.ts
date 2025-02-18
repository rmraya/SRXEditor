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


class Main {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.on('set-height', (event: Electron.IpcRendererEvent, height: number) => {
            this.setHeight(height);
        });
        (document.getElementById('openFile') as HTMLAnchorElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('open-file');
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'main', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setHeight(height: number) {
        let topbarHeight: number = (document.getElementById('toolbar') as HTMLDivElement).clientHeight;
        let bodyHeight: number = height - topbarHeight;
        let boddyPadding: number = 24;
        let labelHeight: number = (document.getElementById('label') as HTMLDivElement).clientHeight * 2;
        let buttonHeight: number = (document.getElementById('buttonArea') as HTMLDivElement).clientHeight * 2;
        let tablesHeight: number = bodyHeight - labelHeight - buttonHeight - boddyPadding;
        (document.getElementById('topContainer') as HTMLDivElement).style.height = tablesHeight / 2 + 'px';
        (document.getElementById('bottomContainer') as HTMLDivElement).style.height = tablesHeight / 2 + 'px';
    }
}