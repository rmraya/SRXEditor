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

import { app, BrowserWindow, dialog, IncomingMessage, ipcMain, IpcMainEvent, Menu, MenuItem, net, session } from 'electron';
import { ContentHandler, DOMBuilder, SAXParser, XMLDocument, XMLElement } from 'typesxml';
import { I18n } from './i18n';
import { MessageTypes } from './messageTypes';

class SRXEditor {

    static path = require('path');
    static mainWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static updatesWindow: BrowserWindow;
    static appHome: string;
    static appIcon: string;
    static lang = 'en';
    static moveRuleDown: any;
    static moveLanguageDown: any;
    static currentFile: string;
    static i18n: I18n;

    static latestVersion: string;
    static downloadLink: string;

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
            SRXEditor.showOpenDialog();
        });
    }

    static setHeight(arg: { window: string; width: number; height: number; }) {
        if ('about' === arg.window) {
            // SRXEditor.aboutWindow.setContentSize(arg.width, arg.height, true);
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
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { SRXEditor.newFile(); } },
            { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => { SRXEditor.showOpenDialog(); } },
            { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => { SRXEditor.closeFile(); } },
            { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => { SRXEditor.saveFile(); } },
            { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: () => { SRXEditor.saveFile(); } }
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
            { label: 'SRXEditor User Guide', accelerator: 'F1', click: () => { SRXEditor.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates', click: () => { SRXEditor.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { SRXEditor.showLicenses('main'); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { SRXEditor.showReleaseHistory(); } },
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
        throw new Error('Method not implemented.');
    }

    static showAbout(): void {
        throw new Error('Method not implemented.');
    }

    static showSupportGroup(): void {
        throw new Error('Method not implemented.');
    }

    static showReleaseHistory(): void {
        throw new Error('Method not implemented.');
    }

    static showLicenses(arg0: string): void {
        throw new Error('Method not implemented.');
    }

    static checkUpdates(silent: boolean): void {
        session.defaultSession.clearCache().then(() => {
            let req: Electron.ClientRequest = net.request({
                url: 'https://maxprograms.com/SRXEditor.json',
                session: session.defaultSession
            });
            req.on('response', (response: IncomingMessage) => {
                let responseData: string = '';
                if (response.statusCode !== 200) {
                    if (!silent) {
                        let message: string = SRXEditor.i18n.getString('SRXEditor', 'serverStatus');
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
                                icon: this.path.join(app.getAppPath(), 'icons', 'icon.png'),
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

    static showHelp(): void {
        throw new Error('Method not implemented.');
    }

    static saveFile(): void {
        throw new Error('Method not implemented.');
    }

    static closeFile(): void {
        throw new Error('Method not implemented.');
    }

    static showOpenDialog(): void {
        dialog.showOpenDialog(SRXEditor.mainWindow, {
            title: 'Open SRX File',
            filters: [
                { name: 'SRX Files', extensions: ['srx'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        }).then(result => {
            if (!result.canceled) {
                SRXEditor.openFile(result.filePaths[0]);
            }
        }).catch((err) => {
            if (err instanceof Error) {
                dialog.showErrorBox('Error', err.message);
            }
            console.log(err);
        });
    }

    static openFile(filePath: string): void {
        let contentHandler: ContentHandler = new DOMBuilder();
        let xmlParser = new SAXParser();
        xmlParser.setContentHandler(contentHandler);

        // build the document from a file
        try {
            xmlParser.parseFile(filePath);
            let doc: XMLDocument = (contentHandler as DOMBuilder).getDocument();
            let root: XMLElement | undefined = doc.getRoot();
            if (root) {
                if (root.getName() !== 'srx') {
                    dialog.showErrorBox('Error', 'Selected file is not an SRX document.');
                    return;
                }
            }
            SRXEditor.currentFile = filePath;
            SRXEditor.updateTitle();
        } catch (error: any) {
            if (error instanceof Error) {
                dialog.showErrorBox('Error', error.message);
            } else {
                console.log(error);
            }
        }
    }

    static updateTitle(): void {
        throw new Error('Method not implemented.');
    }

    static newFile(): void {
        throw new Error('Method not implemented.');
    }

    static startup(): void {
        SRXEditor.checkUpdates(true);
    }
}

new SRXEditor();