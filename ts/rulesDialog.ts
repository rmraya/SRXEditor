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
import type { Rule } from './model.js';

export class RulesDialog {

    oldRule: Rule | undefined = undefined;
    languageName: string = '';

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-rule', (event: IpcRendererEvent, rule: Rule) => {
            this.oldRule = rule;
            (document.getElementById('breaks') as HTMLInputElement).checked = rule.break;
            (document.getElementById('beforeBreak') as HTMLInputElement).value = rule.beforeBreak ? rule.beforeBreak : '';
            (document.getElementById('afterBreak') as HTMLInputElement).value = rule.afterBreak ? rule.afterBreak : '';
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
        if (this.oldRule) {
            ipcRenderer.send('update-rule', { oldRule: this.oldRule, rule: rule, languageName: this.languageName });
        } else {
            ipcRenderer.send('save-rule', { rule: rule, languageName: this.languageName });
        }
    }
}