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

import { app, BrowserWindow, ClientRequest, dialog, IncomingMessage, ipcMain, IpcMainEvent, Menu, MenuItem, nativeTheme, net, session, shell } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ContentHandler, DOMBuilder, Indenter, SAXParser, XMLAttribute, XMLComment, XMLDocument, XMLElement, XMLWriter } from 'typesxml';
import { I18n } from './i18n.js';
import { Message } from './messageTypes.js';
import { LanguageMap, Pair, Rule } from './model.js';
import { Preferences } from './preferences.js';

export class SRXEditor {

    static mainWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;
    static ruleWindow: BrowserWindow;
    static languageWindow: BrowserWindow;
    static appHome: string;
    static appIcon: string;
    static lang = 'en';
    currentFile: string = '';
    i18n: I18n;

    static latestVersion: string;
    static downloadLink: string;

    static currentPreferences: Preferences;
    static currentCss: string;

    doc: XMLDocument | undefined = undefined;
    root: XMLElement | undefined = undefined;
    languageList: Array<LanguageMap> | undefined = undefined;
    rulesMap: Map<string, Rule[]> = new Map<string, Rule[]>();
    header: XMLElement | undefined = undefined;
    changed: boolean = false;

    constructor() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else if (SRXEditor.mainWindow) {
            if (SRXEditor.mainWindow.isMinimized()) {
                SRXEditor.mainWindow.restore();
            }
            SRXEditor.mainWindow.focus();
        }
        if (process.platform === 'linux') {
            app.commandLine.appendSwitch('gtk-version', '3');
        }
        SRXEditor.appHome = join(app.getPath('appData'), app.name);
        SRXEditor.appIcon = join(app.getAppPath(), 'img', 'srxeditor.png');
        this.i18n = new I18n(join(app.getAppPath(), 'i18n', 'srxeditor_' + SRXEditor.lang + '.json'));
        app.on('ready', () => {
            this.loadPreferences();
            this.createWindow();
            this.createMenu();
            SRXEditor.mainWindow.once('ready-to-show', () => {
                SRXEditor.mainWindow.webContents.send('set-yes-no', { yes: this.i18n.getString('srxeditor', 'yes'), no: this.i18n.getString('srxeditor', 'no') });
                SRXEditor.mainWindow.show();
                SRXEditor.mainWindow.webContents.send('set-height', SRXEditor.mainWindow.getContentBounds().height);
                this.checkUpdates(true);
            });
        });
        ipcMain.on('set-height', (event: IpcMainEvent, arg: { window: string, width: number, height: number }) => {
            SRXEditor.setHeight(arg);
        });
        ipcMain.on('open-file', () => {
            this.showOpenDialog();
        });
        ipcMain.on('new-file', () => {
            this.newFile();
        });
        ipcMain.on('save-file', () => {
            this.saveFile();
        });
        ipcMain.on('open-help', () => {
            this.showHelp();
        });
        ipcMain.on('show-message', (event: IpcMainEvent, arg: Message) => {
            dialog.showMessageBox(SRXEditor.mainWindow, {
                type: arg.type,
                message: this.i18n.getString(arg.window, arg.messageId),
                buttons: [this.i18n.getString('srxeditor', 'OK')]
            });
        });
        ipcMain.on('close-about', () => {
            if (SRXEditor.aboutWindow) {
                SRXEditor.aboutWindow.close();
            }
        });
        ipcMain.on('open-license', (event: IpcMainEvent, type: string) => {
            this.openLicense(type);
        });
        ipcMain.on('close-licenses', () => {
            if (SRXEditor.licensesWindow) {
                SRXEditor.licensesWindow.close();
            }
        });
        ipcMain.on('close-updates', () => {
            if (SRXEditor.updatesWindow) {
                SRXEditor.updatesWindow.close();
            }
        });
        ipcMain.on('download-latest', () => {
            this.downloadLatest();
        });
        ipcMain.on('close-preferences', () => {
            if (SRXEditor.settingsWindow) {
                SRXEditor.settingsWindow.close();
            }
        });
        ipcMain.on('add-language', () => {
            this.addLanguage();
        });
        ipcMain.on('get-language-rules', (event: IpcMainEvent, languageName: string) => {
            this.getRules(languageName);
        });
        ipcMain.on('get-theme', (event: IpcMainEvent) => {
            event.sender.send('set-theme', SRXEditor.currentCss);
        });
        ipcMain.on('add-rule', (event: IpcMainEvent, languageName: string) => {
            this.addRule(languageName);
        });
        ipcMain.on('edit-language', (event: IpcMainEvent, languageName: string) => {
            this.editLanguage(languageName);
        });
        ipcMain.on('save-language', (event: IpcMainEvent, language: LanguageMap) => {
            this.saveLanguage(language);
        });
        ipcMain.on('update-language', (event: IpcMainEvent, arg: { oldLanguage: LanguageMap; language: LanguageMap; }) => {
            this.updateLanguage(arg.oldLanguage, arg.language);
        });
        ipcMain.on('remove-language', (event: IpcMainEvent, languageName: string) => {
            this.removeLanguage(languageName);
        });
        ipcMain.on('move-language-up', (event: IpcMainEvent, languageName: string) => {
            this.moveLanguageUp(languageName);
        });
        ipcMain.on('move-language-down', (event: IpcMainEvent, languageName: string) => {
            this.moveLanguageDown(languageName);
        });
        ipcMain.on('edit-rule', (event: IpcMainEvent, pair: Pair) => {
            this.editRule(pair);
        });
        ipcMain.on('save-rule', (event: IpcMainEvent, pair: Pair) => {
            this.saveRule(pair);
        });
        ipcMain.on('update-rule', (event: IpcMainEvent, arg: { oldPair: Pair; pair: Pair; }) => {
            this.updateRule(arg.oldPair, arg.pair);
        });
        ipcMain.on('remove-rule', (event: IpcMainEvent, pair: Pair) => {
            this.removeRule(pair);
        });
        ipcMain.on('move-rule-up', (event: IpcMainEvent, pair: Pair) => {
            this.moveRuleUp(pair);
        });
        ipcMain.on('move-rule-down', (event: IpcMainEvent, pair: Pair) => {
            this.moveRuleDown(pair);
        });
        ipcMain.on('test-rules', () => {
            this.testRules();
        });
        nativeTheme.on('updated', () => {
            let dark: string = 'file://' + join(app.getAppPath(), 'css', 'dark.css');
            let light: string = 'file://' + join(app.getAppPath(), 'css', 'light.css');
            let highcontrast: string = 'file://' + join(app.getAppPath(), 'css', 'highcontrast.css');
            if (SRXEditor.currentPreferences.theme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    SRXEditor.currentCss = dark;
                } else {
                    SRXEditor.currentCss = light;
                }
                if (nativeTheme.shouldUseHighContrastColors) {
                    SRXEditor.currentCss = highcontrast;
                }
                let windows: BrowserWindow[] = BrowserWindow.getAllWindows();
                for (let window of windows) {
                    window.webContents.send('set-theme', SRXEditor.currentCss);
                }
            }
            BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
                window.webContents.send('set-theme', SRXEditor.currentCss);
            });
            // Rebuild the application menu so icons reflect the current theme
            this.createMenu();
        });
        ipcMain.on('get-versions', (event: IpcMainEvent) => {
            event.sender.send('set-versions', {
                current: app.getVersion(),
                latest: SRXEditor.latestVersion
            });
        });
        ipcMain.on('get-preferences', (event: IpcMainEvent) => {
            event.sender.send('set-preferences', SRXEditor.currentPreferences);
        });
        ipcMain.on('save-preferences', (event: IpcMainEvent, preferences: Preferences) => {
            this.savePreferences(preferences);
        });
    }

    getRules(languageName: string): void {
        let rules: Rule[] | undefined = this.rulesMap.get(languageName);
        SRXEditor.mainWindow.webContents.send('set-language-rules', rules ?? []);
    }

    loadPreferences(): void {
        try {
            let dark: string = 'file://' + join(app.getAppPath(), 'css', 'dark.css');
            let light: string = 'file://' + join(app.getAppPath(), 'css', 'light.css');
            let highContrast: string = 'file://' + join(app.getAppPath(), 'css', 'highcontrast.css');
            let preferencesPath: string = join(app.getPath('appData'), app.getName(), 'preferences.json');
            if (existsSync(preferencesPath)) {
                let preferences: string = readFileSync(preferencesPath, 'utf8');
                SRXEditor.currentPreferences = JSON.parse(preferences);
            } else {
                SRXEditor.currentPreferences = { language: 'en', theme: 'system' };
                writeFileSync(preferencesPath, JSON.stringify(SRXEditor.currentPreferences, null, 2), 'utf8');
            }
            if (SRXEditor.currentPreferences.theme === 'system') {
                if (nativeTheme.shouldUseDarkColors) {
                    SRXEditor.currentCss = dark;
                } else {
                    SRXEditor.currentCss = light;
                }
                if (nativeTheme.shouldUseHighContrastColors) {
                    SRXEditor.currentCss = highContrast;
                }
            }
            if (SRXEditor.currentPreferences.theme === 'dark') {
                SRXEditor.currentCss = dark;
            }
            if (SRXEditor.currentPreferences.theme === 'light') {
                SRXEditor.currentCss = light;
            }
            if (SRXEditor.currentPreferences.theme === 'highcontrast') {
                SRXEditor.currentCss = highContrast;
            }
            BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
                window.webContents.send('set-theme', SRXEditor.currentCss);
            });
            this.createMenu();
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), error.message);
            } else {
                console.log(error);
            }
        }
    }

    savePreferences(preferences: Preferences): void {
        try {
            let preferencesPath: string = join(app.getPath('appData'), app.getName(), 'preferences.json');
            writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2), 'utf8');
            SRXEditor.settingsWindow.close();
            this.loadPreferences();
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), error.message);
            } else {
                console.log(error);
            }
        }
    }

    static setHeight(arg: { window: string; width: number; height: number; }) {
        if ('about' === arg.window) {
            SRXEditor.aboutWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('updates' === arg.window) {
            SRXEditor.updatesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('settings' === arg.window) {
            SRXEditor.settingsWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('licenses' === arg.window) {
            SRXEditor.licensesWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('rulesDialog' === arg.window) {
            SRXEditor.ruleWindow.setContentSize(arg.width, arg.height, true);
        }
        if ('languageDialog' === arg.window) {
            SRXEditor.languageWindow.setContentSize(arg.width, arg.height, true);
        }
    }

    createWindow(): void {
        SRXEditor.mainWindow = new BrowserWindow({
            width: 860,
            height: 680,
            minWidth: 550,
            minHeight: 600,
            maximizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.mainWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'index.html'));
        SRXEditor.mainWindow.on('resize', () => {
            SRXEditor.mainWindow.webContents.send('set-height', SRXEditor.mainWindow.getContentBounds().height);
        });
    }

    createMenu(): void {
        const iconFolder: string = nativeTheme.shouldUseHighContrastColors ? 'dark' : (nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
        let fileMenu: Menu = Menu.buildFromTemplate([
            { label: this.i18n.getString('fileMenu', 'newFile'), accelerator: 'CmdOrCtrl+N', click: () => { this.newFile(); }, icon: join(app.getAppPath(), 'img', iconFolder, 'new.png') },
            { label: this.i18n.getString('fileMenu', 'openFile'), accelerator: 'CmdOrCtrl+O', click: () => { this.showOpenDialog(); }, icon: join(app.getAppPath(), 'img', iconFolder, 'open.png') },
            { label: this.i18n.getString('fileMenu', 'closeFile'), accelerator: 'CmdOrCtrl+W', click: () => { this.closeFile(); } },
            { label: this.i18n.getString('fileMenu', 'saveFile'), accelerator: 'CmdOrCtrl+S', click: () => { this.saveFile(); }, icon: join(app.getAppPath(), 'img', iconFolder, 'save.png') },
            { label: this.i18n.getString('fileMenu', 'saveFileAs'), accelerator: 'CmdOrCtrl+Shift+S', click: () => { this.saveFileAs(); } }
        ]);
        let editMenu: Menu = Menu.buildFromTemplate([
            { label: this.i18n.getString('editMenu', 'undo'), accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: this.i18n.getString('editMenu', 'redo'), accelerator: 'CmdOrCtrl+Y', role: 'redo' },
            new MenuItem({ type: 'separator' }),
            { label: this.i18n.getString('editMenu', 'cut'), accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: this.i18n.getString('editMenu', 'copy'), accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: this.i18n.getString('editMenu', 'paste'), accelerator: 'CmdOrCtrl+V', role: 'paste' },
            new MenuItem({ type: 'separator' }),
            { label: this.i18n.getString('editMenu', 'selectAll'), accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
        ]);
        let helpMenu: Menu = Menu.buildFromTemplate([
            { label: this.i18n.getString('helpMenu', 'userGuide'), accelerator: 'F1', click: () => { this.showHelp(); }, icon: join(app.getAppPath(), 'img', iconFolder, 'help.png') },
            { label: this.i18n.getString('helpMenu', 'specification'), click: () => { this.showSpecification(); } },
            new MenuItem({ type: 'separator' }),
            { label: this.i18n.getString('helpMenu', 'checkUpdates'), click: () => { this.checkUpdates(false); } },
            { label: this.i18n.getString('helpMenu', 'viewLicenses'), click: () => { this.showLicenses('main'); } },
            new MenuItem({ type: 'separator' }),
            { label: this.i18n.getString('helpMenu', 'supportGroup'), click: () => { this.showSupportGroup(); } }
        ]);
        let viewMenu: Menu = Menu.buildFromTemplate([
            { label: this.i18n.getString('viewMenu', 'toggleFullScreen'), accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', role: 'togglefullscreen' },
        ]);
        let tasksMenu: Menu = Menu.buildFromTemplate([
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'addLanguage'), click: () => { this.addLanguage() } }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'editLanguage'), click: () => { SRXEditor.mainWindow.webContents.send('edit-language'); } }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'removeLanguage'), click: () => { SRXEditor.mainWindow.webContents.send('remove-language'); } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'moveLanguageUp'), accelerator: 'Alt+Up', click: () => { SRXEditor.mainWindow.webContents.send('language-up'); }, icon: join(app.getAppPath(), 'img', iconFolder, 'arrowUp.png') }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'moveLanguageDown'), accelerator: 'Alt+Down', click: () => { SRXEditor.mainWindow.webContents.send('language-down'); }, icon: join(app.getAppPath(), 'img', iconFolder, 'arrowDown.png') }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'addRule'), click: () => { SRXEditor.mainWindow.webContents.send('add-rule'); } }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'editRule'), click: () => { SRXEditor.mainWindow.webContents.send('edit-rule'); } }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'removeRule'), click: () => { SRXEditor.mainWindow.webContents.send('remove-rule'); } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'moveRuleUp'), accelerator: 'CmdOrCtrl+Up', click: () => { SRXEditor.mainWindow.webContents.send('rule-up'); }, icon: join(app.getAppPath(), 'img', iconFolder, 'arrowUp.png') }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'moveRuleDown'), accelerator: 'CmdOrCtrl+Down', click: () => { SRXEditor.mainWindow.webContents.send('rule-down'); }, icon: join(app.getAppPath(), 'img', iconFolder, 'arrowDown.png') }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: this.i18n.getString('tasksMenu', 'testRules'), click: () => { this.testRules(); }, icon: join(app.getAppPath(), 'img', iconFolder, 'test.png') })
        ]);
        if (!app.isPackaged) {
            viewMenu.append(new MenuItem({ type: 'separator' }));
            viewMenu.append(new MenuItem({ label: this.i18n.getString('viewMenu', 'toggleDeveloperTools'), accelerator: 'F12', click: () => { BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools(); } }));
        }
        let settingsMenu: Menu = Menu.buildFromTemplate([{ label: this.i18n.getString('settingsMenu', 'preferences'), click: () => { SRXEditor.showSettings(); } }]);
        let appleMenu: Menu = Menu.buildFromTemplate([
            new MenuItem({ label: this.i18n.getString('appleMenu', 'about'), click: () => { SRXEditor.showAbout(); } }),
            new MenuItem({
                label: this.i18n.getString('appleMenu', 'preferences'), submenu: [
                    { label: this.i18n.getString('appleMenu', 'settings'), accelerator: 'Cmd+,', click: () => { SRXEditor.showSettings(); } }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({
                label: this.i18n.getString('appleMenu', 'services'), role: 'services', submenu: [
                    { label: this.i18n.getString('appleMenu', 'noServices'), enabled: false }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: this.i18n.getString('appleMenu', 'quit'), accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit(); } })
        ]);

        let template: MenuItem[] = process.platform === 'darwin' ?
            [
                new MenuItem({ label: app.getName(), role: 'appMenu', submenu: appleMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'fileMenu'), role: 'fileMenu', submenu: fileMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'editMenu'), role: 'editMenu', submenu: editMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'viewMenu'), role: 'viewMenu', submenu: viewMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'tasksMenu'), submenu: tasksMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'helpMenu'), role: 'help', submenu: helpMenu })
            ] : [
                new MenuItem({ label: this.i18n.getString('menu', 'fileMenu'), role: 'fileMenu', submenu: fileMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'editMenu'), role: 'editMenu', submenu: editMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'viewMenu'), role: 'viewMenu', submenu: viewMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'tasksMenu'), submenu: tasksMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'settingsMenu'), submenu: settingsMenu }),
                new MenuItem({ label: this.i18n.getString('menu', 'helpMenu'), submenu: helpMenu })
            ];

        if (process.platform === 'win32') {
            let file: MenuItem = template[0];
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: this.i18n.getString('windowsMenu', 'quit'), accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template[5];
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: this.i18n.getString('windowsMenu', 'about'), click: () => { SRXEditor.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            let file: MenuItem = template[0];
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: this.i18n.getString('linuxMenu', 'quit'), accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template[5];
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: this.i18n.getString('linuxMenu', 'about'), click: () => { SRXEditor.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    moveLanguageUp(languageName: string): void {
        if (this.languageList) {
            let index: number = this.languageList.findIndex((map: LanguageMap) => map.langName === languageName);
            if (index !== -1 && index > 0) {
                let temp: LanguageMap = this.languageList[index - 1];
                this.languageList[index - 1] = this.languageList[index];
                this.languageList[index] = temp;
                SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
                this.changed = true;
                SRXEditor.mainWindow.documentEdited = true;
                SRXEditor.mainWindow.webContents.send('select-language', languageName);
            }
        }
    }

    moveLanguageDown(languageName: string): void {
        if (this.languageList) {
            let index: number = this.languageList.findIndex((map: LanguageMap) => map.langName === languageName);
            if (index !== -1 && index < this.languageList.length - 1) {
                let temp: LanguageMap = this.languageList[index + 1];
                this.languageList[index + 1] = this.languageList[index];
                this.languageList[index] = temp;
                SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
                this.changed = true;
                SRXEditor.mainWindow.documentEdited = true;
                SRXEditor.mainWindow.webContents.send('select-language', languageName);
            }
        }
    }

    moveRuleUp(pair: Pair): void {
        if (this.rulesMap.has(pair.langName)) {
            let rules: Rule[] = this.rulesMap.get(pair.langName) ?? [];
            let index: number = this.findRule(rules, pair.rule);
            if (index !== -1 && index > 0) {
                let temp: Rule = rules[index - 1];
                rules[index - 1] = rules[index];
                rules[index] = temp;
                this.rulesMap.set(pair.langName, rules);
                SRXEditor.mainWindow.webContents.send('set-language-rules', rules);
            }
        }
    }

    moveRuleDown(pair: Pair): void {
        if (this.rulesMap.has(pair.langName)) {
            let rules: Rule[] = this.rulesMap.get(pair.langName) ?? [];
            let index: number = this.findRule(rules, pair.rule);
            if (index !== -1 && index < rules.length - 1) {
                let temp: Rule = rules[index + 1];
                rules[index + 1] = rules[index];
                rules[index] = temp;
                this.rulesMap.set(pair.langName, rules);
                SRXEditor.mainWindow.webContents.send('set-language-rules', rules);
            }
        }
    }

    findRule(rules: Rule[], ruleToFind: Rule): number {
        for (let i = 0; i < rules.length; i++) {
            let rule: Rule = rules[i];
            if (rule.break === ruleToFind.break &&
                rule.beforeBreak === ruleToFind.beforeBreak &&
                rule.afterBreak === ruleToFind.afterBreak) {
                return i;
            }
        }
        return -1;
    }

    removeRule(pair: Pair): void {
        if (this.rulesMap.has(pair.langName)) {
            let rules: Rule[] = this.rulesMap.get(pair.langName) ?? [];
            let index: number = this.findRule(rules, pair.rule);
            if (index !== -1) {
                rules.splice(index, 1);
                this.rulesMap.set(pair.langName, rules);
                SRXEditor.mainWindow.webContents.send('set-language-rules', rules);
            }
        }
    }

    editRule(pair: Pair): void {
        if (SRXEditor.ruleWindow && !SRXEditor.ruleWindow.isDestroyed()) {
            SRXEditor.ruleWindow.focus();
            SRXEditor.ruleWindow.webContents.send('set-pair', pair);
            return;
        }
        SRXEditor.ruleWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 450,
            height: 200,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.ruleWindow.setMenu(null);
        SRXEditor.ruleWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'rules.html'));
        SRXEditor.ruleWindow.once('ready-to-show', () => {
            SRXEditor.ruleWindow.show();
            setTimeout(() => {
                SRXEditor.ruleWindow.webContents.send('set-pair', pair);
            }, 200);
        });
        SRXEditor.ruleWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    addRule(languageName: string): void {
        SRXEditor.ruleWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 450,
            height: 200,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.ruleWindow.setMenu(null);
        SRXEditor.ruleWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'rules.html'));
        SRXEditor.ruleWindow.once('ready-to-show', () => {
            SRXEditor.ruleWindow.webContents.send('set-language-name', languageName);
            SRXEditor.ruleWindow.show();
        });
        SRXEditor.ruleWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    removeLanguage(languageName: string): void {
        let index: number = this.languageList?.findIndex((map: LanguageMap) => map.langName === languageName) ?? -1;
        if (index !== -1 && this.languageList) {
            this.languageList.splice(index, 1);
            SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
            dialog.showMessageBox(SRXEditor.mainWindow, {
                type: 'info',
                message: this.i18n.getString('srxeditor', 'languageRemoved'),
                buttons: [this.i18n.getString('srxeditor', 'OK')]
            });
            this.changed = true;
            SRXEditor.mainWindow.documentEdited = true;
        } else {
            dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                this.i18n.getString('srxeditor', 'languageNotFound'));
        }
    }

    editLanguage(languageName: string): void {
        let languageMap: LanguageMap | undefined = this.languageList?.find((map: LanguageMap) => map.langName === languageName);
        if (!languageMap) {
            dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                this.i18n.getString('srxeditor', 'languageNotFound'));
        }
        if (SRXEditor.languageWindow && !SRXEditor.languageWindow.isDestroyed()) {
            SRXEditor.languageWindow.focus();
            SRXEditor.languageWindow.webContents.send('set-language', languageMap);
            return;
        }
        SRXEditor.languageWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 450,
            height: 180,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.languageWindow.setMenu(null);
        SRXEditor.languageWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'languageRules.html'));
        SRXEditor.languageWindow.once('ready-to-show', () => {
            SRXEditor.languageWindow.show();
            setTimeout(() => {
                SRXEditor.languageWindow.webContents.send('set-language', languageMap);
            }, 200);
        });
        SRXEditor.languageWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    addLanguage(): void {
        if (SRXEditor.languageWindow && !SRXEditor.languageWindow.isDestroyed()) {
            SRXEditor.languageWindow.focus();
            return;
        }
        SRXEditor.languageWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 450,
            height: 180,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.languageWindow.setMenu(null);
        SRXEditor.languageWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'languageRules.html'));
        SRXEditor.languageWindow.once('ready-to-show', () => {
            SRXEditor.languageWindow.show();
        });
        SRXEditor.languageWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    static showSettings(): void {
        SRXEditor.settingsWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 450,
            height: 160,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.settingsWindow.setMenu(null);
        SRXEditor.settingsWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'settings.html'));
        SRXEditor.settingsWindow.once('ready-to-show', () => {
            SRXEditor.settingsWindow.show();
        });
        SRXEditor.settingsWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    static showAbout(): void {
        SRXEditor.aboutWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 400,
            height: 395,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.aboutWindow.setMenu(null);
        SRXEditor.aboutWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'about.html'));
        SRXEditor.aboutWindow.once('ready-to-show', () => {
            SRXEditor.aboutWindow.show();
        });
        SRXEditor.aboutWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/').catch((reason: any) => {
            if (reason instanceof Error) {
                console.error(reason.message);
            }
            dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), this.i18n.getString('srxeditor', 'supportError'));
        });
    }

    showLicenses(arg0: string): void {
        SRXEditor.licensesWindow = new BrowserWindow({
            parent: SRXEditor.mainWindow,
            width: 330,
            height: 190,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        SRXEditor.licensesWindow.setMenu(null);
        SRXEditor.licensesWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'licenses.html'));
        SRXEditor.licensesWindow.once('ready-to-show', () => {
            SRXEditor.licensesWindow.show();
        });
        SRXEditor.licensesWindow.on('close', () => {
            SRXEditor.mainWindow.focus();
        });
    }

    openLicense(type: string) {
        let licenseFile = '';
        let title = '';
        if (type === 'SRXEditor' || type === 'TypesXML' || type === 'TypesBCP47') {
            licenseFile = 'EclipsePublicLicense1.0.html';
            title = 'Eclipse Public License 1.0';
        } else if (type === 'electron') {
            licenseFile = 'electron.txt';
            title = 'MIT License';
        } else {
            dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), this.i18n.getString('srxeditor', 'unknownLicense'));
            return;
        }
        let licenseWindow = new BrowserWindow({
            parent: SRXEditor.licensesWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: SRXEditor.appIcon,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        licenseWindow.setMenu(null);
        let filePath = join(app.getAppPath(), 'html', 'licenses', licenseFile);
        let fileUrl: URL = new URL('file://' + filePath);
        licenseWindow.loadURL(fileUrl.href);
        licenseWindow.once('ready-to-show', () => {
            licenseWindow.show();
        });
        licenseWindow.on('close', () => {
            SRXEditor.licensesWindow.focus();
        });
        licenseWindow.webContents.on('did-finish-load', () => {
            let css: string = readFileSync(SRXEditor.currentCss.substring('file://'.length), { encoding: 'utf8' });
            licenseWindow.webContents.insertCSS(css.toString());
        });
    }

    checkUpdates(silent: boolean): void {
        session.defaultSession.clearCache().then(() => {
            let req: ClientRequest = net.request({
                url: 'https://maxprograms.com/srxeditor.json',
                session: session.defaultSession
            });
            req.on('response', (response: IncomingMessage) => {
                let responseData: string = '';
                if (response.statusCode !== 200) {
                    if (!silent) {
                        let message: string = this.i18n.getString('srxeditor', 'serverStatus');
                        let formattedMessage: string = this.i18n.format(message, ['' + response.statusCode]);
                        dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                            type: 'info',
                            message: formattedMessage
                        });
                    }
                }
                response.on('data', (chunk: Buffer) => {
                    responseData += chunk;
                });
                response.on('end', () => {
                    try {
                        let parsedData = JSON.parse(responseData);
                        if (app.getVersion() !== parsedData.version) {
                            SRXEditor.latestVersion = parsedData.version;
                            switch (process.platform) {
                                case 'darwin':
                                    SRXEditor.downloadLink = process.arch === 'arm64' ? parsedData.arm64 : parsedData.darwin;
                                    break;
                                case 'win32':
                                    SRXEditor.downloadLink = parsedData.win32;
                                    break;
                                case 'linux':
                                    SRXEditor.downloadLink = parsedData.linux;
                                    break;
                            }
                            SRXEditor.updatesWindow = new BrowserWindow({
                                parent: SRXEditor.mainWindow,
                                width: 590,
                                height: 240,
                                minimizable: false,
                                maximizable: false,
                                resizable: false,
                                show: false,
                                icon: SRXEditor.appIcon,
                                webPreferences: {
                                    nodeIntegration: true,
                                    contextIsolation: false
                                }
                            });
                            SRXEditor.updatesWindow.setMenu(null);
                            SRXEditor.updatesWindow.loadURL('file://' + join(app.getAppPath(), 'html', SRXEditor.lang, 'updates.html'));
                            SRXEditor.updatesWindow.once('ready-to-show', () => {
                                SRXEditor.updatesWindow.show();
                            });
                            SRXEditor.updatesWindow.on('close', () => {
                                SRXEditor.mainWindow.focus();
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                                    type: 'info',
                                    message: this.i18n.getString('SRXEditor', 'noUpdates')
                                });
                            }
                        }
                    } catch (reason: any) {
                        if (!silent) {
                            dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                                type: 'error',
                                message: reason.message
                            });
                        }
                    }
                });
            });
            req.on('error', (error: Error) => {
                if (!silent) {
                    dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                        type: 'error',
                        message: error.message
                    });
                }
            });
            req.end();
        });
    }

    showHelp(): void {
        shell.openExternal('file://' + join(app.getAppPath(), 'srxeditor_' + SRXEditor.lang + '.pdf')).catch(() => {
            shell.openPath(join(app.getAppPath(), 'srxeditor_' + SRXEditor.lang + '.pdf')).catch((reason: any) => {
                if (reason instanceof Error) {
                    console.error(reason.message);
                }
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                    this.i18n.getString('srxeditor', 'helpError'));
            });
        });
    }

    showSpecification(): void {
        shell.openExternal('file://' + join(app.getAppPath(), 'srx20.pdf')).catch(() => {
            shell.openPath(join(app.getAppPath(), 'srx20.pdf')).catch((reason: any) => {
                if (reason instanceof Error) {
                    console.error(reason.message);
                }
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                    this.i18n.getString('srxeditor', 'specificationError'));
            });
        });
    }

    saveFile(): void {
        if (this.doc) {
            if (this.currentFile === this.i18n.getString('srxeditor', 'untitled')) {
                this.saveFileAs();
                return;
            }
            XMLWriter.writeDocument(this.doc, this.currentFile);
            dialog.showMessageBox(SRXEditor.mainWindow, {
                type: 'info',
                message: this.i18n.getString('srxeditor', 'fileSaved'),
                buttons: [this.i18n.getString('srxeditor', 'OK')]
            });
            this.changed = false;
            SRXEditor.mainWindow.documentEdited = false;
        }
    }

    saveFileAs(): void {
        if (this.doc) {
            let savePath: string | undefined = dialog.showSaveDialogSync(SRXEditor.mainWindow, {
                title: this.i18n.getString('srxeditor', 'saveSrxFile'),
                defaultPath: this.currentFile === this.i18n.getString('srxeditor', 'untitled') ? 'untitled.srx' : this.currentFile,
                filters: [
                    { name: this.i18n.getString('srxeditor', 'srxFiles'), extensions: ['srx'] },
                    { name: this.i18n.getString('srxeditor', 'allFiles'), extensions: ['*'] }
                ]
            });
            if (!savePath) {
                return;
            }
            this.currentFile = savePath;
            SRXEditor.mainWindow.setTitle(this.i18n.format(this.i18n.getString('srxeditor', 'mainWindowTitle'), [app.getName(), this.currentFile]));
            XMLWriter.writeDocument(this.doc, this.currentFile);
            dialog.showMessageBox(SRXEditor.mainWindow, {
                type: 'info',
                message: this.i18n.getString('srxeditor', 'fileSaved'),
                buttons: [this.i18n.getString('srxeditor', 'OK')]
            });
            this.changed = false;
            SRXEditor.mainWindow.documentEdited = false;
        }
    }

    closeFile(): void {
        throw new Error('Method not implemented.');
    }

    showOpenDialog(): void {
        dialog.showOpenDialog(SRXEditor.mainWindow, {
            title: this.i18n.getString('srxeditor', 'openSrxFile'),
            filters: [
                { name: this.i18n.getString('srxeditor', 'srxFiles'), extensions: ['srx'] },
                { name: this.i18n.getString('srxeditor', 'allFiles'), extensions: ['*'] }
            ],
            properties: ['openFile']
        }).then(result => {
            if (!result.canceled) {
                this.openFile(result.filePaths[0]);
            }
        }).catch((err) => {
            if (err instanceof Error) {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), err.message);
            }
            console.log(err);
        });
    }

    openFile(filePath: string): void {
        let contentHandler: ContentHandler = new DOMBuilder();
        let xmlParser = new SAXParser();
        xmlParser.setContentHandler(contentHandler);

        // build the document from a file
        try {
            xmlParser.parseFile(filePath);
            this.doc = (contentHandler as DOMBuilder).getDocument();
            if (this.doc) {
                this.root = this.doc.getRoot();
                if (this.root) {
                    if (this.root.getName() !== 'srx') {
                        dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                            this.i18n.getString('srxeditor', 'notSrx'));
                        return;
                    }
                    let version: XMLAttribute | undefined = this.root.getAttribute('version');
                    if (!version) {
                        dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                            this.i18n.getString('srxeditor', 'missingVersion'));
                        return;
                    }
                    if (version.getValue() !== '2.0') {
                        let message: string = this.i18n.getString('srxeditor', 'unsupportedVersion');
                        dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                            this.i18n.format(message, [version.getValue()]));
                        return;
                    }
                }
            } else {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                    this.i18n.getString('srxeditor', 'notValidSrx'));
                return;
            }
            SRXEditor.mainWindow.webContents.send('set-status', this.i18n.getString('srxeditor', 'loadingSRX'));
            this.parseFile();
            SRXEditor.mainWindow.webContents.send('set-status', '');
            this.currentFile = filePath;
            SRXEditor.mainWindow.setTitle(this.i18n.format(this.i18n.getString('srxeditor', 'mainWindowTitle'), [app.getName(), this.currentFile]));
            this.changed = false;
            SRXEditor.mainWindow.documentEdited = false;
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'), error.message);
            } else {
                console.log(error);
            }
        }
    }

    parseFile(): void {
        this.languageList = [];
        this.rulesMap = new Map<string, Rule[]>();
        if (this.root) {
            let children: Array<XMLElement> = this.root.getChildren();
            if (children) {
                for (let child of children) {
                    if (child.getName() === 'body') {
                        let bodyContent: Array<XMLElement> = child.getChildren();
                        for (let bodyElement of bodyContent) {
                            if (bodyElement.getName() === 'languagerules') {
                                let languagerules: Array<XMLElement> = bodyElement.getChildren();
                                for (let languageRule of languagerules) {
                                    let nameAttribute: XMLAttribute | undefined = languageRule.getAttribute('languagerulename');
                                    if (nameAttribute) {
                                        let languagerulename: string = nameAttribute.getValue();
                                        let rulesArray: Rule[] = [];
                                        let rules: Array<XMLElement> = languageRule.getChildren();
                                        for (let ruleElement of rules) {
                                            let breakAttribute: XMLAttribute | undefined = ruleElement.getAttribute('break');
                                            let beforeBreak: XMLElement | undefined = ruleElement.getChild('beforebreak');
                                            let afterBreak: XMLElement | undefined = ruleElement.getChild('afterbreak');
                                            let breaks: boolean = breakAttribute ? breakAttribute.getValue() === 'yes' : false;
                                            let rule: Rule = {
                                                break: breaks,
                                                beforeBreak: beforeBreak ? beforeBreak.getText() : undefined,
                                                afterBreak: afterBreak ? afterBreak.getText() : undefined
                                            };
                                            rulesArray.push(rule);
                                        }
                                        this.rulesMap.set(languagerulename, rulesArray);
                                    } else {
                                        dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                                            this.i18n.getString('srxeditor', 'missingLanguageRuleName'));
                                        return;
                                    }
                                }
                            }
                            if (bodyElement.getName() === 'maprules') {
                                let maprules: Array<XMLElement> = bodyElement.getChildren();
                                for (let languagemap of maprules) {
                                    let nameAttribute: XMLAttribute | undefined = languagemap.getAttribute('languagerulename');
                                    let languageAttribute: XMLAttribute | undefined = languagemap.getAttribute('languagepattern');
                                    if (nameAttribute && languageAttribute) {
                                        let map: LanguageMap = { langName: nameAttribute.getValue(), pattern: languageAttribute.getValue() };
                                        this.languageList.push(map);
                                    }
                                }
                            }
                        }
                    }
                    if (child.getName() === 'header') {
                        this.header = child;
                    }
                }
                SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
            } else {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                    this.i18n.getString('srxeditor', 'noChildren'));
                return;
            }
        } else {
            dialog.showErrorBox(this.i18n.getString('srxeditor', 'error'),
                this.i18n.getString('srxeditor', 'notValidSrx'));
        }
    }

    newFile(): void {
        this.doc = new XMLDocument();
        this.root = new XMLElement('srx');
        this.root.setAttribute(new XMLAttribute('version', '2.0'));
        this.root.setAttribute(new XMLAttribute('xmlns', 'http://www.lisa.org/srx20'));
        this.root.setAttribute(new XMLAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance'));
        this.root.setAttribute(new XMLAttribute('xsi:schemaLocation', 'http://www.lisa.org/srx20 srx20.xsd'));
        this.doc.setRoot(this.root);
        this.root.addComment(new XMLComment('Created by SRXEditor - https://www.maxprograms.com/srxeditor/'));

        this.header = new XMLElement('header');
        this.header.setAttribute(new XMLAttribute('cascade', 'yes'));
        this.header.setAttribute(new XMLAttribute('segmentsubflows', 'yes'));
        this.root.addElement(this.header);

        let body: XMLElement = new XMLElement('body');
        let languagerules: XMLElement = new XMLElement('languagerules');
        body.addElement(languagerules);
        let maprules: XMLElement = new XMLElement('maprules');
        body.addElement(maprules);
        this.root.addElement(body);

        let indenter: Indenter = new Indenter(2);
        indenter.indent(this.root);

        this.currentFile = this.i18n.getString('srxeditor', 'untitled');
        SRXEditor.mainWindow.setTitle(this.i18n.format(this.i18n.getString('srxeditor', 'mainWindowTitle'), [app.getName(), this.currentFile]));
        this.languageList = [];
        this.rulesMap = new Map<string, Rule[]>();
        SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
        this.changed = true;
        SRXEditor.mainWindow.documentEdited = true;
    }

    saveLanguage(language: LanguageMap): void {
        if (this.languageList) {
            this.languageList.push(language);
            SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
            this.changed = true;
            SRXEditor.mainWindow.documentEdited = true;
            SRXEditor.mainWindow.webContents.send('select-language', language.langName);
            if (SRXEditor.languageWindow && !SRXEditor.languageWindow.isDestroyed()) {
                SRXEditor.languageWindow.close();
            }
        }
    }

    updateLanguage(oldLanguage: LanguageMap, language: LanguageMap): void {
        if (this.languageList) {
            let index: number = this.languageList.findIndex((map: LanguageMap) => map.langName === oldLanguage.langName);
            if (index !== -1) {
                this.languageList[index] = language;
                SRXEditor.mainWindow.webContents.send('set-language-map', this.languageList);
                this.changed = true;
                SRXEditor.mainWindow.documentEdited = true;
                SRXEditor.mainWindow.webContents.send('select-language', language.langName);
                if (SRXEditor.languageWindow && !SRXEditor.languageWindow.isDestroyed()) {
                    SRXEditor.languageWindow.close();
                }
            }
        }
    }

    saveRule(pair: Pair): void {
        if (this.rulesMap.has(pair.langName)) {
            let rules: Rule[] = this.rulesMap.get(pair.langName) ?? [];
            if (rules.findIndex((rule: Rule) => rule.break === pair.rule.break &&
                rule.beforeBreak === pair.rule.beforeBreak &&
                rule.afterBreak === pair.rule.afterBreak) !== -1) {
                dialog.showErrorBox(this.i18n.getString('srxeditor', 'warning'),
                    this.i18n.getString('srxeditor', 'duplicateRule'));
            }
            rules.push(pair.rule);
            this.rulesMap.set(pair.langName, rules);
            SRXEditor.mainWindow.webContents.send('set-language-rules', rules);
            SRXEditor.mainWindow.webContents.send('select-rule', pair.rule);
            if (SRXEditor.ruleWindow && !SRXEditor.ruleWindow.isDestroyed()) {
                SRXEditor.ruleWindow.close();
            }
        }
    }

    updateRule(oldPair: Pair, newPair: Pair): void {
        if (this.rulesMap.has(oldPair.langName)) {
            let rules: Rule[] = this.rulesMap.get(oldPair.langName) ?? [];
            let index: number = this.findRule(rules, oldPair.rule);
            if (index !== -1) {
                rules[index] = newPair.rule;
                this.rulesMap.set(oldPair.langName, rules);
                SRXEditor.mainWindow.webContents.send('set-language-rules', rules);
                SRXEditor.mainWindow.webContents.send('select-rule', newPair.rule);
                if (SRXEditor.ruleWindow && !SRXEditor.ruleWindow.isDestroyed()) {
                    SRXEditor.ruleWindow.close();
                }
            }
        }
    }

    testRules(): void {
        throw new Error('Method not implemented.');
    }

    downloadLatest(): void {
        throw new Error('Method not implemented.');
    }
}

new SRXEditor();