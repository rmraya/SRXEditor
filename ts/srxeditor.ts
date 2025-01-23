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

import { app, BrowserWindow } from 'electron';

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

    createWindow() {
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

    createMenu() {
        //  throw new Error('Method not implemented.');
    }

    static startup() {
        //  throw new Error('Method not implemented.');
    }
}

new SRXEditor();