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

class RulesDialog {

    electron = require('electron');
    oldRule: Rule | undefined = undefined;

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-rule', (event: Electron.IpcRendererEvent, rule: Rule) => {
            this.oldRule = rule;
            (document.getElementById('breaks') as HTMLInputElement).checked = rule.break;
            (document.getElementById('beforeBreak') as HTMLInputElement).value = rule.beforeBreak ? rule.beforeBreak : '';
            (document.getElementById('afterBreak') as HTMLInputElement).value = rule.afterBreak ? rule.afterBreak : '';
        });
        document.getElementById('save')!.addEventListener('click', () => {
            this.saveRule();
        });
        setTimeout(() => {
            this.electron.ipcRenderer.send('set-height', { window: 'rulesDialog', width: document.body.clientWidth, height: document.body.clientHeight });
        }, 200);
    }

    saveRule(): void {
        let breaks: boolean = (document.getElementById('breaks') as HTMLInputElement).checked;
        let beforeBreak: string = (document.getElementById('beforeBreak') as HTMLInputElement).value;
        let afterBreak: string = (document.getElementById('afterBreak') as HTMLInputElement).value;
        if (beforeBreak.length === 0 && afterBreak.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'emptyBeforeAfter' });
            return;
        }
        let rule: Rule = { break: breaks, beforeBreak: beforeBreak, afterBreak: afterBreak };
        if (this.oldRule) {
            this.electron.ipcRenderer.send('update-rule', this.oldRule, rule);
        } else {
            this.electron.ipcRenderer.send('save-rule', rule);
        }
    }
}