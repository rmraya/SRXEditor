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
import type { Rule, Pair } from './model.js';

export class RulesDialog {

    oldPair: Pair | undefined = undefined;
    languageName: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-pair', (event: IpcRendererEvent, pair: Pair) => {
            this.oldPair = pair;
            (document.getElementById('breaks') as HTMLInputElement).checked = pair.rule.break;
            (document.getElementById('beforeBreak') as HTMLInputElement).value = pair.rule.beforeBreak ? pair.rule.beforeBreak : '';
            (document.getElementById('afterBreak') as HTMLInputElement).value = pair.rule.afterBreak ? pair.rule.afterBreak : '';
        });
        ipcRenderer.on('set-language-name', (event: IpcRendererEvent, languageName: string) => {
            this.languageName = languageName;
        });
        document.getElementById('save')!.addEventListener('click', () => {
            this.saveRule();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'rulesDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveRule(): void {
        let breaks: boolean = (document.getElementById('breaks') as HTMLInputElement).checked;
        let beforeBreak: string = (document.getElementById('beforeBreak') as HTMLInputElement).value;
        let afterBreak: string = (document.getElementById('afterBreak') as HTMLInputElement).value;
        if (beforeBreak.length === 0 && afterBreak.length === 0) {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'rulesDialog', messageId: 'emptyBeforeAfter' });
            return;
        }
        let rule: Rule = { break: breaks, beforeBreak: beforeBreak, afterBreak: afterBreak };
        if (this.oldPair) {
            let pair: Pair = { rule: rule, langName: this.languageName };
            ipcRenderer.send('update-pair', { oldPair: this.oldPair, pair: pair });
        } else {
            let pair: Pair = { rule: rule, langName: this.languageName };
            ipcRenderer.send('save-pair', pair);
        }
    }
}