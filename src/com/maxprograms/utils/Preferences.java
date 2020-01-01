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
package com.maxprograms.utils;

import java.io.File;
import java.io.IOError;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Hashtable;

import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.HTreeMap;

public class Preferences {

	private String path;
	private DB mapdb;
	private HTreeMap<String, Hashtable<String, String>> hashmap;
	private static Preferences instance;

	public static Preferences getInstance(String file) throws IOException {
		if (instance == null) {
			instance = new Preferences(file);
		}
		return instance;
	}

	private Preferences(String file) throws IOException {
		path = getPreferencesDir() + file;
		File out = new File(path);
		try {
			mapdb = DBMaker.newFileDB(out).closeOnJvmShutdown().asyncWriteEnable().make();
		} catch (IOError ex) {
			if (out.exists()) {
				try {
					out.delete();
					File p = new File(new File(getPreferencesDir()), file + ".p"); //$NON-NLS-1$
					if (p.exists()) {
						p.delete();
					}
					File t = new File(new File(getPreferencesDir()), file + ".t"); //$NON-NLS-1$
					if (t.exists()) {
						t.delete();
					}
					mapdb = DBMaker.newFileDB(out).closeOnJvmShutdown().asyncWriteEnable().make();
				} catch (IOError ex2) {
					throw new IOException(ex2.getMessage());
				}
			} else {
				throw new IOException(ex.getMessage());
			}
		}
		hashmap = mapdb.getHashMap("preferences"); //$NON-NLS-1$
	}

	public synchronized static String getPreferencesDir() throws IOException {
		String directory;
		if (System.getProperty("file.separator").equals("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
			// Windows
			directory = System.getenv("AppData") + "\\Maxprograms\\"; //$NON-NLS-1$ //$NON-NLS-2$
		} else if (System.getProperty("os.name").startsWith("Mac")) { //$NON-NLS-1$ //$NON-NLS-2$
			// Mac
			directory = System.getProperty("user.home") + "/Library/Preferences/Maxprograms/"; //$NON-NLS-1$ //$NON-NLS-2$
		} else {
			// Linux
			directory = System.getProperty("user.home") + "/.maxprograms/"; //$NON-NLS-1$ //$NON-NLS-2$
		}
		File dir = new File(directory);
		if (!dir.exists()) {
			if (!dir.mkdirs()) {
				throw new IOException(Messages.getString("Preferences.0")); //$NON-NLS-1$
			}
		}
		return directory;
	}

	public synchronized void save(String group, String name, String value) {
		Hashtable<String, String> g = hashmap.get(group);
		if (g == null) {
			g = new Hashtable<String, String>();
		}
		g.put(name, value);
		hashmap.put(group, g);
		mapdb.commit();
	}

	public String get(String group, String name, String defaultValue) {
		Hashtable<String, String> g = hashmap.get(group);
		if (g == null) {
			return defaultValue;
		}
		String value = g.get(name);
		if (value == null) {
			return defaultValue;
		}
		return value;
	}

	public synchronized void save(String group, Hashtable<String, String> table) {
		Hashtable<String, String> g = hashmap.get(group);
		if (g != null) {
			Enumeration<String> keys = table.keys();
			while (keys.hasMoreElements()) {
				String key = keys.nextElement();
				g.put(key, table.get(key));
			}
			hashmap.put(group, g);
		} else {
			hashmap.put(group, table);
		}
		mapdb.commit();
	}

	public Hashtable<String, String> get(String group) {
		Hashtable<String, String> g = hashmap.get(group);
		if (g == null) {
			g = new Hashtable<String, String>();
		}
		return g;
	}

	public synchronized void remove(String group) {
		Hashtable<String, String> g = hashmap.get(group);
		if (g != null) {
			hashmap.remove(group);
			mapdb.commit();
		}
	}

	public void close() {
		mapdb.commit();
		mapdb.close();
	}
}
