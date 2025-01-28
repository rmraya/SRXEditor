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

import { app, BrowserWindow, Menu, MenuItem } from 'electron';

class SRXEditor {

    static path = require('path');
    static mainWindow: BrowserWindow;
    static appHome: string;
    static appIcon: string;
    static lang = 'en';
    static moveRuleDown: any;
    static moveLanguageDown: any;

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
        app.on('ready', () => {
            this.createWindow();
            this.createMenu();
            SRXEditor.mainWindow.once('ready-to-show', () => {
                SRXEditor.mainWindow.show();
                SRXEditor.startup();
            });
        });
    }

    createWindow(): void {
        SRXEditor.mainWindow = new BrowserWindow({
            width: 860,
            height: 780,
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
    }

    createMenu(): void {
        let fileMenu: Menu = Menu.buildFromTemplate([
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { SRXEditor.newFile(); } },
            { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => { SRXEditor.openFileDialog(); } },
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
            new MenuItem({ label: 'Move Language Up', accelerator:'Alt+Up', click: () => { SRXEditor.moveLanguageUp() } }),
            new MenuItem({ label: 'Move Language Down', accelerator:'Alt+Down',click: () => { SRXEditor.moveLanguageDown() } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Add Rule', click: () => { SRXEditor.addRule() } }),
            new MenuItem({ label: 'Edit Rule', click: () => { SRXEditor.editRule() } }),
            new MenuItem({ label: 'Remove Rule', click: () => { SRXEditor.removeRule() } }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: 'Move Rule Up', accelerator:'CmdOrCtrl+Up', click: () => { SRXEditor.moveRuleUp() } }),
            new MenuItem({ label: 'Move Rule Down', accelerator:'CmdOrCtrl+Down', click: () => { SRXEditor.moveRuleDown() } }),
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
                new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
                new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
                new MenuItem({ label: '&Tasks', submenu: tasksMenu }),
                new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
            ] : [
                new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
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
    static moveLanguageUp() {
        throw new Error('Method not implemented.');
    }
    static moveRuleUp() {
        throw new Error('Method not implemented.');
    }
    static removeRule() {
        throw new Error('Method not implemented.');
    }
    static editRule() {
        throw new Error('Method not implemented.');
    }
    static addRule() {
        throw new Error('Method not implemented.');
    }
    static removeLanguage() {
        throw new Error('Method not implemented.');
    }
    static editLanguage() {
        throw new Error('Method not implemented.');
    }
    static addLanguage() {
        throw new Error('Method not implemented.');
    }

    static showSettings() {
        throw new Error('Method not implemented.');
    }

    static showAbout() {
        throw new Error('Method not implemented.');
    }

    static showSupportGroup() {
        throw new Error('Method not implemented.');
    }

    static showReleaseHistory() {
        throw new Error('Method not implemented.');
    }

    static showLicenses(arg0: string) {
        throw new Error('Method not implemented.');
    }

    static checkUpdates(arg0: boolean) {
        throw new Error('Method not implemented.');
    }

    static showHelp() {
        throw new Error('Method not implemented.');
    }

    static saveFile() {
        throw new Error('Method not implemented.');
    }

    static closeFile() {
        throw new Error('Method not implemented.');
    }

    static openFileDialog() {
        throw new Error('Method not implemented.');
    }

    static newFile() {
        throw new Error('Method not implemented.');
    }

    static startup() {
        //  throw new Error('Method not implemented.');
    }
}

new SRXEditor();