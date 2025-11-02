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
    selectedLanguageMap: string = '';
    selectedRule: Rule | undefined = undefined;
    yes: string = 'Yes';
    no: string = 'No';
    languagesLoaded: boolean = false;

    constructor() {
        this.electron.ipcRenderer.on('set-height', (event: Electron.IpcRendererEvent, height: number) => {
            this.setHeight(height);
        });
        this.electron.ipcRenderer.on('set-yes-no', (event: Electron.IpcRendererEvent, arg: { yes: string, no: string }) => {
            this.yes = arg.yes;
            this.no = arg.no;
        });
        (document.getElementById('openFile') as HTMLAnchorElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('open-file');
        });
        (document.getElementById('newFile') as HTMLAnchorElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('new-file');
        });
        (document.getElementById('saveFile') as HTMLAnchorElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('save-file');
        });
        (document.getElementById('help') as HTMLAnchorElement).addEventListener('click', () => {
            this.electron.ipcRenderer.send('open-help');
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
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, theme: string) => {
            (document.getElementById('theme') as HTMLLinkElement).href = theme;
        });
        this.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, status: string) => {
            this.setStatus(status);
        });
        this.electron.ipcRenderer.on('set-language-map', (event: Electron.IpcRendererEvent, languageMap: Array<LanguageMap>) => {
            this.setLanguageMap(languageMap);
        });
        this.electron.ipcRenderer.on('set-language-rules', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.setLanguageRules(rules);
        });
        this.electron.ipcRenderer.on('edit-language', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.editLanguage();
        });
        this.electron.ipcRenderer.on('remove-language', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.removeLanguage();
        });
        this.electron.ipcRenderer.on('language-up', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.moveLanguageDown();
        });
        this.electron.ipcRenderer.on('language-down', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.moveLanguageDown();
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
        this.electron.ipcRenderer.on('add-rule', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.addRule();
        });
        this.electron.ipcRenderer.on('edit-rule', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.editRule();
        });
        this.electron.ipcRenderer.on('remove-rule', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.removeRule();
        });
        this.electron.ipcRenderer.on('rule-up', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.moveRuleUp();
        });
        this.electron.ipcRenderer.on('rule-down', (event: Electron.IpcRendererEvent, rules: Rule[]) => {
            this.moveRuleDown();
        });
        document.getElementById('moveLanguageUp')?.addEventListener('click', () => {
            this.moveLanguageDown();
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
            let cell1: HTMLTableCellElement = row.insertCell(0);
            let cell2: HTMLTableCellElement = row.insertCell(1);
            cell1.innerHTML = languageMap[i].langName;
            cell2.innerHTML = languageMap[i].pattern;
            row.addEventListener('click', () => {
                if (this.selectedLanguageMap !== languageMap[i].langName) {
                    this.selectedLanguageMap = languageMap[i].langName;
                    this.electron.ipcRenderer.send('get-language-rules', this.selectedLanguageMap);
                }
                table.getElementsByClassName('selected')[0]?.classList.remove('selected');
                row.classList.add('selected');
            });
        }
    }

    setLanguageRules(rules: Rule[]) {
        let table: HTMLTableSectionElement = (document.getElementById('LanguageRules') as HTMLTableSectionElement);
        let LanguageRules: HTMLTableSectionElement = table;
        LanguageRules.innerHTML = '';
        for (let i = 0; i < rules.length; i++) {
            let row: HTMLTableRowElement = LanguageRules.insertRow(i);
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
    }

    addLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        this.electron.ipcRenderer.send('add-language');
    }

    editLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            this.electron.ipcRenderer.send('edit-language', this.selectedLanguageMap);
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
        }
    }

    removeLanguage() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            this.electron.ipcRenderer.send('remove-language', this.selectedLanguageMap);
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
        }
    }

    moveLanguageUp() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            this.electron.ipcRenderer.send('move-language-up', this.selectedLanguageMap);
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
        }
    }

    moveLanguageDown() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            this.electron.ipcRenderer.send('move-language-down', this.selectedLanguageMap);
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
        }
    }

    addRule() {
        if (!this.languagesLoaded) {
            return;
        }
        if (this.selectedLanguageMap !== '') {
            this.electron.ipcRenderer.send('add-rule', this.selectedLanguageMap);
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
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
                this.electron.ipcRenderer.send('edit-rule', pair);
            } else {
                this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noRuleSelected' });
            }
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
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
                this.electron.ipcRenderer.send('remove-rule', pair);
            } else {
                this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noRuleSelected' });
            }
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
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
                this.electron.ipcRenderer.send('move-rule-up', pair);
            } else {
                this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noRuleSelected' });
            }
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
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
                this.electron.ipcRenderer.send('move-rule-down', pair);
            } else {
                this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noRuleSelected' });
            }
        } else {
            this.electron.ipcRenderer.send('show-message', { type: MessageTypes.warning, messageId: 'noLanguageSelected' });
        }
    }
}