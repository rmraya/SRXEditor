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

        let template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];

        if (process.platform === 'darwin') {
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
            template.unshift(new MenuItem({ label: 'Stingray', role: 'appMenu', submenu: appleMenu }));
        } else {
            let help: MenuItem = template.pop() as MenuItem;
            template.push(new MenuItem({
                label: 'Settings', submenu: [
                    { label: 'Preferences', click: () => { SRXEditor.showSettings(); } }
                ]
            }));
            template.push(help);
        }
        if (process.platform === 'win32') {
            let file: MenuItem = template[0] as MenuItem;
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template.pop() as MenuItem;
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: 'About...', click: () => { SRXEditor.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            let file: MenuItem = template[0] as MenuItem;
            (file.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (file.submenu as Menu).append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            let help: MenuItem = template.pop() as MenuItem;
            (help.submenu as Menu).append(new MenuItem({ type: 'separator' }));
            (help.submenu as Menu).append(new MenuItem({ label: 'About...', click: () => { SRXEditor.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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