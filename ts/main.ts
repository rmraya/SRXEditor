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
import type { LanguageMap, Pair, Rule } from './model.js';

export class Main {

    selectedLanguageMap: string = '';
    selectedRule: Rule | undefined = undefined;
    yes: string = 'Yes';
    no: string = 'No';
    languagesLoaded: boolean = false;

    constructor() {
        ipcRenderer.send('get-theme');
        ipcRenderer.on('set-theme', (event: IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        ipcRenderer.on('set-height', (event: IpcRendererEvent, height: number) => {
            this.setHeight(height);
        });
        ipcRenderer.on('set-yes-no', (event: IpcRendererEvent, arg: { yes: string, no: string }) => {
            this.yes = arg.yes;
            this.no = arg.no;
        });
        (document.getElementById('openFile') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('open-file');
        });
        (document.getElementById('newFile') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('new-file');
        });
        (document.getElementById('saveFile') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('save-file');
        });
        (document.getElementById('testRules') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('test-rules');
        });
        (document.getElementById('help') as HTMLAnchorElement).addEventListener('click', () => {
            ipcRenderer.send('open-help');
        });
        (document.getElementById('addLang') as HTMLButtonElement).addEventListener('click', () => {
            this.addLanguage();
        });
        (document.getElementById('editLang') as HTMLButtonElement).addEventListener('click', () => {
            this.editLanguage();
        });
        (document.getElementById('removeLang') as HTMLButtonElement).addEventListener('click', () => {
            this.removeLanguage();
        });
        ipcRenderer.on('set-status', (event: IpcRendererEvent, status: string) => {
            this.setStatus(status);
        });
        ipcRenderer.on('set-language-map', (event: IpcRendererEvent, languageMap: Array<LanguageMap>) => {
            this.setLanguageMap(languageMap);
        });
        ipcRenderer.on('set-language-rules', (event: IpcRendererEvent, rules: Rule[]) => {
            this.setLanguageRules(rules);
        });
        ipcRenderer.on('edit-language', (event: IpcRendererEvent, rules: Rule[]) => {
            this.editLanguage();
        });
        ipcRenderer.on('remove-language', (event: IpcRendererEvent, rules: Rule[]) => {
            this.removeLanguage();
        });
        ipcRenderer.on('language-up', (event: IpcRendererEvent, rules: Rule[]) => {
            this.moveLanguageUp();
        });
        ipcRenderer.on('language-down', (event: IpcRendererEvent, rules: Rule[]) => {
            this.moveLanguageDown();
        });
        ipcRenderer.on('select-language', (event: IpcRendererEvent, languageName: string) => {
            this.selectLanguage(languageName);
        });
        ipcRenderer.on('select-rule', (event: IpcRendererEvent, rule: Rule) => {
            this.selectedRule = rule;
            this.selectRule(rule);
        });
        (document.getElementById('addRule') as HTMLButtonElement).addEventListener('click', () => {
            this.addRule();
        });
        (document.getElementById('editRule') as HTMLButtonElement).addEventListener('click', () => {
            this.editRule();
        });
        (document.getElementById('removeRule') as HTMLButtonElement).addEventListener('click', () => {
            this.removeRule();
        });
        ipcRenderer.on('add-rule', (event: IpcRendererEvent, rules: Rule[]) => {
            this.addRule();
        });
        ipcRenderer.on('edit-rule', (event: IpcRendererEvent, rules: Rule[]) => {
            this.editRule();
        });
        ipcRenderer.on('remove-rule', (event: IpcRendererEvent, rules: Rule[]) => {
            this.removeRule();
        });
        ipcRenderer.on('rule-up', (event: IpcRendererEvent, rules: Rule[]) => {
            this.moveRuleUp();
        });
        ipcRenderer.on('rule-down', (event: IpcRendererEvent, rules: Rule[]) => {
            this.moveRuleDown();
        });
        document.getElementById('moveLanguageUp')?.addEventListener('click', () => {
            this.moveLanguageUp();
        });
        document.getElementById('moveLanguageDown')?.addEventListener('click', () => {
            this.moveLanguageDown();
        });
        document.getElementById('moveRuleUp')?.addEventListener('click', () => {
            this.moveRuleUp();
        });
        document.getElementById('moveRuleDown')?.addEventListener('click', () => {
            this.moveRuleDown();
        });
        setTimeout(() => {
            ipcRenderer.send('set-height', { window: 'main', width: document.body.clientWidth, height: document.body.clientHeight });
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

    setStatus(status: string) {
        let statusDiv: HTMLDivElement = (document.getElementById('status') as HTMLDivElement);
        statusDiv.style.display = status === '' ? 'none' : 'block';
        statusDiv.innerText = status;
    }

    setLanguageMap(languageMap: Array<LanguageMap>) {
        this.languagesLoaded = languageMap.length > 0;
        let table: HTMLTableSectionElement = (document.getElementById('LanguageMap') as HTMLTableSectionElement);
        let LanguageMap: HTMLTableSectionElement = table;
        LanguageMap.innerHTML = '';
        for (let i = 0; i < languageMap.length; i++) {
            let row: HTMLTableRowElement = LanguageMap.insertRow(i);
            row.dataset.lang = languageMap[i].langName;
            let cell1: HTMLTableCellElement = row.insertCell(0);
            let cell2: HTMLTableCellElement = row.insertCell(1);
            cell1.innerHTML = languageMap[i].langName;
            cell2.innerHTML = languageMap[i].pattern;
            row.addEventListener('click', () => {
                if (this.selectedLanguageMap !== languageMap[i].langName) {
                    this.selectedLanguageMap = languageMap[i].langName;
                    ipcRenderer.send('get-language-rules', this.selectedLanguageMap);
                }
                table.getElementsByClassName('selected')[0]?.classList.remove('selected');
                row.classList.add('selected');
            });
        }
    }

    selectLanguage(languageName: string) {
        this.selectedLanguageMap = languageName;
        document.querySelectorAll('#LanguageMap tr').forEach((row) => {
            row.classList.remove('selected');
            if ((row as HTMLTableRowElement).dataset.lang === languageName) {
                row.classList.add('selected');
                row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
        ipcRenderer.send('get-language-rules', this.selectedLanguageMap);
    }

    setLanguageRules(rules: Rule[]) {
        let table: HTMLTableSectionElement = (document.getElementById('LanguageRules') as HTMLTableSectionElement);
        let LanguageRules: HTMLTableSectionElement = table;
        LanguageRules.innerHTML = '';
        for (let i = 0; i < rules.length; i++) {
            let row: HTMLTableRowElement = LanguageRules.insertRow(i);
            row.dataset.rule = JSON.stringify(rules[i]);
            let cell1: HTMLTableCellElement = row.insertCell(0);
            let cell2: HTMLTableCellElement = row.insertCell(1);
            let cell3: HTMLTableCellElement = row.insertCell(2);
            cell1.innerHTML = rules[i].break ? this.yes : this.no;
            cell1.classList.add('center');
            cell2.innerHTML = rules[i].beforeBreak || '';
            cell3.innerHTML = rules[i].afterBreak || '';
            row.addEventListener('click', () => {
                if (this.selectedRule !== rules[i]) {
                    this.selectedRule = rules[i];
                }
                table.getElementsByClassName('selected')[0]?.classList.remove('selected');
                row.classList.add('selected');
            });
        }
        if (this.selectedRule) {
            this.selectRule(this.selectedRule);
        }
    }

    selectRule(rule: Rule) {
        document.querySelectorAll('#LanguageRules tr').forEach((row) => {
            row.classList.remove('selected');
            let rowRule: Rule = JSON.parse((row as HTMLTableRowElement).dataset.rule || '{}');
            if (rowRule.break === rule.break &&
                rowRule.beforeBreak === (rule.beforeBreak || '') &&
                rowRule.afterBreak === (rule.afterBreak || '')) {
                row.classList.add('selected');
                row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
    }

    addLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        ipcRenderer.send('add-language');
    }

    editLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            ipcRenderer.send('edit-language', this.selectedLanguageMap);
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    removeLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            ipcRenderer.send('remove-language', this.selectedLanguageMap);
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    moveLanguageUp() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            ipcRenderer.send('move-language-up', this.selectedLanguageMap);
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    moveLanguageDown() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            ipcRenderer.send('move-language-down', this.selectedLanguageMap);
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    addRule() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            ipcRenderer.send('add-rule', this.selectedLanguageMap);
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    editRule() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            if (this.selectedRule !== undefined) {
                let pair: Pair = {
                    langName: this.selectedLanguageMap,
                    rule: this.selectedRule
                };
                ipcRenderer.send('edit-rule', pair);
            } else {
                ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noRuleSelected' });
            }
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    removeRule() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            if (this.selectedRule !== undefined) {
                let pair: Pair = {
                    langName: this.selectedLanguageMap,
                    rule: this.selectedRule
                };
                ipcRenderer.send('remove-rule', pair);
                this.selectedRule = undefined;
            } else {
                ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noRuleSelected' });
            }
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    moveRuleUp() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            if (this.selectedRule !== undefined) {
                let pair: Pair = {
                    langName: this.selectedLanguageMap,
                    rule: this.selectedRule
                };
                ipcRenderer.send('move-rule-up', pair);
            } else {
                ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noRuleSelected' });
            }
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }

    moveRuleDown() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            if (this.selectedRule !== undefined) {
                let pair: Pair = {
                    langName: this.selectedLanguageMap,
                    rule: this.selectedRule
                };
                ipcRenderer.send('move-rule-down', pair);
            } else {
                ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noRuleSelected' });
            }
        } else {
            ipcRenderer.send('show-message', { type: MessageTypes.warning, window: 'main', messageId: 'noLanguageSelected' });
        }
    }
}