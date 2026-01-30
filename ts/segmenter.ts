/*******************************************************************************
 * Copyright (c) 2008-2026 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

import { Catalog, Constants, DOMBuilder, SAXParser, TextNode, XMLAttribute, XMLDocument, XMLElement, XMLNode, XMLUtils } from 'typesxml';
import { I18n } from './i18n.js';

export class Segmenter {

    static readonly STARTIGNORE = '@#$%~';
    static readonly ENDIGNORE = '~%$#@';

    root: XMLElement;
    cascade: boolean;
    rules: Array<XMLElement> = [];
    tags: Map<string, string> = new Map<string, string>();
    tagId = 0;
    i18n: I18n;

    constructor(srx: string | XMLDocument, srcLanguage: string, i18nPath: string, catalog?: Catalog) {
        this.i18n = new I18n(i18nPath);
        if (typeof srx === 'string') {
            const builder: DOMBuilder = new DOMBuilder();
            const parser: SAXParser = new SAXParser();
            parser.setContentHandler(builder);
            if (catalog) {
                builder.setCatalog(catalog);
                parser.setCatalog(catalog);
            }
            parser.parseFile(srx);
            const document: XMLDocument | undefined = builder.getDocument();
            if (!document) {
                throw new Error(this.i18n.getString('segmenter', 'unableToParse'));
            }
            const root: XMLElement | undefined = document.getRoot();
            if (!root) {
                throw new Error(this.i18n.getString('segmenter', 'missingRoot'));
            }
            this.root = root;
        } else {
            const root: XMLElement | undefined = srx.getRoot();
            if (!root) {
                throw new Error(this.i18n.getString('segmenter', 'missingRoot'));
            }
            this.root = root;
        }
        this.validateRoot();
        this.cascade = this.isCascading();
        this.buildRulesList(srcLanguage);
    }

    segmentRawString(text: string): string[] {
        return this.segmentString(text, false);
    }

    segment(text: string): string[] {
        return this.segmentString(text, true);
    }

    segmentElement(source: XMLElement): XMLElement {
        this.tags = new Map<string, string>();
        this.tagId = 0;
        let pureText: string = this.pureText(source);
        const parts: Array<string> = new Array<string>();
        for (let pos = 0; pos < pureText.length; pos++) {
            const left: string = this.hideTags(pureText.substring(0, pos));
            const right: string = this.hideTags(pureText.substring(pos));
            if (left.length === 0) {
                continue;
            }
            for (let i = 0; i < this.rules.length; i++) {
                const rule: XMLElement = this.rules[i];
                const breaks: boolean = rule.getAttribute('break')?.getValue() === 'yes' || !rule.getAttribute('break');
                const before: XMLElement | undefined = rule.getChild('beforebreak');
                const after: XMLElement | undefined = rule.getChild('afterbreak');
                const beforexp: string = before ? before.getText() : '';
                const afterxp: string = after ? after.getText() : '';
                if (beforexp && afterxp) {
                    if (this.endsWith(left, beforexp) && this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                } else if (beforexp) {
                    if (this.endsWith(left, beforexp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                } else {
                    if (this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                }
            }
        }
        parts.push(pureText);
        const result: Array<string> = new Array<string>(parts.length);
        for (let i = 0; i < parts.length; i++) {
            result[i] = this.cleanup(XMLUtils.cleanString(parts[i]));
        }
        if (result.length === 1) {
            const res: XMLElement = new XMLElement('seg-source');
            const mrk: XMLElement = new XMLElement('mrk');
            mrk.setAttribute(new XMLAttribute('mtype', 'seg'));
            mrk.setAttribute(new XMLAttribute('mid', '1'));
            mrk.setContent([...source.getContent()]);
            res.addElement(mrk);
            return res;
        }
        const res: XMLElement = new XMLElement('seg-source');
        for (let i = 0; i < result.length; i++) {
            const seg: string = '<mrk mtype="seg" mid="' + (i + 1) + '">' + result[i] + '</mrk>';
            const builder: DOMBuilder = new DOMBuilder();
            const parser: SAXParser = new SAXParser();
            parser.setContentHandler(builder);
            parser.parseString(seg);
            const docu: XMLDocument | undefined = builder.getDocument();
            const mrk: XMLElement | undefined = docu?.getRoot();
            if (mrk) {
                res.addElement(mrk);
            }
        }
        return res;
    }

    private segmentString(text: string, prepare: boolean): string[] {
        if (!text) {
            return [];
        }
        this.tags = new Map<string, string>();
        this.tagId = 0;
        let pureText: string = prepare ? this.prepareString(text) : text;
        const parts: Array<string> = new Array<string>();
        for (let pos = 0; pos < pureText.length; pos++) {
            const left: string = this.hideTags(pureText.substring(0, pos));
            const right: string = this.hideTags(pureText.substring(pos));
            if (left.length === 0) {
                continue;
            }
            for (let i = 0; i < this.rules.length; i++) {
                const rule: XMLElement = this.rules[i];
                const breaks: boolean = rule.getAttribute('break')?.getValue() === 'yes' || !rule.getAttribute('break');
                const before: XMLElement | undefined = rule.getChild('beforebreak');
                const after: XMLElement | undefined = rule.getChild('afterbreak');
                const beforexp: string = before ? before.getText() : '';
                const afterxp: string = after ? after.getText() : '';
                if (beforexp && afterxp) {
                    if (this.endsWith(left, beforexp) && this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                } else if (beforexp) {
                    if (this.endsWith(left, beforexp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                } else {
                    if (this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(pureText.substring(0, pos));
                            pureText = pureText.substring(pos);
                            pos = 0;
                        }
                        break;
                    }
                }
            }
        }
        parts.push(pureText);
        const result: Array<string> = new Array<string>(parts.length);
        for (let i = 0; i < parts.length; i++) {
            result[i] = this.cleanup(parts[i]);
        }
        return result;
    }

    private hideTags(text: string): string {
        let result: string = text;
        for (const key of this.tags.keys()) {
            const index: number = result.indexOf(key);
            if (index !== -1) {
                result = result.substring(0, index) + result.substring(index + 1);
            }
        }
        return result;
    }

    private endsWith(text: string, exp: string): boolean {
        const pattern: RegExp = new RegExp(exp, 'gu');
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
            if (match[0].length === 0) {
                pattern.lastIndex++;
                continue;
            }
            if (pattern.lastIndex === text.length) {
                return true;
            }
        }
        return false;
    }

    private startsWith(text: string, exp: string): boolean {
        const pattern: RegExp = new RegExp(exp, 'u');
        const match: RegExpExecArray | null = pattern.exec(text);
        return !!match && match.index === 0;
    }

    private prepareString(raw: string): string {
        let text: string = raw;
        this.tags = new Map<string, string>();
        let k = 0;

        let start: number = text.indexOf(Segmenter.STARTIGNORE);
        let end: number = text.indexOf(Segmenter.ENDIGNORE);

        while (start !== -1 && end !== -1) {
            if (start > end) {
                break;
            }
            const tag: string = text.substring(start + Segmenter.STARTIGNORE.length, end);
            text = text.substring(0, start) + String.fromCodePoint(0xE000 + k) + text.substring(end + Segmenter.ENDIGNORE.length);
            this.tags.set(String.fromCodePoint(0xE000 + k), tag);
            k++;
            start = text.indexOf(Segmenter.STARTIGNORE);
            end = text.indexOf(Segmenter.ENDIGNORE);
        }

        start = text.indexOf('<mrk ');
        end = text.indexOf('</mrk>');
        let e: number = text.indexOf('<mrk ', text.indexOf('>', start));
        while (e !== -1 && e < end) {
            end = text.indexOf('</mrk>', end + 1);
            e = text.indexOf('<mrk ', text.indexOf('>', e + 1));
        }

        while (start !== -1 && end !== -1) {
            if (start > end) {
                break;
            }
            const tag: string = text.substring(start, end + 6);
            text = text.substring(0, start) + String.fromCodePoint(0xE000 + k) + text.substring(end + 6);
            this.tags.set(String.fromCodePoint(0xE000 + k), tag);
            k++;
            start = text.indexOf('<mrk ');
            end = text.indexOf('</mrk>');
        }

        start = text.indexOf('<ph');
        end = text.indexOf('</ph>');

        while (start !== -1 && end !== -1) {
            if (start > end) {
                break;
            }
            const tag: string = text.substring(start, end + 5);
            text = text.substring(0, start) + String.fromCodePoint(0xE000 + k) + text.substring(end + 5);
            this.tags.set(String.fromCodePoint(0xE000 + k), tag);
            k++;
            start = text.indexOf('<ph');
            end = text.indexOf('</ph>');
        }

        let buffer: string = '';
        let element: string = '';
        const length: number = text.length;
        let inElement = false;
        for (let i = 0; i < length; i++) {
            const c: string = text.charAt(i);
            if (c === '<' && text.indexOf('>', i) !== -1) {
                inElement = true;
                const a: number = text.indexOf('<', i + 1);
                const b: number = text.indexOf('>', i + 1);
                if (a !== -1 && a < b) {
                    inElement = false;
                }
                if (i < length - 1 && !(/[A-Za-z]/.test(text.charAt(i + 1)) || text.charAt(i + 1) === '/')) {
                    inElement = false;
                }
            }
            if (inElement) {
                element += c;
            } else {
                buffer += c;
            }
            if (c === '>' && inElement) {
                inElement = false;
                this.tags.set(String.fromCodePoint(0xE000 + k), element);
                buffer += String.fromCodePoint(0xE000 + k);
                element = '';
                k++;
            }
        }
        return buffer;
    }

    private cleanup(text: string): string {
        let result: string = text;
        for (const [key, value] of this.tags.entries()) {
            result = result.split(key).join(value);
        }
        return result;
    }

    private buildRulesList(srcLanguage: string): void {
        const maps: Array<string> = new Array<string>();
        const body: XMLElement | undefined = this.root.getChild('body');
        const mapRules: XMLElement | undefined = body?.getChild('maprules');
        if (mapRules) {
            const allMaps: Array<XMLElement> = mapRules.getChildren();
            for (const map of allMaps) {
                const patternAttr: XMLAttribute | undefined = map.getAttribute('languagepattern');
                const nameAttr: XMLAttribute | undefined = map.getAttribute('languagerulename');
                if (patternAttr && nameAttr) {
                    const pattern: RegExp = new RegExp('^(?:' + patternAttr.getValue() + ')$', 'u');
                    if (pattern.test(srcLanguage)) {
                        maps.push(nameAttr.getValue());
                        if (!this.cascade) {
                            break;
                        }
                    }
                }
            }
        }
        this.rules = new Array<XMLElement>();
        const languageRules: XMLElement | undefined = body?.getChild('languagerules');
        if (languageRules) {
            const rules: Array<XMLElement> = languageRules.getChildren();
            for (const languagerule of rules) {
                const nameAttr: XMLAttribute | undefined = languagerule.getAttribute('languagerulename');
                if (nameAttr && maps.includes(nameAttr.getValue())) {
                    const ruleSet: Array<XMLElement> = languagerule.getChildren();
                    for (const rule of ruleSet) {
                        this.rules.push(rule);
                    }
                }
            }
        }
    }

    private isCascading(): boolean {
        const header: XMLElement | undefined = this.root.getChild('header');
        const cascadeAttr: XMLAttribute | undefined = header?.getAttribute('cascade');
        return cascadeAttr?.getValue() === 'yes';
    }

    private pureText(element: XMLElement): string {
        let result = '';
        const nodes: Array<XMLNode> = element.getContent();
        for (const node of nodes) {
            const nodeType: number = node.getNodeType();
            if (nodeType === Constants.TEXT_NODE) {
                result += (node as TextNode).getValue();
            } else {
                const placeholder: string = String.fromCodePoint(0xE000 + this.tagId);
                this.tags.set(placeholder, node.toString());
                result += placeholder;
                this.tagId++;
            }
        }
        return result;
    }

    private validateRoot(): void {
        if (this.root.getName() !== 'srx') {
            throw new Error(this.i18n.getString('segmenter', 'notSrxDocument'));
        }
        const version: XMLAttribute | undefined = this.root.getAttribute('version');
        const versionValue: string = version?.getValue() ?? 'undefined';
        if (versionValue !== '2.0') {
            const message: string = this.i18n.format(this.i18n.getString('segmenter', 'unsupportedVersion'), [versionValue]);
            throw new Error(message);
        }
    }
}
