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
import { MessageTypes } from './messageTypes.js';
import { LanguageMap } from './model.js';

export class LanguageDialog {

    oldLanguage: LanguageMap | undefined = undefined;

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-language', (event: IpcRendererEvent, language: LanguageMap) => {
            this.oldLanguage = language;
            (document.getElementById('langName') as HTMLInputElement).value = language.langName;
            (document.getElementById('pattern') as HTMLInputElement).value = language.pattern;
        });
        document.getElementById('save')!.addEventListener('click', () => {
            this.saveLanguage();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'languageDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveLanguage(): void {
        let langName: string = (document.getElementById('langName') as HTMLInputElement).value.trim();
        if (langName.length === 0) {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'emptyLangName' });
            return;
        }
        let pattern: string = (document.getElementById('pattern') as HTMLInputElement).value.trim();
        if (pattern.length === 0) {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'emptyPattern' });
            return;
        }
        let language: LanguageMap = { langName: langName, pattern: pattern };
        if (this.oldLanguage) {
            ipcRenderer.send('update-language', { oldLanguage: this.oldLanguage, language: language });
        } else {
            ipcRenderer.send('save-language', language);
        }
    }
}