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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;

import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.StyledText;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Combo;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Dialog;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.MessageBox;
import org.eclipse.swt.widgets.Shell;

import com.maxprograms.segmenter.Segmenter;
import com.maxprograms.utils.Preferences;
import com.maxprograms.utils.TextUtil;
import com.maxprograms.xml.XMLUtils;

public class RulesTester extends Dialog {

	protected Shell shell;
	private Display display;
	protected StyledText text;
	protected Combo langCombo;

	public RulesTester(Shell parent, final String fileName) {
		super(parent, SWT.NONE);

		shell = new Shell(parent, SWT.DIALOG_TRIM | SWT.RESIZE | SWT.APPLICATION_MODAL);
		display = shell.getDisplay();
		shell.setText(Messages.getString("RulesTester.0")); //$NON-NLS-1$
		shell.setImage(SRXEditor.getResourceManager().getIcon());
		shell.setLayout(new GridLayout());

		Label textLabel = new Label(shell, SWT.NONE);
		textLabel.setText(Messages.getString("RulesTester.1")); //$NON-NLS-1$

		text = new StyledText(shell, SWT.V_SCROLL | SWT.H_SCROLL | SWT.BORDER);
		GridData textData = new GridData(GridData.FILL_BOTH | GridData.GRAB_VERTICAL);
		textData.heightHint = 200;
		textData.widthHint = 300;
		text.setLayoutData(textData);

		Composite language = new Composite(shell, SWT.NONE);
		language.setLayout(new GridLayout(2, false));
		language.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label langLabel = new Label(language, SWT.NONE);
		langLabel.setText(Messages.getString("RulesTester.2")); //$NON-NLS-1$

		langCombo = new Combo(language, SWT.DROP_DOWN | SWT.READ_ONLY);
		langCombo.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		try {
			langCombo.setItems(TextUtil.getLanguageNames());
		} catch (Exception ex) {
			MessageBox box = new MessageBox(shell, SWT.OK | SWT.ICON_ERROR);
			box.setMessage(Messages.getString("RulesTester.4")); //$NON-NLS-1$
			box.open();
		}
		Composite bottom = new Composite(shell, SWT.NONE);
		bottom.setLayout(new GridLayout(2, false));
		bottom.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label filler = new Label(bottom, SWT.NONE);
		filler.setText(""); //$NON-NLS-1$
		filler.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Button test = new Button(bottom, SWT.PUSH);
		test.setText(Messages.getString("RulesTester.3")); //$NON-NLS-1$
		test.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (text.getText().equals("")) { //$NON-NLS-1$
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("RulesTester.5")); //$NON-NLS-1$
					box.open();
					return;
				}
				if (langCombo.getText().equals("")) { //$NON-NLS-1$
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("RulesTester.7")); //$NON-NLS-1$
					box.open();
					return;
				}
				try {
					Segmenter segmenter = new Segmenter(fileName, TextUtil.getLanguageCode(langCombo.getText()),
							Constants.catalog);
					String[] segments = segmenter.segment(text.getText());
					display(segments);
					Preferences prefs = Preferences.getInstance(Constants.preferences);
					prefs.save("testing", "language", TextUtil.getLanguageCode(langCombo.getText())); //$NON-NLS-1$ //$NON-NLS-2$

				} catch (Exception e) {
					MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
					if (e.getMessage() != null) {
						box.setMessage(e.getMessage());
					} else {
						e.printStackTrace();
						box.setMessage(Messages.getString("RulesTester.10")); //$NON-NLS-1$
					}
					box.open();
				}
			}

		});

		shell.pack();

		try {
			Preferences prefs = Preferences.getInstance(Constants.preferences);
			String lang = prefs.get("testing", "language", ""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			if (!lang.equals("")) { //$NON-NLS-1$
				langCombo.setText(TextUtil.getLanguageName(lang));
			}
		} catch (Exception e) {
			// do nothing
		}
	}

	protected void display(String[] segments) throws Exception {
		File tmp = File.createTempFile("test", ".html"); //$NON-NLS-1$ //$NON-NLS-2$
		tmp.deleteOnExit();
		try (FileOutputStream out = new FileOutputStream(tmp)) {
			writeStr(out,
					"<html><head><meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\"/><title>&nbsp;</title></head><body><table width='100%' border='1'>"); //$NON-NLS-1$
			for (int i = 0; i < segments.length; i++) {
				writeStr(out, "<tr><td>" + XMLUtils.cleanText(segments[i]) + "</td></tr>"); //$NON-NLS-1$ //$NON-NLS-2$
			}
			writeStr(out, "</table></body></html>"); //$NON-NLS-1$
		}
		HTMLViewer viewer = new HTMLViewer(shell);
		viewer.setText(Messages.getString("RulesTester.22")); //$NON-NLS-1$
		viewer.display(tmp.getAbsolutePath());
		viewer.show();
	}

	private static void writeStr(FileOutputStream out, String string) throws UnsupportedEncodingException, IOException {
		out.write(string.getBytes("UTF-8")); //$NON-NLS-1$
	}

	public void show() {
		shell.open();
		while (!shell.isDisposed()) {
			if (!display.readAndDispatch()) {
				display.sleep();
			}
		}
	}

}
