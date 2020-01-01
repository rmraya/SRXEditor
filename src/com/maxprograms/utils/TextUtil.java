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

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.languages.RegistryParser;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLNode;
import com.maxprograms.xml.XMLUtils;

public class TextUtil {

	private static Document doc;
	private static Element root;
	private static Hashtable<String, String> descriptions;
	private static RegistryParser registry;

	public static String normalise(String string, boolean trim) {
		boolean repeat = false;
		String rs = ""; //$NON-NLS-1$
		int length = string.length();
		for (int i = 0; i < length; i++) {
			char ch = string.charAt(i);
			if (!Character.isSpaceChar(ch)) {
				if (ch != '\n') {
					rs = rs + ch;
				} else {
					rs = rs + " "; //$NON-NLS-1$
					repeat = true;
				}
			} else {
				rs = rs + " "; //$NON-NLS-1$
				while (i < length - 1 && Character.isSpaceChar(string.charAt(i + 1))) {
					i++;
				}
			}
		}
		if (repeat == true) {
			return normalise(rs, trim);
		}
		if (trim) {
			return rs.trim();
		}
		return rs;
	}

	public static String normalise(String string) {
		return normalise(string, true);
	}

	public static boolean isBidiChar(char c) {
		if (c >= '\u0590' && c <= '\u05FF') {
			return true; // Hebrew
		}
		if (c >= '\u0600' && c <= '\u06FF') {
			return true; // basic Arabic shapes
		}
		if (c >= '\uFB50' && c <= '\uFDFF') {
			return true; // Arabic presentation form A
		}
		if (c >= '\uFE70' && c <= '\uFEFF') {
			return true; // Arabic presentation form B
		}
		return false;
	}

	public static String[] getPageCodes() {
		TreeMap<String, Charset> charsets = new TreeMap<>(Charset.availableCharsets());
		Set<String> keys = charsets.keySet();
		String[] codes = new String[keys.size()];

		Iterator<String> i = keys.iterator();
		int j = 0;
		while (i.hasNext()) {
			Charset cset = charsets.get(i.next());
			codes[j++] = cset.displayName();
		}
		return codes;
	}

	private static void loadLanguages() throws SAXException, IOException, ParserConfigurationException {
		if (registry == null) {
			registry = new RegistryParser();
		}
		doc = null;
		root = null;
		descriptions = null;
		SAXBuilder builder = new SAXBuilder();
		doc = builder.build("lib/langCodes.xml"); //$NON-NLS-1$
		root = doc.getRootElement();
		List<Element> list = root.getChildren("lang"); //$NON-NLS-1$
		Iterator<Element> i = list.iterator();
		descriptions = new Hashtable<>();
		while (i.hasNext()) {
			Element e = i.next();
			String code = e.getAttributeValue("code"); //$NON-NLS-1$
			descriptions.put(code, registry.getTagDescription(code));
		}
	}

	public static String[] getLanguageNames() throws SAXException, IOException, ParserConfigurationException {

		if (registry == null) {
			loadLanguages();
		}

		TreeSet<String> set = new TreeSet<>();
		Enumeration<String> keys = descriptions.keys();
		while (keys.hasMoreElements()) {
			String key = keys.nextElement();
			set.add(key + " " + descriptions.get(key)); //$NON-NLS-1$
		}
		return set.toArray(new String[set.size()]);
	}

	public static String getLanguageCode(String language) {
		if (language.equals("")) { //$NON-NLS-1$
			return ""; //$NON-NLS-1$
		}
		if (registry == null) {
			try {
				loadLanguages();
			} catch (Exception e) {
				e.printStackTrace();
				return ""; //$NON-NLS-1$
			}
		}
		Enumeration<String> keys = descriptions.keys();
		while (keys.hasMoreElements()) {
			String key = keys.nextElement();
			if (language.equals(key + " " + descriptions.get(key))) { //$NON-NLS-1$
				return key;
			}
		}
		// not included in default list
		return language;
	}

	public static String getLanguageName(String language) {
		if (language.equals("")) { //$NON-NLS-1$
			return ""; //$NON-NLS-1$
		}

		if (registry == null) {
			try {
				loadLanguages();
			} catch (SAXException | IOException | ParserConfigurationException e) {
				e.printStackTrace();
				return null;
			}
		}
		return language + " " + registry.getTagDescription(language); //$NON-NLS-1$
	}

