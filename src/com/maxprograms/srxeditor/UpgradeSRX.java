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

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import com.maxprograms.xml.Catalog;
import com.maxprograms.xml.Document;
import com.maxprograms.xml.Element;
import com.maxprograms.xml.SAXBuilder;
import com.maxprograms.xml.XMLOutputter;

public class UpgradeSRX {

	public static void upgrade(String name) throws Exception {
		SAXBuilder builder = new SAXBuilder();
		builder.setEntityResolver(new Catalog(Constants.catalog));
		builder.setValidating(true);
		Document doc = builder.build(name);
		Element root = doc.getRootElement();

		if (!root.getAttributeValue("version").equals("1.0")) { //$NON-NLS-1$ //$NON-NLS-2$
			throw new Exception(Messages.getString("UpgradeSRX.2")); //$NON-NLS-1$
		}
		try (FileOutputStream out = new FileOutputStream(name + ".bak")) { //$NON-NLS-1$
			XMLOutputter outputter = new XMLOutputter();
			outputter.preserveSpace(true);
			outputter.output(doc, out);
		}

		try (FileOutputStream out = new FileOutputStream(name)) {

			writeStr(out, "<srx version=\"2.0\" xmlns=\"http://www.lisa.org/srx20\"\n" + //$NON-NLS-1$
					"               xsi:schemaLocation=\"http://www.lisa.org/srx20 srx20.xsd\"\n" + //$NON-NLS-1$
					"               xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n"); //$NON-NLS-1$
			Element header = root.getChild("header"); //$NON-NLS-1$
			writeStr(out, "  <header segmentsubflows=\"" + header.getAttributeValue("segmentsubflows", "yes") //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
					+ "\" cascade=\"yes\">\n"); //$NON-NLS-1$
			List<Element> formatHandlers = header.getChildren("formathandle"); //$NON-NLS-1$
			for (int i = 0; i < formatHandlers.size(); i++) {
				writeStr(out, "    " + formatHandlers.get(i) + "\n"); //$NON-NLS-1$ //$NON-NLS-2$
			}
			writeStr(out, "  </header>\n"); //$NON-NLS-1$
			Element body = root.getChild("body"); //$NON-NLS-1$
			writeStr(out, "  <body>\n"); //$NON-NLS-1$
			writeStr(out, "    <languagerules>\n"); //$NON-NLS-1$
			List<Element> languageRules = body.getChild("languagerules").getChildren(); //$NON-NLS-1$
			for (int i = 0; i < languageRules.size(); i++) {
				Element languageRule = languageRules.get(i);
				writeStr(out, "       <languagerule languagerulename=\"" //$NON-NLS-1$
						+ languageRule.getAttributeValue("languagerulename") + "\">\n"); //$NON-NLS-1$ //$NON-NLS-2$
				List<Element> rules = languageRule.getChildren("rule"); //$NON-NLS-1$
				List<Element> breaks = new ArrayList<>();
				List<Element> exceptions = new ArrayList<>();
				for (int j = 0; j < rules.size(); j++) {
					Element rule = rules.get(j);
					if (rule.getAttributeValue("break", "no").equals("no")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
						exceptions.add(rule);
					} else {
						breaks.add(rule);
					}
				}
				for (int j = 0; j < exceptions.size(); j++) {
					Element rule = exceptions.get(j);
					writeStr(out, "        <rule break=\"no\">\n"); //$NON-NLS-1$
					writeStr(out, "          " + rule.getChild("beforebreak") + "\n"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
					writeStr(out, "          " + rule.getChild("afterbreak") + "\n"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
					writeStr(out, "        </rule>\n"); //$NON-NLS-1$
				}
				for (int j = 0; j < breaks.size(); j++) {
					Element rule = breaks.get(j);
					writeStr(out, "        <rule break=\"yes\">\n"); //$NON-NLS-1$
					writeStr(out, "          " + rule.getChild("beforebreak") + "\n"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
					writeStr(out, "          " + rule.getChild("afterbreak") + "\n"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
					writeStr(out, "        </rule>\n"); //$NON-NLS-1$
				}
				writeStr(out, "       </languagerule>\n"); //$NON-NLS-1$
			}
			writeStr(out, "    </languagerules>\n"); //$NON-NLS-1$
			writeStr(out, "    <maprules>\n"); //$NON-NLS-1$
			List<Element> mapRules = body.getChild("maprules").getChildren("maprule"); //$NON-NLS-1$ //$NON-NLS-2$
			for (int i = 0; i < mapRules.size(); i++) {
				Element maprule = mapRules.get(i);
				List<Element> languageMaps = maprule.getChildren("languagemap"); //$NON-NLS-1$
				for (int j = languageMaps.size() - 1; j >= 0; j--) {
					writeStr(out, "      " + languageMaps.get(j) + "\n"); //$NON-NLS-1$ //$NON-NLS-2$
				}
			}
			writeStr(out, "    </maprules>\n"); //$NON-NLS-1$
			writeStr(out, "  </body>\n"); //$NON-NLS-1$
			writeStr(out, "</srx>\n"); //$NON-NLS-1$
		}
	}

	private static void writeStr(FileOutputStream out, String string) throws UnsupportedEncodingException, IOException {
		out.write(string.getBytes(StandardCharsets.UTF_8));
	}
}
