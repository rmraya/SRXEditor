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

import { ipcRenderer, IpcRendererEvent } from "electron";

export class TestResults {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-segments');
        ipcRenderer.on('set-segments', (event: IpcRendererEvent, results: string[]) => {
            this.showSegments(results);
        });        
        window.addEventListener('resize', () => {
            let divContainer: HTMLDivElement = document.getElementById('container') as HTMLDivElement;
            divContainer.style.height = (window.innerHeight - 16) + 'px';
        });
    }

    showSegments(results: string[]): void {
        const resultsTable :HTMLTableElement= document.getElementById('resultsTable') as HTMLTableElement;
        resultsTable.innerHTML = '';
        for (let i : number= 0; i < results.length; i++) {
            let row: HTMLTableRowElement = resultsTable.insertRow();
            let cellNum: HTMLTableCellElement = row.insertCell();
            cellNum.textContent = (i + 1).toString();
            let cell: HTMLTableCellElement = row.insertCell();
            cell.innerHTML = this.highlightWhitespace(results[i]);
        }
    }

    private highlightWhitespace(value: string): string {
        if (!value) {
            return '';
        }
        let startIndex: number = 0;
        while (startIndex < value.length && this.isSpaceOrTab(value.charAt(startIndex))) {
            startIndex++;
        }
        let endIndex: number = value.length - 1;
        while (endIndex >= startIndex && this.isSpaceOrTab(value.charAt(endIndex))) {
            endIndex--;
        }
        const leading: string = value.substring(0, startIndex);
        const middle: string = value.substring(startIndex, endIndex + 1);
        const trailing: string = startIndex === value.length ? '' : value.substring(endIndex + 1);
        const highlightedLeading: string = this.generateSpans(leading);
        const highlightedTrailing: string = this.generateSpans(trailing);
        return highlightedLeading + this.escapeHtml(middle) + highlightedTrailing;
    }

    private isSpaceOrTab(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\u00A0';
    }

    private generateSpans(whitespace: string): string {
        if (!whitespace) {
            return '';
        }
        let nbspCount: number = 0;
        for (const char of whitespace) {
            if (char === '\t') {
                nbspCount += 4;
            } else if (char === ' ' || char === '\u00A0') {
                nbspCount += 1;
            }
        }
        return '<span class="highlight">' + '&nbsp;'.repeat(nbspCount) + '</span>';
    }

    private escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}