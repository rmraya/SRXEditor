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

import { app, BrowserWindow, dialog, IncomingMessage, ipcMain, IpcMainEvent, Menu, MenuItem, nativeTheme, net, session, shell } from 'electron';
import { ContentHandler, DOMBuilder, SAXParser, XMLAttribute, XMLDocument, XMLElement, XMLWriter } from 'typesxml';
import { I18n } from './i18n';
import { MessageTypes } from './messageTypes';
import { existsSync, readFileSync, writeFileSync } from 'fs';

class SRXEditor {

    static path = require('path');
    static mainWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static appHome: string;
    static appIcon: string;
    static lang = 'en';
    static moveRuleDown: any;
    static moveLanguageDown: any;
    static currentFile: string;
    static i18n: I18n;

    static latestVersion: string;
    static downloadLink: string;

    static currentPreferences: Preferences;
    static currentCss: string;

    doc: XMLDocument | undefined = undefined;
    root: XMLElement | undefined = undefined;
    languageMap: Array<LanguageMap> | undefined = undefined;

    constructor() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else if (SRXEditor.mainWindow) {
            if (SRXEditor.mainWindow.isMinimized()) {
                SRXEditor.mainWindow.restore();
            }
            SRXEditor.mainWindow.focus();
        }
        SRXEditor.appHome = SRXEditor.path.join(app.getPath('appData'), app.name);
        SRXEditor.appIcon = SRXEditor.path.join(app.getAppPath(), 'icons', 'srxeditor.png');
        SRXEditor.i18n = new I18n(SRXEditor.path.join(app.getAppPath(), 'i18n', 'srxeditor_' + SRXEditor.lang + '.json'));
        app.on('ready', () => {
            this.loadPreferences();
            this.createWindow();
            this.createMenu();
            SRXEditor.mainWindow.once('ready-to-show', () => {
                SRXEditor.mainWindow.show();
                SRXEditor.mainWindow.webContents.send('set-height', SRXEditor.mainWindow.getContentBounds().height);
                SRXEditor.startup();
            });
        });
        ipcMain.on('set-height', (event: IpcMainEvent, arg: { window: string, width: number, height: number }) => {
            SRXEditor.setHeight(arg);
        });
        ipcMain.on('open-file', () => {
            this.showOpenDialog();
        });
        ipcMain.on('save-file', () => {
            this.saveFile();
        });
        ipcMain.on('open-help', () => {
            this.showHelp();
        });
        ipcMain.on('close-about', () => {
            if (SRXEditor.aboutWindow) {
                SRXEditor.aboutWindow.close();
            }
        });
        ipcMain.on('close-updates', () => {
            if (SRXEditor.updatesWindow) {
                SRXEditor.updatesWindow.close();
            }
        });
        ipcMain.on('get-theme', (event: IpcMainEvent) => {
            event.sender.send('set-theme', SRXEditor.currentCss);
        });
        nativeTheme.on('updated', () => {
            let dark: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'dark.css');
            let light: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'light.css');
            let highcontrast: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'highcontrast.css');
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

    loadPreferences(): void {
        try {
            let dark: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'dark.css');
            let light: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'light.css');
            let highContrast: string = 'file://' + SRXEditor.path.join(app.getAppPath(), 'css', 'highcontrast.css');
            let preferencesPath: string = SRXEditor.path.join(app.getPath('appData'), app.getName(), 'preferences.json');
            if (existsSync(preferencesPath)) {
                let preferences: string = readFileSync(preferencesPath, 'utf8');
                SRXEditor.currentPreferences = JSON.parse(preferences);
            } else {
                SRXEditor.currentPreferences = { language: 'en', theme: 'system' };
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
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox('Error', error.message);
            } else {
                console.log(error);
            }
        }
    }

    savePreferences(preferences: Preferences): void {
        try {
            let preferencesPath: string = SRXEditor.path.join(app.getPath('appData'), app.getName(), 'preferences.json');
            writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2), 'utf8');
            SRXEditor.settingsWindow.close();
            this.loadPreferences();
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox('Error', error.message);
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
        SRXEditor.mainWindow.loadURL('file://' + SRXEditor.path.join(app.getAppPath(), 'html', SRXEditor.lang, 'index.html'));
        SRXEditor.mainWindow.on('resize', () => {
            SRXEditor.mainWindow.webContents.send('set-height', SRXEditor.mainWindow.getContentBounds().height);
        });
    }

    createMenu(): void {
        let fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { this.newFile(); } },
            { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => { this.showOpenDialog(); } },
            { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => { this.closeFile(); } },
            { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => { this.saveFile(); } },
            { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: () => { this.saveFile(); } }
        ]);
        let editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            new MenuItem({ type: 'separator' }),
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
        ]);
        let helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'SRXEditor User Guide', accelerator: 'F1', click: () => { this.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates', click: () => { SRXEditor.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { SRXEditor.showLicenses('main'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Support Group', click: () => { SRXEditor.showSupportGroup(); } }
        ]);
        let tasksMenu: Menu = Menu.buildFromTemplate([
            new MenuItem({ label: 'Add Language', click: () => { SRXEditor.addLanguage() } }),
            new MenuItem({ label: 'Edit Language', click: () => { SRXEditor.editLanguage() } }),
            new MenuItem({ label: 'Remove Language', click: () => { SRXEditor.removeLanguage() } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Move Language Up', accelerator: 'Alt+Up', click: () => { SRXEditor.moveLanguageUp() } }),
            new MenuItem({ label: 'Move Language Down', accelerator: 'Alt+Down', click: () => { SRXEditor.moveLanguageDown() } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Add Rule', click: () => { SRXEditor.addRule() } }),
            new MenuItem({ label: 'Edit Rule', click: () => { SRXEditor.editRule() } }),
            new MenuItem({ label: 'Remove Rule', click: () => { SRXEditor.removeRule() } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Move Rule Up', accelerator: 'CmdOrCtrl+Up', click: () => { SRXEditor.moveRuleUp() } }),
            new MenuItem({ label: 'Move Rule Down', accelerator: 'CmdOrCtrl+Down', click: () => { SRXEditor.moveRuleDown() } }),
        ]);
        if (!app.isPackaged) {
            tasksMenu.append(new MenuItem({ type: 'separator' }));
            tasksMenu.append(new MenuItem({ label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' }));
        }
        let settingsMenu: Menu = Menu.buildFromTemplate([{ label: 'Preferences', click: () => { SRXEditor.showSettings(); } }]);
        let appleMenu: Menu = Menu.buildFromTemplate([
            new MenuItem({ label: 'About...', click: () => { SRXEditor.showAbout(); } }),
            new MenuItem({
                label: 'Preferences', submenu: [
                    { label: 'Settings', accelerator: 'Cmd+,', click: () => { SRXEditor.showSettings(); } }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({
                label: 'Services', role: 'services', submenu: [
                    { label: 'No services', enabled: false }
                ]
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Quit SRXEditor', accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit(); } })
        ]);

        let template: MenuItem[] = process.platform === 'darwin' ?
            [
                new MenuItem({ label: 'SRXEditor', role: 'appMenu', submenu: appleMenu }),
                new MenuItem({ label: SRXEditor.i18n.getString('menu', 'fileMenu'), role: 'fileMenu', submenu: fileMenu }),
                new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
                new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
                new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
            ] : [
                new MenuItem({ label: SRXEditor.i18n.getString('menu', 'fileMenu'), role: 'fileMenu', submenu: fileMenu }),
                new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
                new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
                new MenuItem({ label: '&Settings', submenu: settingsMenu }),
                new MenuItem({ label: '&Help', submenu: helpMenu })
            ];

        if (process.platform === 'win32') {
            let file: MenuItem = template[0] as MenuItem;
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template[4] as MenuItem;
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: 'About...', click: () => { SRXEditor.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            let file: MenuItem = template[0] as MenuItem;
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template[4] as MenuItem;
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: 'About...', click: () => { SRXEditor.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    static moveLanguageUp(): void {
        throw new Error('Method not implemented.');
    }

    static moveRuleUp(): void {
        throw new Error('Method not implemented.');
    }
    static removeRule(): void {
        throw new Error('Method not implemented.');
    }

    static editRule(): void {
        throw new Error('Method not implemented.');
    }

    static addRule(): void {
        throw new Error('Method not implemented.');
    }

    static removeLanguage(): void {
        throw new Error('Method not implemented.');
    }

    static editLanguage(): void {
        throw new Error('Method not implemented.');
    }

    static addLanguage(): void {
        throw new Error('Method not implemented.');
    }

    static showSettings(): void {
        SRXEditor.settingsWindow = new BrowserWindow({
            parent: this.mainWindow,
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
        SRXEditor.settingsWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', SRXEditor.lang, 'settings.html'));
        SRXEditor.settingsWindow.once('ready-to-show', () => {
            SRXEditor.settingsWindow.show();
        });
        this.settingsWindow.on('close', () => {
            this.mainWindow.focus();
        });
    }

    static showAbout(): void {
        SRXEditor.aboutWindow = new BrowserWindow({
            parent: this.mainWindow,
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
        SRXEditor.aboutWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', SRXEditor.lang, 'about.html'));
        SRXEditor.aboutWindow.once('ready-to-show', () => {
            SRXEditor.aboutWindow.show();
        });
        this.aboutWindow.on('close', () => {
            this.mainWindow.focus();
        });
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/').catch((reason: any) => {
            if (reason instanceof Error) {
                console.error(reason.message);
            }
            dialog.showErrorBox('Error', 'Unable to open support group page');
        });
    }

    static showLicenses(arg0: string): void {
        throw new Error('Method not implemented.');
    }

    static checkUpdates(silent: boolean): void {
        session.defaultSession.clearCache().then(() => {
            let req: Electron.ClientRequest = net.request({
                url: 'https://maxprograms.com/srxeditor.json',
                session: session.defaultSession
            });
            req.on('response', (response: IncomingMessage) => {
                let responseData: string = '';
                if (response.statusCode !== 200) {
                    if (!silent) {
                        let message: string = SRXEditor.i18n.getString('srxeditor', 'serverStatus');
                        let formattedMessage: string = SRXEditor.i18n.format(message, ['' + response.statusCode]);
                        dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                            type: MessageTypes.info,
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
                                parent: this.mainWindow,
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
                            SRXEditor.updatesWindow.loadURL('file://' + this.path.join(app.getAppPath(), 'html', SRXEditor.lang, 'updates.html'));
                            SRXEditor.updatesWindow.once('ready-to-show', () => {
                                SRXEditor.updatesWindow.show();
                            });
                            this.updatesWindow.on('close', () => {
                                this.mainWindow.focus();
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                                    type: MessageTypes.info,
                                    message: SRXEditor.i18n.getString('SRXEditor', 'noUpdates')
                                });
                            }
                        }
                    } catch (reason: any) {
                        if (!silent) {
                            dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                                type: MessageTypes.error,
                                message: reason.message
                            });
                        }
                    }
                });
            });
            req.on('error', (error: Error) => {
                if (!silent) {
                    dialog.showMessageBoxSync(SRXEditor.mainWindow, {
                        type: MessageTypes.error,
                        message: error.message
                    });
                }
            });
            req.end();
        });
    }

    showHelp(): void {
        shell.openExternal('file://' + SRXEditor.path.join(app.getAppPath(), 'srxeditor_' + SRXEditor.lang + '.pdf')).catch(() => {
            shell.openPath(SRXEditor.path.join(app.getAppPath(), 'srxeditor_' + SRXEditor.lang + '.pdf', 'SRXEditor.pdf')).catch((reason: any) => {
                if (reason instanceof Error) {
                    console.error(reason.message);
                }
                dialog.showErrorBox('Error', 'Unable to open SRXEditor User Guide');
            });
        });
    }

    saveFile(): void {
        if (this.doc) {
            XMLWriter.writeDocument(this.doc, SRXEditor.currentFile);
            dialog.showMessageBox(SRXEditor.mainWindow, {
                type: MessageTypes.info,
                message: SRXEditor.i18n.getString('srxeditor', 'fileSaved'),
                buttons: [SRXEditor.i18n.getString('srxeditor', 'OK')]
            });
        }
    }

    closeFile(): void {
        throw new Error('Method not implemented.');
    }

    showOpenDialog(): void {
        dialog.showOpenDialog(SRXEditor.mainWindow, {
            title: 'Open SRX File',
            filters: [
                { name: 'SRX Files', extensions: ['srx'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        }).then(result => {
            if (!result.canceled) {
                this.openFile(result.filePaths[0]);
            }
        }).catch((err) => {
            if (err instanceof Error) {
                dialog.showErrorBox('Error', err.message);
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
            this.root = this.doc.getRoot();
            if (this.root) {
                if (this.root.getName() !== 'srx') {
                    dialog.showErrorBox('Error', 'Selected file is not an SRX document');
                    return;
                }
            }
            SRXEditor.mainWindow.webContents.send('set-status', SRXEditor.i18n.getString('srxeditor', 'loadingSRX'));
            this.parseFile();
            SRXEditor.mainWindow.webContents.send('set-status', '');
            SRXEditor.currentFile = filePath;
            SRXEditor.mainWindow.setTitle('SRXEditor - ' + SRXEditor.currentFile);
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox('Error', error.message);
            } else {
                console.log(error);
            }
        }
    }

    parseFile(): void {
        this.languageMap = [];
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
                                        console.log(languagerulename);
                                        let rules: Array<XMLElement> = languageRule.getChildren();
                                        for (let rule of rules) {
                                            console.log(rule.toString());
                                        }
                                    } else {
                                        dialog.showErrorBox('Error', 'Missing "languagerulename" attribute in <languagerules> element');
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
                                        this.languageMap.push(map);
                                    }
                                }
                            }
                        }
                    }
                }
                SRXEditor.mainWindow.webContents.send('set-language-map', this.languageMap);
            } else {
                dialog.showErrorBox('Error', 'No children found in the document');
                return;
            }
        } else {
            dialog.showErrorBox('Error', 'No root element found in the document');
        }
    }

    newFile(): void {
        throw new Error('Method not implemented.');
    }

    static startup(): void {
        SRXEditor.checkUpdates(true);
    }
}

new SRXEditor();