	public static String extractText(Element src) {
		if (src == null) {
			return ""; //$NON-NLS-1$
		}
		String text = ""; //$NON-NLS-1$
		List<XMLNode> l = src.getContent();
		Iterator<XMLNode> i = l.iterator();
		while (i.hasNext()) {
			XMLNode o = i.next();
			if (o.getNodeType() == XMLNode.TEXT_NODE) {
				if (text.length() > 0) {
					if (src.getAttributeValue("xml:space", "default").equals("default")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
						text = text + " " + o.toString().trim(); //$NON-NLS-1$
					} else {
						text = text + o.toString().trim();
					}
				} else {
					text = text + o.toString().trim();
				}
				text = TextUtil.normalise(text);
			} else if (o.getNodeType() == XMLNode.ELEMENT_NODE) {
				Element e = (Element) o;
				// check for term entries and extract the text
				if (e.getName().equals("mrk") && e.getAttributeValue("mtype", "").equals("term")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
					if (text.length() > 0) {
						if (src.getAttributeValue("xml:space", "default").equals("default")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
							text = text + " " + XMLUtils.cleanText(e.getText().trim()); //$NON-NLS-1$
						} else {
							text = text + XMLUtils.cleanText(e.getText().trim());
						}
					} else {
						text = text + XMLUtils.cleanText(e.getText().trim());
					}
					text = TextUtil.normalise(text);
				}
			}
		}
		return text;
	}

	public static String calcTime(long l) {
		if (l < 0) {
			return "-:--:--:"; //$NON-NLS-1$
		}
		long seconds = l / 1000;
		long minutes = seconds / 60;
		long hours = minutes / 60;
		minutes = minutes - hours * 60;
		seconds = seconds - minutes * 60 - hours * 3600;
		String sec;
		if (seconds < 10) {
			sec = "0" + seconds; //$NON-NLS-1$
		} else {
			sec = "" + seconds; //$NON-NLS-1$
		}
		String min;
		if (minutes < 10) {
			min = "0" + minutes; //$NON-NLS-1$
		} else {
			min = "" + minutes; //$NON-NLS-1$
		}
		return hours + ":" + min + ":" + sec; //$NON-NLS-1$ //$NON-NLS-2$
	}

	public static boolean isBiDiLanguage(String language) throws IOException {
		// normalize language code
		language = TMUtils.normalizeLang(language);
		if (language == null) {
			throw new IOException(Messages.getString("TextUtil.0")); //$NON-NLS-1$
		}
		if (language.startsWith("ar") || language.startsWith("he") || language.startsWith("ur")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			return true;
		}
		return false;
	}

	public static String[] split(String string, String separator) {
		List<String> parts = new ArrayList<>();
		int index = string.indexOf(separator);
		while (index != -1) {
			parts.add(string.substring(0, index));
			string = string.substring(index + separator.length());
			index = string.indexOf(separator);
		}
		parts.add(string);
		return parts.toArray(new String[parts.size()]);
	}

	public static String toLowerCase(String lang, String string) {
		if (lang.startsWith("tr") || lang.startsWith("az")) { //$NON-NLS-1$ //$NON-NLS-2$
			String result = ""; //$NON-NLS-1$
			for (int i = 0; i < string.length(); i++) {
				char c = string.charAt(i);
				if (c == '\u0130') { // capital dotted i
					result = result + '\u0069'; // regular small i
				} else if (c == '\u0049') { // regular capital i (no dot)
					result = result + '\u0131'; // small dotless i
				} else {
					result = result + string.substring(i, i + 1).toLowerCase();
				}
			}
			return result;
		}
		return string.toLowerCase();
	}

	public static String toUpperCase(String lang, String string) {
		if (lang.startsWith("tr") || lang.startsWith("az")) { //$NON-NLS-1$ //$NON-NLS-2$
			String result = ""; //$NON-NLS-1$
			for (int i = 0; i < string.length(); i++) {
				char c = string.charAt(i);
				if (c == '\u0069') { // regular small i
					result = result + '\u0130'; // capital dotted i
				} else if (c == '\u0131') { // small dotless i
					result = result + '\u0049'; // regular capital i (no dot)
				} else {
					result = result + string.substring(i, i + 1).toUpperCase();
				}
			}
			return result;
		}
		return string.toUpperCase();
	}
}
