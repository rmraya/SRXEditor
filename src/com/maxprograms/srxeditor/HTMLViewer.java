/*******************************************************************************
 * Copyright (c) 2008-2019 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
package com.maxprograms.srxeditor;

import java.util.Hashtable;

import org.eclipse.swt.SWT;
import org.eclipse.swt.SWTError;
import org.eclipse.swt.browser.Browser;
import org.eclipse.swt.events.KeyEvent;
import org.eclipse.swt.events.KeyListener;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Dialog;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.MessageBox;
import org.eclipse.swt.widgets.Shell;

import com.maxprograms.utils.Preferences;

public class HTMLViewer extends Dialog {

	protected Shell shell;
	private Display display;
	private Browser browser;

	public HTMLViewer(Shell parent) throws Exception {
		super(parent, SWT.NONE);
		shell = new Shell(parent, SWT.CLOSE | SWT.TITLE | SWT.MODELESS | SWT.BORDER | SWT.RESIZE);
		display = shell.getDisplay();
		shell.setImage(SRXEditor.getResourceManager().getIcon());
		shell.setLayout(new GridLayout());
		shell.addListener(SWT.Close, new Listener() {
			@Override
			public void handleEvent(Event event) {
				saveSize();
			}
		});

		try {
			if (System.getProperty("file.separator").equals("/")) { //$NON-NLS-1$ //$NON-NLS-2$
				browser = new Browser(shell, SWT.WEBKIT);
			} else {
				browser = new Browser(shell, SWT.NONE);
			}
		} catch (SWTError e) {
			e.printStackTrace();
			String message = ""; //$NON-NLS-1$
			if (System.getProperty("file.separator").equals("/")) { //$NON-NLS-1$ //$NON-NLS-2$
				if (System.getProperty("os.name").startsWith("Mac")) { //$NON-NLS-1$ //$NON-NLS-2$
					// Mac
					message = Messages.getString("HTMLViewer.5"); //$NON-NLS-1$
				} else {
					// Linux
					message = Messages.getString("HTMLViewer.2"); //$NON-NLS-1$
				}
			} else {
				message = Messages.getString("HTMLViewer.7"); //$NON-NLS-1$
			}

			throw new Exception(message);
		}
		browser.setLayoutData(new GridData(GridData.FILL_BOTH));

		loadSize();
		shell.addKeyListener(new KeyListener() {

			@Override
			public void keyReleased(KeyEvent arg0) {
				// do nothing
			}

			@Override
			public void keyPressed(KeyEvent arg0) {
				if (arg0.keyCode == SWT.ESC) {
					shell.dispose();
				}
			}
		});
	}

	private void loadSize() {
		try {
			Preferences prefs = Preferences.getInstance(Constants.preferences);
			Hashtable<String, String> table = prefs.get("htmlviewer"); //$NON-NLS-1$
			if (table.size() != 0) {
				Point size = new Point(Integer.parseInt(prefs.get("htmlviewer", "size-x", "450")), //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
						Integer.parseInt(prefs.get("htmlviewer", "size-y", "400"))); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
				Point location = new Point(Integer.parseInt(prefs.get("htmlviewer", "location-x", "100")), //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
						Integer.parseInt(prefs.get("htmlviewer", "location-y", "100"))); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
				shell.setSize(size);
				shell.setLocation(location);
			}
		} catch (Exception e) {
			shell.setSize(450, 400);
		}
	}

	void saveSize() {
		try {
			Point size = shell.getSize();
			Point location = shell.getLocation();
			Preferences prefs = Preferences.getInstance(Constants.preferences);
			prefs.save("htmlviewer", "size-x", "" + size.x); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			prefs.save("htmlviewer", "size-y", "" + size.y); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			prefs.save("htmlviewer", "location-x", "" + location.x); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			prefs.save("htmlviewer", "location-y", "" + location.y); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		} catch (Exception e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			box.setMessage(e.getMessage());
			box.open();
		}
	}

	public void show() {
		shell.open();
		while (!shell.isDisposed()) {
			if (!display.readAndDispatch()) {
				display.sleep();
			}
		}
	}

	public void display(String string) {
		browser.setUrl(string);
	}

	public void setTitle(String title) {
		shell.setText(title);
	}
}
