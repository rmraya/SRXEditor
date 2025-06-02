/*******************************************************************************
 * Copyright (c) 2008-2025 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

interface Rule {
    break: boolean;
    beforeBreak?: string;
    afterBreak?: string;
}

interface LanguageRule {
    rules: Rule[];
}

interface LanguageMap {
    langName: string;
    pattern: string;
}

interface Pair {
    langName: string;
    rule: Rule;
}