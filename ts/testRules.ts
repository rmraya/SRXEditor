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
import { Language, LanguageUtils } from "typesbcp47";
import { MessageTypes } from "./messageTypes.js";

export class TestRules {

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.send('get-locale');
        ipcRenderer.on('set-locale', (event: IpcRendererEvent, locale: string) => {
            let languages: Language[] = LanguageUtils.getLanguages(locale);
            const srcLangSelect: HTMLSelectElement = document.getElementById('srcLangSelect') as HTMLSelectElement;
            for (let lang of languages) {
                let option: HTMLOptionElement = document.createElement('option');
                option.value = lang.code;
                option.text = lang.description;
                srcLangSelect.appendChild(option);
            }
        });
        document.getElementById('testButton')?.addEventListener('click', () => {
            this.testRules();
        });
        window.addEventListener('resize', () => {
            const buttonsHeight: number = (document.getElementById('buttonArea') as HTMLDivElement).offsetHeight;
            const newHeight: number = document.body.clientHeight - buttonsHeight - 32; // 32: padding
            (document.getElementById('testTable') as HTMLTableElement).style.height = newHeight + 'px';
        });
        (document.getElementById('testBox') as HTMLTextAreaElement).focus();
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'testRules', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 100);
    }

    testRules(): void {
        let text: string = (document.getElementById('testBox') as HTMLTextAreaElement).value;
        if (text.trim().length === 0) {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'testRules', messageId: 'emptyText' });
            return;
        }
        let srcLang: string = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        ipcRenderer.send('test-rules', { text: text, srcLang: srcLang });
    }
}