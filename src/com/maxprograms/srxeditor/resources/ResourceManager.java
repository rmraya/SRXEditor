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
package com.maxprograms.srxeditor.resources;

import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.widgets.Display;

public class ResourceManager {

	private Display display;
	private Image icon;
	private Image open16;
	private Image open;
	private Image save;
	private Image save16;
	private Image paper;
	private Image paper16;
	private Image gear;
	private Image gear16;
	private Image help;
	private Image help16;

	public ResourceManager(Display display) {
		this.display = display;
	}

	public Image getIcon() {
		if (icon == null) {
			icon = new Image(display, ResourceManager.class.getResourceAsStream("icon.png")); //$NON-NLS-1$
		}
		return icon;
	}

	public Image getOpen16() {
		if (open16 == null) {
			open16 = new Image(display, ResourceManager.class.getResourceAsStream("open16.png")); //$NON-NLS-1$
		}
		return open16;
	}

	public Image getOpen() {
		if (open == null) {
			open = new Image(display, ResourceManager.class.getResourceAsStream("open.png")); //$NON-NLS-1$
		}
		return open;
	}

	public Image getSave() {
		if (save == null) {
			save = new Image(display, ResourceManager.class.getResourceAsStream("save.png")); //$NON-NLS-1$
		}
		return save;
	}

	public Image getSave16() {
		if (save16 == null) {
			save16 = new Image(display, ResourceManager.class.getResourceAsStream("save16.png")); //$NON-NLS-1$
		}
		return save16;
	}

	public Image getPaper() {
		if (paper == null) {
			paper = new Image(display, ResourceManager.class.getResourceAsStream("paper.png")); //$NON-NLS-1$
		}
		return paper;
	}

	public Image getPaper16() {
		if (paper16 == null) {
			paper16 = new Image(display, ResourceManager.class.getResourceAsStream("paper16.png")); //$NON-NLS-1$
		}
		return paper16;
	}

	public Image getGear() {
		if (gear == null) {
			gear = new Image(display, ResourceManager.class.getResourceAsStream("gear.png")); //$NON-NLS-1$
		}
		return gear;
	}

	public Image getGear16() {
		if (gear16 == null) {
			gear16 = new Image(display, ResourceManager.class.getResourceAsStream("gear16.png")); //$NON-NLS-1$
		}
		return gear16;
	}

	public Image getHelp() {
		if (help == null) {
			help = new Image(display, ResourceManager.class.getResourceAsStream("help.png")); //$NON-NLS-1$
		}
		return help;
	}

	public Image getHelp16() {
		if (help16 == null) {
			help16 = new Image(display, ResourceManager.class.getResourceAsStream("help16.png")); //$NON-NLS-1$
		}
		return help16;
	}
}
