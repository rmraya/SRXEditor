/*******************************************************************************
 * Copyright (c) 2008-2020 Maxprograms.
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

public class RuleEditor extends Dialog {

	protected Shell shell;
	Display display;

	boolean ruleBreaks;
	protected String beforeBreak;
	protected String afterBreak;
	protected boolean cancelled = true;

	public RuleEditor(Shell parent, boolean pRuleBreaks, String pBeforeBreak, String pAfterBreak) {
		super(parent, SWT.NONE);

		shell = new Shell(parent, SWT.DIALOG_TRIM);
		shell.setText(Messages.getString("RuleEditor.0")); //$NON-NLS-1$
		shell.setImage(SRXEditor.getResourceManager().getIcon());
		shell.setLayout(new GridLayout());
		display = shell.getDisplay();

		ruleBreaks = pRuleBreaks;
		beforeBreak = pBeforeBreak;
		afterBreak = pAfterBreak;

		final Button rBreak = new Button(shell, SWT.CHECK);
		GridData data = new GridData(GridData.FILL_HORIZONTAL);
		rBreak.setLayoutData(data);
		rBreak.setText(Messages.getString("RuleEditor.1")); //$NON-NLS-1$

		Composite top = new Composite(shell, SWT.NONE);
		top.setLayout(new GridLayout(2, false));
		top.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label labelbb = new Label(top, SWT.NONE);
		labelbb.setText(Messages.getString("RuleEditor.2")); //$NON-NLS-1$

		final Text bBreak = new Text(top, SWT.BORDER);
		GridData gdata = new GridData(GridData.FILL_HORIZONTAL);
		gdata.widthHint = 200;
		bBreak.setLayoutData(gdata);

		Label labelab = new Label(top, SWT.NONE);
		labelab.setText(Messages.getString("RuleEditor.3")); //$NON-NLS-1$

		final Text aBreak = new Text(top, SWT.BORDER);
		aBreak.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Composite bottom = new Composite(shell, SWT.NONE);
		bottom.setLayout(new GridLayout(2, false));
		bottom.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label filler = new Label(bottom, SWT.NONE);
		filler.setText(""); //$NON-NLS-1$
		filler.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		final Button okButton = new Button(bottom, SWT.PUSH);
		okButton.setText(Messages.getString("RuleEditor.4")); //$NON-NLS-1$
		okButton.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				try {
					Pattern.compile(bBreak.getText());
				} catch (PatternSyntaxException pse) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("RuleEditor.5")); //$NON-NLS-1$
					box.open();
					return;
				}

				try {
					Pattern.compile(aBreak.getText());
				} catch (PatternSyntaxException pse) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("RuleEditor.6")); //$NON-NLS-1$
					box.open();
					return;
				}

				ruleBreaks = rBreak.getSelection();
				beforeBreak = bBreak.getText();
				afterBreak = aBreak.getText();
				cancelled = false;
				shell.close();
			}
		});

		rBreak.setSelection(ruleBreaks);
		bBreak.setText(beforeBreak);
		aBreak.setText(afterBreak);

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

	public String getAfterBreak() {
		return afterBreak;
	}

	public String getBeforeBreak() {
		return beforeBreak;
	}

	public boolean ruleBreaks() {
		return ruleBreaks;
	}

	public boolean wasCancelled() {
		return cancelled;
	}

}
