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

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Dialog;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.MessageBox;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Text;

public class LangMapEditor extends Dialog {

	protected Shell shell;
	Display display;

	String langPattern;
	String langRuleName;
	protected Text ruleNames;
	protected boolean cancelled = true;

	public LangMapEditor(Shell parent, String pLangRuleName, String pLangPattern) {
		super(parent, SWT.NONE);

		shell = new Shell(parent, SWT.DIALOG_TRIM);
		shell.setText(Messages.getString("LangMapEditor.0")); //$NON-NLS-1$
		shell.setImage(SRXEditor.getResourceManager().getIcon());
		shell.setLayout(new GridLayout());
		display = shell.getDisplay();

		langPattern = pLangPattern;
		langRuleName = pLangRuleName;

		Composite top = new Composite(shell, SWT.NONE);
		top.setLayout(new GridLayout(2, false));
		top.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label label2 = new Label(top, SWT.NONE);
		label2.setText(Messages.getString("LangMapEditor.1")); //$NON-NLS-1$

		ruleNames = new Text(top, SWT.BORDER);
		ruleNames.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label label = new Label(top, SWT.NONE);
		label.setText(Messages.getString("LangMapEditor.2")); //$NON-NLS-1$

		final Text pattern = new Text(top, SWT.BORDER);
		GridData data = new GridData(GridData.FILL_HORIZONTAL);
		data.widthHint = 150;
		pattern.setLayoutData(data);

		Composite bottom = new Composite(shell, SWT.NONE);
		bottom.setLayout(new GridLayout(2, false));
		bottom.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label filler = new Label(bottom, SWT.NONE);
		filler.setText(""); //$NON-NLS-1$
		filler.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		final Button okButton = new Button(bottom, SWT.PUSH);
		okButton.setText(Messages.getString("LangMapEditor.3")); //$NON-NLS-1$
		okButton.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				try {
					Pattern.compile(pattern.getText());
				} catch (PatternSyntaxException pse) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("LangMapEditor.4")); //$NON-NLS-1$
					box.open();
					return;
				}
				cancelled = false;
				langPattern = pattern.getText();
				langRuleName = ruleNames.getText();
				shell.close();
			}
		});

		pattern.setText(langPattern);
		ruleNames.setText(langRuleName);

		shell.pack();

	}

	public void show() {
		shell.open();
		while (!shell.isDisposed()) {
			if (!display.readAndDispatch()) {
				display.sleep();
			}
		}
	}

	public String getLangPattern() {
		return langPattern;
	}

	public String getLangRuleName() {
		return langRuleName;
	}

	public boolean wasCancelled() {
		return cancelled;
	}

}
