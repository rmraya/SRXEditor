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

export interface HeaderValues {
    cascade: 'yes' | 'no';
    segmentsubflows: 'yes' | 'no';
    includeStart: 'yes' | 'no';
    includeEnd: 'yes' | 'no';
    includeIsolated: 'yes' | 'no';
}

export class HeaderDialog {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });

        ipcRenderer.on('set-header', (event: IpcRendererEvent, header: HeaderValues) => {
            this.setHeader(header);
        });

        (document.getElementById('saveHeader') as HTMLButtonElement).addEventListener('click', () => {
            this.saveHeader();
        });

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveHeader();
            }
        });

        ipcRenderer.send('get-header');

        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'headerDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    setHeader(header: HeaderValues): void {
        (document.getElementById('cascade') as HTMLSelectElement).value = header.cascade;
        (document.getElementById('segmentsubflows') as HTMLSelectElement).value = header.segmentsubflows;
        (document.getElementById('includeStart') as HTMLSelectElement).value = header.includeStart;
        (document.getElementById('includeEnd') as HTMLSelectElement).value = header.includeEnd;
        (document.getElementById('includeIsolated') as HTMLSelectElement).value = header.includeIsolated;
    }

    saveHeader(): void {
        const header: HeaderValues = {
            cascade: (document.getElementById('cascade') as HTMLSelectElement).value as 'yes' | 'no',
            segmentsubflows: (document.getElementById('segmentsubflows') as HTMLSelectElement).value as 'yes' | 'no',
            includeStart: (document.getElementById('includeStart') as HTMLSelectElement).value as 'yes' | 'no',
            includeEnd: (document.getElementById('includeEnd') as HTMLSelectElement).value as 'yes' | 'no',
            includeIsolated: (document.getElementById('includeIsolated') as HTMLSelectElement).value as 'yes' | 'no'
        };
        ipcRenderer.send('save-header', header);
    }
}
