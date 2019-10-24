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
import java.net.MalformedURLException;
import java.text.MessageFormat;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Vector;

import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.SashForm;
import org.eclipse.swt.events.MouseEvent;
import org.eclipse.swt.events.MouseListener;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.graphics.Rectangle;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.program.Program;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.FileDialog;
import org.eclipse.swt.widgets.Group;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Menu;
import org.eclipse.swt.widgets.MenuItem;
import org.eclipse.swt.widgets.MessageBox;
import org.eclipse.swt.widgets.ScrollBar;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Table;
import org.eclipse.swt.widgets.TableColumn;
import org.eclipse.swt.widgets.TableItem;

import com.maxprograms.srxeditor.resources.ResourceManager;
import com.maxprograms.utils.DirectoryTracker;
import com.maxprograms.utils.Preferences;
import com.maxprograms.widgets.CustomBar;
import com.maxprograms.widgets.CustomItem;
import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.Indenter;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLOutputter;

public class SRXEditor {

	private static Display display;
	private static ResourceManager resourceManager;
	protected Shell shell;
	protected Document doc;
	private Element root;
	private String fileName;
	protected boolean saved;
	protected Table languageTable;
	protected Table rulesTable;
	private String language;
	private boolean isMac;

	public SRXEditor(String[] args) {

		language = loadLanguage();
		if (language.equals("")) { //$NON-NLS-1$
			language = getLanguage();
		}
		Locale.setDefault(new Locale(language));

		shell = new Shell(display, SWT.SHELL_TRIM);
		shell.setText(Messages.getString("SRXEditor.0")); //$NON-NLS-1$
		GridLayout layout = new GridLayout();
		layout.marginHeight = 0;
		layout.marginWidth = 0;
		shell.setLayout(layout);
		shell.setImage(resourceManager.getIcon());

		Menu bar = display.getMenuBar();
		if (bar == null) {
			// not Mac
			bar = new Menu(shell, SWT.BAR);
			shell.setMenuBar(bar);
		} else {
			Menu systemMenu = display.getSystemMenu();

			MenuItem sysItem = getItem(systemMenu, SWT.ID_ABOUT);
			sysItem.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					About box = new About(shell);
					box.show();
				}
			});
			sysItem = getItem(systemMenu, SWT.ID_QUIT);
			sysItem.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					shell.close();
				}
			});
			isMac = true;
		}

		createMenus(bar);
		createToolBar();

		SashForm sash = new SashForm(shell, SWT.VERTICAL);
		sash.setLayoutData(new GridData(GridData.FILL_BOTH));

		Group languages = new Group(sash, SWT.NONE);
		languages.setText(Messages.getString("SRXEditor.2")); //$NON-NLS-1$
		GridLayout langLayout = new GridLayout();
		langLayout.marginHeight = 0;
		langLayout.marginWidth = 0;
		languages.setLayout(langLayout);
		languages.setLayoutData(new GridData(GridData.FILL_BOTH));

		Composite languagesTop = new Composite(languages, SWT.NONE);
		languagesTop.setLayout(new GridLayout(2, false));
		languagesTop.setLayoutData(new GridData(GridData.FILL_BOTH));

		languageTable = new Table(languagesTop,
				SWT.V_SCROLL | SWT.BORDER | SWT.READ_ONLY | SWT.SINGLE | SWT.FULL_SELECTION);
		GridData langData = new GridData(GridData.FILL_BOTH);
		langData.heightHint = 8 * languageTable.getItemHeight();
		languageTable.setLayoutData(langData);
		languageTable.setLinesVisible(true);
		languageTable.setHeaderVisible(true);
		languageTable.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				TableItem item = languageTable.getSelection()[0];
				Element rules = (Element) item.getData("rules"); //$NON-NLS-1$
				if (rules == null) {
					rules = new Element("languagerule"); //$NON-NLS-1$
					item.setData("rules", rules); //$NON-NLS-1$
				}
				populateRulesTable(rules);
			}

		});

		TableColumn langName = new TableColumn(languageTable, SWT.NONE);
		langName.setText(Messages.getString("SRXEditor.3")); //$NON-NLS-1$

		TableColumn pattern = new TableColumn(languageTable, SWT.NONE);
		pattern.setText(Messages.getString("SRXEditor.4")); //$NON-NLS-1$

		Composite topRight = new Composite(languagesTop, SWT.NONE);
		topRight.setLayout(new GridLayout());

		Button langUp = new Button(topRight, SWT.ARROW | SWT.UP);
		langUp.setLayoutData(new GridData(GridData.FILL_VERTICAL | GridData.VERTICAL_ALIGN_END));
		langUp.setToolTipText(Messages.getString("SRXEditor.5")); //$NON-NLS-1$
		langUp.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				int selected = languageTable.getSelectionIndex();
				if (selected == 0) {
					// selected first item
					return;
				}

				String text1 = languageTable.getItem(selected - 1).getText(0);
				String text2 = languageTable.getItem(selected - 1).getText(1);
				Object data = languageTable.getItem(selected - 1).getData("rules"); //$NON-NLS-1$

				languageTable.getItem(selected - 1).setText(0, languageTable.getItem(selected).getText(0));
				languageTable.getItem(selected - 1).setText(1, languageTable.getItem(selected).getText(1));
				languageTable.getItem(selected - 1).setData("rules", languageTable.getItem(selected).getData("rules")); //$NON-NLS-1$ //$NON-NLS-2$

				languageTable.getItem(selected).setText(0, text1);
				languageTable.getItem(selected).setText(1, text2);
				languageTable.getItem(selected).setData("rules", data); //$NON-NLS-1$

				languageTable.setSelection(selected - 1);
				saved = false;
			}

		});

		Button langDown = new Button(topRight, SWT.ARROW | SWT.DOWN);
		langDown.setLayoutData(new GridData(GridData.FILL_VERTICAL | GridData.VERTICAL_ALIGN_BEGINNING));
		langDown.setToolTipText(Messages.getString("SRXEditor.6")); //$NON-NLS-1$
		langDown.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				int selected = languageTable.getSelectionIndex();
				if (selected == languageTable.getItemCount() - 1) {
					// selected last item
					return;
				}

				String text1 = languageTable.getItem(selected + 1).getText(0);
				String text2 = languageTable.getItem(selected + 1).getText(1);
				Object data = languageTable.getItem(selected + 1).getData("rules"); //$NON-NLS-1$

				languageTable.getItem(selected + 1).setText(0, languageTable.getItem(selected).getText(0));
				languageTable.getItem(selected + 1).setText(1, languageTable.getItem(selected).getText(1));
				languageTable.getItem(selected + 1).setData("rules", languageTable.getItem(selected).getData("rules")); //$NON-NLS-1$ //$NON-NLS-2$

				languageTable.getItem(selected).setText(0, text1);
				languageTable.getItem(selected).setText(1, text2);
				languageTable.getItem(selected).setData("rules", data); //$NON-NLS-1$

				languageTable.setSelection(selected + 1);
				saved = false;
			}

		});

		Composite langsBottom = new Composite(languages, SWT.NONE);
		langsBottom.setLayout(new GridLayout(3, true));
		langsBottom.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Button addLangRule = new Button(langsBottom, SWT.PUSH);
		addLangRule.setText(Messages.getString("SRXEditor.7")); //$NON-NLS-1$
		addLangRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		addLangRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				LangMapEditor editor = new LangMapEditor(shell, "", ""); //$NON-NLS-1$ //$NON-NLS-2$
				editor.show();
				if (!editor.wasCancelled()) {
					TableItem item = new TableItem(languageTable, SWT.NONE);
					item.setText(0, editor.getLangRuleName());
					item.setText(1, editor.getLangPattern());
					Element rules = new Element("languagerule"); //$NON-NLS-1$
					rules.setAttribute("languagerulename", editor.getLangRuleName()); //$NON-NLS-1$
					item.setData("rules", rules); //$NON-NLS-1$
					languageTable.setSelection(item);
					populateRulesTable(rules);
					saved = false;
				}
			}

		});

		Button editLangRule = new Button(langsBottom, SWT.PUSH);
		editLangRule.setText(Messages.getString("SRXEditor.8")); //$NON-NLS-1$
		editLangRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		editLangRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				LangMapEditor editor = new LangMapEditor(shell, languageTable.getSelection()[0].getText(0),
						languageTable.getSelection()[0].getText(1));
				editor.show();
				if (!editor.wasCancelled()) {
					languageTable.getSelection()[0].setText(0, editor.getLangRuleName());
					languageTable.getSelection()[0].setText(1, editor.getLangPattern());
					Element rules = (Element) languageTable.getSelection()[0].getData("rules"); //$NON-NLS-1$
					rules.setAttribute("languagerulename", editor.getLangRuleName()); //$NON-NLS-1$
					languageTable.getSelection()[0].setData("rules", rules); //$NON-NLS-1$
					saved = false;
				}
			}

		});

		Button deleteLangRule = new Button(langsBottom, SWT.PUSH);
		deleteLangRule.setText(Messages.getString("SRXEditor.9")); //$NON-NLS-1$
		deleteLangRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		deleteLangRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				MessageBox box = new MessageBox(shell, SWT.ICON_QUESTION | SWT.YES | SWT.NO);
				box.setMessage(Messages.getString("SRXEditor.24")); //$NON-NLS-1$
				if (box.open() == SWT.YES) {
					languageTable.remove(languageTable.getSelectionIndex());
					saved = false;
				}
			}

		});

		Group rules = new Group(sash, SWT.NONE);
		rules.setText(Messages.getString("SRXEditor.10")); //$NON-NLS-1$
		GridLayout ruleLayout = new GridLayout();
		ruleLayout.marginHeight = 0;
		ruleLayout.marginWidth = 0;
		rules.setLayout(ruleLayout);
		rules.setLayoutData(new GridData(GridData.FILL_BOTH));

		Composite rulesTop = new Composite(rules, SWT.NONE);
		rulesTop.setLayout(new GridLayout(2, false));
		rulesTop.setLayoutData(new GridData(GridData.FILL_BOTH));

		rulesTable = new Table(rulesTop, SWT.V_SCROLL | SWT.BORDER | SWT.READ_ONLY | SWT.SINGLE | SWT.FULL_SELECTION);
		rulesTable.setLayoutData(new GridData(GridData.FILL_BOTH));
		rulesTable.setLinesVisible(true);
		rulesTable.setHeaderVisible(true);

		TableColumn ruleBreaks = new TableColumn(rulesTable, SWT.NONE);
		ruleBreaks.setText(Messages.getString("SRXEditor.11")); //$NON-NLS-1$

		TableColumn beforeBreak = new TableColumn(rulesTable, SWT.NONE);
		beforeBreak.setText(Messages.getString("SRXEditor.12")); //$NON-NLS-1$

		TableColumn afterBreak = new TableColumn(rulesTable, SWT.NONE);
		afterBreak.setText(Messages.getString("SRXEditor.13")); //$NON-NLS-1$

		Composite bottomRight = new Composite(rulesTop, SWT.NONE);
		bottomRight.setLayout(new GridLayout());

		Button ruleUp = new Button(bottomRight, SWT.ARROW | SWT.UP);
		ruleUp.setLayoutData(new GridData(GridData.FILL_VERTICAL | GridData.VERTICAL_ALIGN_END));
		ruleUp.setToolTipText(Messages.getString("SRXEditor.14")); //$NON-NLS-1$
		ruleUp.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (rulesTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.46")); //$NON-NLS-1$
					box.open();
					return;
				}
				int selected = rulesTable.getSelectionIndex();
				if (selected == 0) {
					// selected first item
					return;
				}

				String text1 = rulesTable.getItem(selected - 1).getText(0);
				String text2 = rulesTable.getItem(selected - 1).getText(1);
				String text3 = rulesTable.getItem(selected - 1).getText(2);

				rulesTable.getItem(selected - 1).setText(0, rulesTable.getItem(selected).getText(0));
				rulesTable.getItem(selected - 1).setText(1, rulesTable.getItem(selected).getText(1));
				rulesTable.getItem(selected - 1).setText(2, rulesTable.getItem(selected).getText(2));

				rulesTable.getItem(selected).setText(0, text1);
				rulesTable.getItem(selected).setText(1, text2);
				rulesTable.getItem(selected).setText(2, text3);

				rulesTable.setSelection(selected - 1);
				setRules();
				saved = false;
			}

		});

		Button ruleDown = new Button(bottomRight, SWT.ARROW | SWT.DOWN);
		ruleDown.setLayoutData(new GridData(GridData.FILL_VERTICAL | GridData.VERTICAL_ALIGN_BEGINNING));
		ruleDown.setToolTipText(Messages.getString("SRXEditor.15")); //$NON-NLS-1$
		ruleDown.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (rulesTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.46")); //$NON-NLS-1$
					box.open();
					return;
				}
				int selected = rulesTable.getSelectionIndex();
				if (selected == rulesTable.getItemCount() - 1) {
					// selected last item
					return;
				}

				String text1 = rulesTable.getItem(selected + 1).getText(0);
				String text2 = rulesTable.getItem(selected + 1).getText(1);
				String text3 = rulesTable.getItem(selected + 1).getText(2);

				rulesTable.getItem(selected + 1).setText(0, rulesTable.getItem(selected).getText(0));
				rulesTable.getItem(selected + 1).setText(1, rulesTable.getItem(selected).getText(1));
				rulesTable.getItem(selected + 1).setText(2, rulesTable.getItem(selected).getText(2));

				rulesTable.getItem(selected).setText(0, text1);
				rulesTable.getItem(selected).setText(1, text2);
				rulesTable.getItem(selected).setText(2, text3);

				rulesTable.setSelection(selected + 1);
				setRules();
				saved = false;
			}

		});

		Composite rulesBottom = new Composite(rules, SWT.NONE);
		rulesBottom.setLayout(new GridLayout(3, true));
		rulesBottom.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Button addRule = new Button(rulesBottom, SWT.PUSH);
		addRule.setText(Messages.getString("SRXEditor.16")); //$NON-NLS-1$
		addRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		addRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				RuleEditor editor = new RuleEditor(shell, false, "", ""); //$NON-NLS-1$ //$NON-NLS-2$
				editor.show();
				if (!editor.wasCancelled()) {
					TableItem item = new TableItem(rulesTable, SWT.NONE);
					item.setText(0, editor.ruleBreaks() ? "yes" : "no"); //$NON-NLS-1$ //$NON-NLS-2$
					item.setText(1, editor.getBeforeBreak());
					item.setText(2, editor.getAfterBreak());
					rulesTable.setSelection(item);
					setRules();
					saved = false;
				}
			}

		});

		Button editRule = new Button(rulesBottom, SWT.PUSH);
		editRule.setText(Messages.getString("SRXEditor.17")); //$NON-NLS-1$
		editRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		editRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				if (rulesTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.46")); //$NON-NLS-1$
					box.open();
					return;
				}
				TableItem item = rulesTable.getSelection()[0];
				RuleEditor editor = new RuleEditor(shell, item.getText(0).equals("yes"), item.getText(1), //$NON-NLS-1$
						item.getText(2));
				editor.show();
				if (!editor.wasCancelled()) {
					item.setText(0, editor.ruleBreaks() ? "yes" : "no"); //$NON-NLS-1$ //$NON-NLS-2$
					item.setText(1, editor.getBeforeBreak());
					item.setText(2, editor.getAfterBreak());
					setRules();
					saved = false;
				}
			}

		});

		Button deleteRule = new Button(rulesBottom, SWT.PUSH);
		deleteRule.setText(Messages.getString("SRXEditor.18")); //$NON-NLS-1$
		deleteRule.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		deleteRule.addSelectionListener(new SelectionListener() {

			@Override
			public void widgetDefaultSelected(SelectionEvent arg0) {
				// do nothing
			}

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				if (doc == null) {
					return;
				}
				if (languageTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.1")); //$NON-NLS-1$
					box.open();
					return;
				}
				if (rulesTable.getSelectionCount() == 0) {
					MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
					box.setMessage(Messages.getString("SRXEditor.46")); //$NON-NLS-1$
					box.open();
					return;
				}
				MessageBox box = new MessageBox(shell, SWT.ICON_QUESTION | SWT.YES | SWT.NO);
				box.setMessage(Messages.getString("SRXEditor.48")); //$NON-NLS-1$
				if (box.open() == SWT.YES) {
					rulesTable.remove(rulesTable.getSelectionIndex());
					setRules();
					saved = false;
				}
			}

		});

		shell.pack();

		Rectangle area = languageTable.getClientArea();
		int width = area.width;
		if (!System.getProperty("file.separator").equals("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
			width = area.width - 2 * languageTable.getBorderWidth();
			ScrollBar sbar = languageTable.getVerticalBar();
			if (sbar != null) {
				width = width - sbar.getSize().x;
			}
		}
		pattern.setWidth(width / 2);
		langName.setWidth(width / 2);

		ruleBreaks.setWidth(width * 2 / 10);
		beforeBreak.setWidth(width * 4 / 10);
		afterBreak.setWidth(width * 4 / 10);

		shell.addListener(SWT.Close, new Listener() {

			@Override
			public void handleEvent(Event arg0) {
				if (doc != null) {
					closeFile();
				}
			}

		});

		if (args.length > 0) {
			openFile(args[0]);
		}
		languageTable.setFocus();
	}

	protected void setRules() {
		TableItem langitem = languageTable.getSelection()[0];
		Element languagerule = (Element) langitem.getData("rules"); //$NON-NLS-1$
		languagerule.setContent(new Vector<XMLNode>());
		for (int i = 0; i < rulesTable.getItemCount(); i++) {
			languagerule.addContent("\n"); //$NON-NLS-1$
			TableItem item = rulesTable.getItem(i);
			Element rule = new Element("rule"); //$NON-NLS-1$
			if (!item.getText(0).equals("yes")) { //$NON-NLS-1$
				rule.setAttribute("break", "no"); //$NON-NLS-1$ //$NON-NLS-2$
			}
			if (!item.getText(1).equals("")) { //$NON-NLS-1$
				rule.addContent("\n"); //$NON-NLS-1$
				Element before = new Element("beforebreak"); //$NON-NLS-1$
				before.setText(item.getText(1));
				rule.addContent(before);
			}
			if (!item.getText(2).equals("")) { //$NON-NLS-1$
				rule.addContent("\n"); //$NON-NLS-1$
				Element before = new Element("afterbreak"); //$NON-NLS-1$
				before.setText(item.getText(2));
				rule.addContent(before);
			}
			languagerule.addContent(rule);
		}
		languagerule.addContent("\n"); //$NON-NLS-1$
		langitem.setData("rules", languagerule); //$NON-NLS-1$
	}

	void populateRulesTable(Element langrules) {
		rulesTable.removeAll();
		List<Element> rules = langrules.getChildren("rule"); //$NON-NLS-1$
		Iterator<Element> ri = rules.iterator();
		while (ri.hasNext()) {
			Element rule = ri.next();
			TableItem item = new TableItem(rulesTable, SWT.NONE);
			item.setText(0, rule.getAttributeValue("break", "yes")); //$NON-NLS-1$ //$NON-NLS-2$
			Element before = rule.getChild("beforebreak"); //$NON-NLS-1$
			if (before != null) {
				item.setText(1, before.getText());
			}
			Element after = rule.getChild("afterbreak"); //$NON-NLS-1$
			if (after != null) {
				item.setText(2, after.getText());
			}
		}
	}

	private void createToolBar() {

		CustomBar bar = new CustomBar(shell, SWT.NONE);
		bar.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		CustomItem newFile = bar.addItem(SWT.PUSH);
		newFile.setToolTipText(Messages.getString("SRXEditor.19")); //$NON-NLS-1$
		newFile.setImage(resourceManager.getPaper());
		newFile.addMouseListener(new MouseListener() {

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				createFile();
			}

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}
		});

		CustomItem open = bar.addItem(SWT.PUSH);
		open.setToolTipText(Messages.getString("SRXEditor.22")); //$NON-NLS-1$
		open.setImage(resourceManager.getOpen());
		open.addMouseListener(new MouseListener() {

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				openFile();
			}

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}
		});

		CustomItem save = bar.addItem(SWT.PUSH);
		save.setToolTipText(Messages.getString("SRXEditor.25")); //$NON-NLS-1$
		save.setImage(resourceManager.getSave());
		save.addMouseListener(new MouseListener() {

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				saveFile();
			}

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}
		});

		bar.addImageSeparator();

		CustomItem test = bar.addItem(SWT.PUSH);
		test.setToolTipText(Messages.getString("SRXEditor.20")); //$NON-NLS-1$
		test.setImage(resourceManager.getGear());
		test.addMouseListener(new MouseListener() {

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				testRules();
			}

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}
		});

		bar.addFiller();

		CustomItem help = bar.addItem(SWT.PUSH);
		help.setToolTipText(Messages.getString("SRXEditor.21")); //$NON-NLS-1$
		help.setImage(resourceManager.getHelp());
		help.addMouseListener(new MouseListener() {

			@Override
			public void mouseUp(MouseEvent arg0) {
				// do nothing
			}

			@Override
			public void mouseDown(MouseEvent arg0) {
				displayHelp();
			}

			@Override
			public void mouseDoubleClick(MouseEvent arg0) {
				// do nothing
			}
		});

	}

	protected void testRules() {
		if (doc == null) {
			return;
		}
		if (!saved) {
			MessageBox box = new MessageBox(shell, SWT.ICON_QUESTION | SWT.YES | SWT.NO);
			box.setMessage(Messages.getString("SRXEditor.64")); //$NON-NLS-1$
			if (box.open() == SWT.YES) {
				saveFile();
			}
		}
		try {
			RulesTester tester = new RulesTester(shell, fileName);
			tester.show();
		} catch (Exception e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			if (e.getMessage() != null) {
				box.setMessage(e.getMessage());
			} else {
				e.printStackTrace();
				box.setMessage(Messages.getString("SRXEditor.65")); //$NON-NLS-1$
			}
			box.open();
		}
	}

	protected void displayHelp() {
		try {
			Program.launch(new File("srxeditor.pdf").toURI().toURL().toString());//$NON-NLS-1$
		} catch (MalformedURLException e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			if (e.getMessage() != null) {
				box.setMessage(e.getMessage());
			} else {
				e.printStackTrace();
				box.setMessage(Messages.getString("SRXEditor.27")); //$NON-NLS-1$
			}
			box.open();
		}
	}

	void saveFile() {
		if (doc != null) {
			if (languageTable.getItemCount() == 0) {
				MessageBox box = new MessageBox(shell, SWT.ICON_WARNING | SWT.OK);
				box.setMessage(Messages.getString("SRXEditor.23")); //$NON-NLS-1$
				box.open();
				return;
			}
			Element maprules = root.getChild("body").getChild("maprules"); //$NON-NLS-1$ //$NON-NLS-2$
			Element languagerules = root.getChild("body").getChild("languagerules"); //$NON-NLS-1$ //$NON-NLS-2$
			maprules.setContent(new Vector<XMLNode>());
			languagerules.setContent(new Vector<XMLNode>());
			for (int i = 0; i < languageTable.getItemCount(); i++) {
				TableItem item = languageTable.getItem(i);
				Element languagemap = new Element("languagemap"); //$NON-NLS-1$
				languagemap.setAttribute("languagerulename", item.getText(0)); //$NON-NLS-1$
				languagemap.setAttribute("languagepattern", item.getText(1)); //$NON-NLS-1$
				maprules.addContent("\n"); //$NON-NLS-1$
				maprules.addContent(languagemap);
				languagerules.addContent("\n"); //$NON-NLS-1$
				languagerules.addContent((Element) item.getData("rules")); //$NON-NLS-1$
				languagerules.addContent("\n"); //$NON-NLS-1$
			}
			maprules.addContent("\n"); //$NON-NLS-1$

			if (fileName.equals("untitled.srx")) { //$NON-NLS-1$
				FileDialog fd = new FileDialog(shell, SWT.SAVE);
				String[] extensions = { "*.srx", "*.*" }; //$NON-NLS-1$ //$NON-NLS-2$
				String[] names = { Messages.getString("SRXEditor.60"), Messages.getString("SRXEditor.61") }; //$NON-NLS-1$ //$NON-NLS-2$
				fd.setFilterExtensions(extensions);
				fd.setFilterNames(names);
				fd.setFilterPath(DirectoryTracker.lastDirectory(Constants.preferences));
				String name = fd.open();
				if (name != null) {
					DirectoryTracker.saveDirectory(fd.getFilterPath(), Constants.preferences);
					fileName = name;
				} else {
					return;
				}
			}
			try {
				XMLOutputter outputter = new XMLOutputter();
				outputter.preserveSpace(true);
				try (FileOutputStream output = new FileOutputStream(fileName)) {
					Indenter.indent(root, 2);
					outputter.output(doc, output);
				}
				MessageFormat mf = new MessageFormat(Messages.getString("SRXEditor.53")); //$NON-NLS-1$
				shell.setText(mf.format(new Object[] { fileName }));
				saved = true;
			} catch (Exception e) {
				MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
				if (e.getMessage() != null) {
					box.setMessage(e.getMessage());
				} else {
					box.setMessage(Messages.getString("SRXEditor.28")); //$NON-NLS-1$
				}
				box.open();
			}
		}
	}

	void openFile() {
		if (doc != null) {
			closeFile();
		}
		FileDialog fd = new FileDialog(shell, SWT.OPEN);
		String[] extensions = { "*.srx", "*.*" }; //$NON-NLS-1$ //$NON-NLS-2$
		String[] names = { Messages.getString("SRXEditor.31"), Messages.getString("SRXEditor.32") }; //$NON-NLS-1$ //$NON-NLS-2$
		fd.setFilterExtensions(extensions);
		fd.setFilterNames(names);
		fd.setFilterPath(DirectoryTracker.lastDirectory(Constants.preferences));
		String name = fd.open();
		if (name != null) {
			DirectoryTracker.saveDirectory(fd.getFilterPath(), Constants.preferences);
			openFile(name);
		}
	}

	private void openFile(String name) {
		try {
			SAXBuilder builder = new SAXBuilder();
			builder.setEntityResolver(new Catalog(Constants.catalog));
			doc = builder.build(name);
			root = doc.getRootElement();
			if (!root.getName().equals("srx")) { //$NON-NLS-1$
				doc = null;
				root = null;
				MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
				box.setMessage(Messages.getString("SRXEditor.34")); //$NON-NLS-1$
				box.open();
				return;
			}
			saved = true;
			if (!root.getAttributeValue("version").equals("2.0")) { //$NON-NLS-1$ //$NON-NLS-2$
				MessageBox box = new MessageBox(shell, SWT.ICON_QUESTION | SWT.YES | SWT.NO);
				box.setMessage(Messages.getString("SRXEditor.37")); //$NON-NLS-1$
				if (box.open() == SWT.YES) {
					convertFile(name);
					return;
				}
				doc = null;
				root = null;
				return;
			}
			buildLanguageTable();
			fileName = name;
			MessageFormat mf = new MessageFormat(Messages.getString("SRXEditor.53")); //$NON-NLS-1$
			shell.setText(mf.format(new Object[] { fileName }));
		} catch (Exception e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			if (e.getMessage() != null) {
				box.setMessage(e.getMessage());
			} else {
				box.setMessage(Messages.getString("SRXEditor.38")); //$NON-NLS-1$
			}
			box.open();
		}
	}

	private void buildLanguageTable() {
		Element maprules = root.getChild("body").getChild("maprules"); //$NON-NLS-1$ //$NON-NLS-2$
		Element langrules = root.getChild("body").getChild("languagerules"); //$NON-NLS-1$ //$NON-NLS-2$
		List<Element> maps = maprules.getChildren("languagemap"); //$NON-NLS-1$
		List<Element> rules = langrules.getChildren("languagerule"); //$NON-NLS-1$
		Iterator<Element> it = maps.iterator();
		while (it.hasNext()) {
			Element lang = it.next();
			TableItem item = new TableItem(languageTable, SWT.NONE);
			item.setText(new String[] { lang.getAttributeValue("languagerulename"), //$NON-NLS-1$
					lang.getAttributeValue("languagepattern") }); //$NON-NLS-1$
			Iterator<Element> rit = rules.iterator();
			while (rit.hasNext()) {
				Element set = rit.next();
				if (set.getAttributeValue("languagerulename").equals(lang.getAttributeValue("languagerulename"))) { //$NON-NLS-1$ //$NON-NLS-2$
					item.setData("rules", set); //$NON-NLS-1$
				}
			}
		}
	}

	private void convertFile(String name) {
		try {
			UpgradeSRX.upgrade(name);
			SAXBuilder builder = new SAXBuilder();
			builder.setEntityResolver(new Catalog(Constants.catalog));
			builder.setValidating(true);
			doc = builder.build(name);
			root = doc.getRootElement();
			buildLanguageTable();
			fileName = name;
			saved = true;
		} catch (Exception e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			if (e.getMessage() != null) {
				box.setMessage(e.getMessage());
			} else {
				box.setMessage(Messages.getString("SRXEditor.49")); //$NON-NLS-1$
			}
			box.open();
		}
	}

	void createFile() {
		fileName = "untitled.srx"; //$NON-NLS-1$
		MessageFormat mf = new MessageFormat(Messages.getString("SRXEditor.53")); //$NON-NLS-1$
		shell.setText(mf.format(new Object[] { fileName }));
		doc = new Document("http://www.lisa.org/srx20", "srx", null, null); //$NON-NLS-1$ //$NON-NLS-2$
		root = doc.getRootElement();
		root.setAttribute("version", "2.0"); //$NON-NLS-1$ //$NON-NLS-2$
		root.setAttribute("xsi:schemaLocation", "http://www.lisa.org/srx20 srx20.xsd"); //$NON-NLS-1$ //$NON-NLS-2$
		root.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance"); //$NON-NLS-1$ //$NON-NLS-2$
		Element header = new Element("header"); //$NON-NLS-1$
		header.setAttribute("segmentsubflows", "yes"); //$NON-NLS-1$ //$NON-NLS-2$
		header.setAttribute("cascade", "yes"); //$NON-NLS-1$ //$NON-NLS-2$
		root.addContent("\n"); //$NON-NLS-1$
		root.addContent(header);
		Element body = new Element("body"); //$NON-NLS-1$
		root.addContent("\n"); //$NON-NLS-1$
		root.addContent(body);
		root.addContent("\n"); //$NON-NLS-1$
		Element languagerules = new Element("languagerules"); //$NON-NLS-1$
		body.addContent("\n"); //$NON-NLS-1$
		body.addContent(languagerules);
		body.addContent("\n"); //$NON-NLS-1$
		Element maprules = new Element("maprules"); //$NON-NLS-1$
		body.addContent(maprules);
		body.addContent("\n"); //$NON-NLS-1$
		buildLanguageTable();
		saved = false;
	}

	private void createMenus(Menu bar) {
		MenuItem file = new MenuItem(bar, SWT.CASCADE);
		file.setText(Messages.getString("SRXEditor.39")); //$NON-NLS-1$
		Menu fileMenu = new Menu(file);
		file.setMenu(fileMenu);

		String suffix = "\tCtrl + N"; //$NON-NLS-1$
		int accel = SWT.CTRL | 'N';
		if (isMac) {
			suffix = "\tCmd + N"; //$NON-NLS-1$
			accel = SWT.COMMAND | 'N';
		}
		MenuItem newFile = new MenuItem(fileMenu, SWT.PUSH);
		newFile.setText(Messages.getString("SRXEditor.40") + suffix); //$NON-NLS-1$
		newFile.setAccelerator(accel);
		newFile.setImage(resourceManager.getPaper16());
		newFile.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				createFile();
			}

		});

		suffix = "\tCtrl + O"; //$NON-NLS-1$
		accel = SWT.CTRL | 'O';
		if (isMac) {
			suffix = "\tCmd + O"; //$NON-NLS-1$
			accel = SWT.COMMAND | 'O';
		}
		MenuItem open = new MenuItem(fileMenu, SWT.PUSH);
		open.setText(Messages.getString("SRXEditor.41") + suffix); //$NON-NLS-1$
		open.setAccelerator(accel);
		open.setImage(resourceManager.getOpen16());
		open.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				openFile();
			}

		});

		suffix = "\tCtrl + S"; //$NON-NLS-1$
		accel = SWT.CTRL | 'S';
		if (isMac) {
			suffix = "\tCmd + S"; //$NON-NLS-1$
			accel = SWT.COMMAND | 'S';
		}
		MenuItem save = new MenuItem(fileMenu, SWT.PUSH);
		save.setText(Messages.getString("SRXEditor.42") + suffix); //$NON-NLS-1$
		save.setAccelerator(accel);
		save.setImage(resourceManager.getSave16());
		save.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveFile();
			}

		});

		suffix = "\tCtrl + F4"; //$NON-NLS-1$
		accel = SWT.CTRL | SWT.F4;
		if (isMac) {
			suffix = "\tCmd + W"; //$NON-NLS-1$
			accel = SWT.COMMAND | 'W';
		}
		MenuItem close = new MenuItem(fileMenu, SWT.PUSH);
		close.setText(Messages.getString("SRXEditor.43") + suffix); //$NON-NLS-1$
		close.setAccelerator(accel);
		close.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				closeFile();
			}

		});

		MenuItem saveAs = new MenuItem(fileMenu, SWT.PUSH);
		saveAs.setText(Messages.getString("SRXEditor.44")); //$NON-NLS-1$
		saveAs.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveAs();
			}

		});

		if (!isMac) {

			new MenuItem(fileMenu, SWT.SEPARATOR);

			MenuItem exit = new MenuItem(fileMenu, SWT.PUSH);
			if (System.getProperty("file.separator").equals("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
				exit.setAccelerator(SWT.ALT | SWT.F4);
				exit.setText(Messages.getString("SRXEditor.47")); //$NON-NLS-1$
			} else {
				if (System.getProperty("os.name").startsWith("Mac")) { //$NON-NLS-1$ //$NON-NLS-2$
					exit.setAccelerator(SWT.COMMAND | 'Q');
					exit.setText(Messages.getString("SRXEditor.50")); //$NON-NLS-1$
				} else {
					exit.setAccelerator(SWT.CTRL | 'Q');
					exit.setText(Messages.getString("SRXEditor.51")); //$NON-NLS-1$
				}
			}
			exit.addSelectionListener(new SelectionAdapter() {

				@Override
				public void widgetSelected(SelectionEvent arg0) {
					shell.close();
				}

			});
		}
		MenuItem options = new MenuItem(bar, SWT.CASCADE);
		options.setText(Messages.getString("SRXEditor.52")); //$NON-NLS-1$
		Menu optionsMenu = new Menu(options);
		options.setMenu(optionsMenu);

		MenuItem languages = new MenuItem(optionsMenu, SWT.CASCADE);
		languages.setText(Messages.getString("SRXEditor.100")); //$NON-NLS-1$
		Menu langMenu = new Menu(languages);
		languages.setMenu(langMenu);
		/*
		 * MenuItem chineseTrad = new MenuItem(langMenu,SWT.PUSH);
		 * chineseTrad.setText(Messages.getString("SRXEditor.101")); //$NON-NLS-1$
		 * chineseTrad.addSelectionListener(new SelectionAdapter(){ public void
		 * widgetSelected(SelectionEvent arg0) { saveLanguage("zh-TW"); //$NON-NLS-1$ }
		 * });
		 */
		MenuItem english = new MenuItem(langMenu, SWT.PUSH);
		english.setText(Messages.getString("SRXEditor.102")); //$NON-NLS-1$
		english.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("en"); //$NON-NLS-1$
			}
		});

		MenuItem galician = new MenuItem(langMenu, SWT.PUSH);
		galician.setText(Messages.getString("SRXEditor.103")); //$NON-NLS-1$
		galician.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("gl"); //$NON-NLS-1$
			}
		});

		MenuItem german = new MenuItem(langMenu, SWT.PUSH);
		german.setText(Messages.getString("SRXEditor.104")); //$NON-NLS-1$
		german.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("de"); //$NON-NLS-1$
			}
		});

		MenuItem norwegian = new MenuItem(langMenu, SWT.PUSH);
		norwegian.setText(Messages.getString("SRXEditor.105")); //$NON-NLS-1$
		norwegian.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("no"); //$NON-NLS-1$
			}
		});

		MenuItem polish = new MenuItem(langMenu, SWT.PUSH);
		polish.setText(Messages.getString("SRXEditor.106")); //$NON-NLS-1$
		polish.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("pl"); //$NON-NLS-1$
			}
		});

		MenuItem portuguese = new MenuItem(langMenu, SWT.PUSH);
		portuguese.setText(Messages.getString("SRXEditor.107")); //$NON-NLS-1$
		portuguese.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("pt"); //$NON-NLS-1$
			}
		});

		MenuItem portugueseBR = new MenuItem(langMenu, SWT.PUSH);
		portugueseBR.setText(Messages.getString("SRXEditor.108")); //$NON-NLS-1$
		portugueseBR.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("pt-BR"); //$NON-NLS-1$
			}
		});
		/*
		 * MenuItem russian = new MenuItem(langMenu,SWT.PUSH);
		 * russian.setText(Messages.getString("SRXEditor.66")); //$NON-NLS-1$
		 * russian.addSelectionListener(new SelectionAdapter(){ public void
		 * widgetSelected(SelectionEvent arg0) { saveLanguage("ru"); //$NON-NLS-1$ } });
		 */
		MenuItem spanish = new MenuItem(langMenu, SWT.PUSH);
		spanish.setText(Messages.getString("SRXEditor.68")); //$NON-NLS-1$
		spanish.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("es"); //$NON-NLS-1$
			}
		});

		MenuItem turkish = new MenuItem(langMenu, SWT.PUSH);
		turkish.setText(Messages.getString("SRXEditor.70")); //$NON-NLS-1$
		turkish.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("tr"); //$NON-NLS-1$
			}
		});

		MenuItem ukrainian = new MenuItem(langMenu, SWT.PUSH);
		ukrainian.setText(Messages.getString("SRXEditor.72")); //$NON-NLS-1$
		ukrainian.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				saveLanguage("uk"); //$NON-NLS-1$
			}
		});

		MenuItem help = new MenuItem(bar, SWT.CASCADE);
		help.setText(Messages.getString("SRXEditor.54")); //$NON-NLS-1$
		Menu helpMenu = new Menu(help);
		help.setMenu(helpMenu);

		MenuItem helpItem = new MenuItem(helpMenu, SWT.PUSH);
		helpItem.setText(Messages.getString("SRXEditor.29")); //$NON-NLS-1$
		helpItem.setImage(resourceManager.getHelp16());
		helpItem.setAccelerator(SWT.F1);
		helpItem.addSelectionListener(new SelectionAdapter() {

			@Override
			public void widgetSelected(SelectionEvent arg0) {
				displayHelp();
			}

		});

		if (!isMac) {
			new MenuItem(helpMenu, SWT.SEPARATOR);

			MenuItem about = new MenuItem(helpMenu, SWT.PUSH);
			about.setText(Messages.getString("SRXEditor.55")); //$NON-NLS-1$
			about.addSelectionListener(new SelectionAdapter() {

				@Override
				public void widgetSelected(SelectionEvent arg0) {
					About aboutBox = new About(shell);
					aboutBox.show();
				}

			});
		}
	}

	void saveLanguage(String string) {
		try {
			Preferences prefs = Preferences.getInstance(Constants.preferences);
			prefs.save("languages", "userInterface", string); //$NON-NLS-1$ //$NON-NLS-2$
			MessageBox box = new MessageBox(shell, SWT.ICON_INFORMATION | SWT.OK);
			box.setMessage(Messages.getString("SRXEditor.30")); //$NON-NLS-1$
			box.open();
		} catch (Exception e) {
			MessageBox box = new MessageBox(shell, SWT.ICON_ERROR | SWT.OK);
			if (e.getMessage() != null) {
				box.setMessage(e.getMessage());
			} else {
				e.printStackTrace();
				box.setMessage(Messages.getString("SRXEditor.33")); //$NON-NLS-1$
			}
			box.open();
		}
	}

	private static String loadLanguage() {
		try {
			Preferences prefs = Preferences.getInstance(Constants.preferences);
			return prefs.get("languages", "userInterface", ""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		} catch (Exception e) {
			// do nothing
		}
		return ""; //$NON-NLS-1$
	}

	private static String getLanguage() {
		String lang = Locale.getDefault().toString();
		if (lang.toLowerCase().startsWith("en")) { //$NON-NLS-1$
			return "en"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("es")) { //$NON-NLS-1$
			return "es"; //$NON-NLS-1$
//		} else if (lang.toLowerCase().startsWith("fr")) { //$NON-NLS-1$
//			return "fr"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("de")) { //$NON-NLS-1$
			return "de"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("it")) { //$NON-NLS-1$
			return "it"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("pl")) { //$NON-NLS-1$
			return "pl"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("ru")) { //$NON-NLS-1$
			return "ru"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("tr")) { //$NON-NLS-1$
			return "tr"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("uk")) { //$NON-NLS-1$
			return "uk"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("ar")) { //$NON-NLS-1$
			return "ar"; //$NON-NLS-1$
//		} else if (lang.toLowerCase().startsWith("ja")) { //$NON-NLS-1$
//			return "ja"; //$NON-NLS-1$
//		} else if (lang.toLowerCase().startsWith("ko")) { //$NON-NLS-1$
//			return "ko"; //$NON-NLS-1$
//		} else if (lang.toLowerCase().matches("zh.cn")) { //$NON-NLS-1$
//			return "zh-cn"; //$NON-NLS-1$
//		} else if (lang.toLowerCase().matches("zh.tw")) { //$NON-NLS-1$
//			return "zh-tw"; //$NON-NLS-1$
		} else if (lang.toLowerCase().matches("pt.br")) { //$NON-NLS-1$
			return "pt-br"; //$NON-NLS-1$
		} else if (lang.toLowerCase().startsWith("pt")) { //$NON-NLS-1$
			return "pt"; //$NON-NLS-1$
		}
		// Set English as default language
		return "en"; //$NON-NLS-1$
	}

	protected void closeFile() {
		if (doc != null) {
			if (!saved) {
				MessageBox box = new MessageBox(shell, SWT.ICON_QUESTION | SWT.YES | SWT.NO);
				box.setMessage(Messages.getString("SRXEditor.56")); //$NON-NLS-1$
				if (box.open() == SWT.YES) {
					saveFile();
				}
			}
			doc = null;
			fileName = ""; //$NON-NLS-1$
			languageTable.removeAll();
			rulesTable.removeAll();
		}
	}

	void saveAs() {
		if (doc != null) {
			FileDialog fd = new FileDialog(shell, SWT.SAVE);
			String[] extensions = { "*.srx", "*.*" }; //$NON-NLS-1$ //$NON-NLS-2$
			String[] names = { Messages.getString("SRXEditor.60"), Messages.getString("SRXEditor.61") }; //$NON-NLS-1$ //$NON-NLS-2$
			fd.setFilterExtensions(extensions);
			fd.setFilterNames(names);
			File f = new File(fileName);
			fd.setFilterPath(f.getParent());
			fd.setFileName(f.getName());
			String name = fd.open();
			if (name != null) {
				DirectoryTracker.saveDirectory(fd.getFilterPath(), Constants.preferences);
				fileName = name;
				saveFile();
			}
		}
	}

	public static void main(String[] args) {
		try {
			Display.setAppName("SRXEditor"); //$NON-NLS-1$
			Display.setAppVersion(Constants.version);
			display = Display.getDefault();
			resourceManager = new ResourceManager(display);
			SRXEditor editor = new SRXEditor(args);
			editor.show();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void show() {
		shell.open();
		while (!shell.isDisposed()) {
			if (!display.readAndDispatch()) {
				display.sleep();
			}
		}
	}

	public static ResourceManager getResourceManager() {
		return resourceManager;
	}

	static MenuItem getItem(Menu menu, int id) {
		MenuItem[] items = menu.getItems();
		for (int i = 0; i < items.length; i++) {
			if (items[i].getID() == id)
				return items[i];
		}
		return null;
	}
}
