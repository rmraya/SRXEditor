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

import { Catalog, DOMBuilder, SAXParser, XMLAttribute, XMLDocument, XMLElement } from 'typesxml';
import { I18n } from './i18n.js';

export class Segmenter {

    root: XMLElement;
    cascade: boolean;
    rules: Array<XMLElement> = [];
    invalidRulesCount: number = 0;
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
        this.validateRulesList();
    }

    segment(text: string): string[] {
        if (!text) {
            return [];
        }
        const parts: Array<string> = new Array<string>();
        let remaining: string = text;
        for (let pos: number = 0; pos < remaining.length; pos++) {
            const left: string = remaining.substring(0, pos);
            const right: string = remaining.substring(pos);
            if (left.length === 0) {
                continue;
            }
            for (let i: number = 0; i < this.rules.length; i++) {
                const rule: XMLElement = this.rules[i];
                const breaks: boolean = rule.getAttribute('break')?.getValue() === 'yes' || !rule.getAttribute('break');
                const before: XMLElement | undefined = rule.getChild('beforebreak');
                const after: XMLElement | undefined = rule.getChild('afterbreak');
                const beforexp: string = before ? before.getText() : '';
                const afterxp: string = after ? after.getText() : '';
                if (beforexp && afterxp) {
                    if (this.endsWith(left, beforexp) && this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(remaining.substring(0, pos));
                            remaining = remaining.substring(pos);
                            pos = -1;
                        }
                        break;
                    }
                } else if (beforexp) {
                    if (this.endsWith(left, beforexp)) {
                        if (breaks) {
                            parts.push(remaining.substring(0, pos));
                            remaining = remaining.substring(pos);
                            pos = -1;
                        }
                        break;
                    }
                } else {
                    if (this.startsWith(right, afterxp)) {
                        if (breaks) {
                            parts.push(remaining.substring(0, pos));
                            remaining = remaining.substring(pos);
                            pos = -1;
                        }
                        break;
                    }
                }
            }
        }
        parts.push(remaining);
        return parts;
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

    private validateRulesList(): void {
        const validRules: Array<XMLElement> = new Array<XMLElement>();
        this.invalidRulesCount = 0;
        for (const rule of this.rules) {
            const beforexp: string = rule.getChild('beforebreak')?.getText() ?? '';
            const afterxp: string = rule.getChild('afterbreak')?.getText() ?? '';
            if (this.isValidRegexp(beforexp) && this.isValidRegexp(afterxp)) {
                validRules.push(rule);
            } else {
                this.invalidRulesCount++;
            }
        }
        this.rules = validRules;
    }

    getInvalidRulesCount(): number {
        return this.invalidRulesCount;
    }

    private isValidRegexp(exp: string): boolean {
        if (!exp) {
            return true;
        }
        try {
            new RegExp(exp, 'u');
            return true;
        } catch {
            return false;
        }
    }

    private isCascading(): boolean {
        const header: XMLElement | undefined = this.root.getChild('header');
        const cascadeAttr: XMLAttribute | undefined = header?.getAttribute('cascade');
        return cascadeAttr?.getValue() === 'yes';
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
