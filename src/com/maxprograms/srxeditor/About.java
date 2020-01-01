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

import java.text.MessageFormat;

import org.eclipse.swt.SWT;
import org.eclipse.swt.events.MouseEvent;
import org.eclipse.swt.events.MouseListener;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.program.Program;
import org.eclipse.swt.widgets.Dialog;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Shell;

public class About extends Dialog {

	protected Shell shell;
	private Display display;

	public About(Shell parent) {
		super(parent, SWT.NONE);

		shell = new Shell(parent, SWT.DIALOG_TRIM | SWT.PRIMARY_MODAL);
		display = shell.getDisplay();
		shell.setText(Messages.getString("About.0")); //$NON-NLS-1$
		shell.setImage(SRXEditor.getResourceManager().getIcon());
		shell.setLayout(new GridLayout(1, true));

		Color white = new Color(display, 0xFF, 0xFF, 0xFF);
		shell.setBackground(white);

		Label label = new Label(shell, SWT.CENTER);
		label.setText(Messages.getString("About.1")); //$NON-NLS-1$
		label.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		label.setBackground(white);

		Label image = new Label(shell, SWT.CENTER);
		image.setImage(SRXEditor.getResourceManager().getIcon());
		image.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		image.setBackground(white);

		Label label2 = new Label(shell, SWT.CENTER);
		MessageFormat mf = new MessageFormat(Messages.getString("About.2")); //$NON-NLS-1$
		label2.setText(mf.format(new String[] { Constants.version, Constants.build }));
		label2.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		label2.setBackground(white);

		Label empty = new Label(shell, SWT.NONE);
		empty.setText(""); //$NON-NLS-1$
		empty.setBackground(white);

		Label copyright = new Label(shell, SWT.CENTER);
		copyright.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		copyright.setText(Messages.getString("About.3")); //$NON-NLS-1$
		copyright.setBackground(white);

		Label website = new Label(shell, SWT.CENTER);
		website.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		website.setText("https://www.maxprograms.com"); //$NON-NLS-1$
		website.setBackground(white);
		website.setForeground(display.getSystemColor(SWT.COLOR_LINK_FOREGROUND));
		website.addMouseListener(new MouseListener() {

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				Program.launch("https://www.maxprograms.com"); //$NON-NLS-1$
			}

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}
		});
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
}
