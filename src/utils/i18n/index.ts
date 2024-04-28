/**
 * Copyright 2023 alina sireneva
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import en from '../../locales/en'
import { Context } from '../../types'
import { I18nAdapter, I18nFunction, I18nStrings, I18nValue, OtherLanguageWrap } from './types'
import { createI18nStringsIndex, extractLanguageFromUpdate } from './utils'

export interface I18nParameters<Strings extends I18nStrings, Input extends Context> {
    primaryLanguage: {
        name: string
        strings: Strings
    }
    otherLanguages?: Record<string, OtherLanguageWrap<Strings>>
    defaultLanguage?: string
    adapter?: I18nAdapter<Input>
}

export default class I18n<Strings extends I18nStrings, Input extends Context> {
    public t: I18nFunction<Strings, Input>
    private indexes: Record<string, Record<string, I18nValue>>
    constructor(private params: I18nParameters<Strings, Input>) {
        const { primaryLanguage, otherLanguages, defaultLanguage = primaryLanguage.name, adapter = extractLanguageFromUpdate as unknown as I18nAdapter<Input> } = this.params
        this.indexes = { [primaryLanguage.name]: createI18nStringsIndex(primaryLanguage.strings) }
        const fallbackIndex = this.indexes[primaryLanguage.name]
        if (otherLanguages) {
            Object.keys(otherLanguages).forEach((lang) => {
                this.indexes[lang] = createI18nStringsIndex(otherLanguages[lang] as I18nStrings)
            })
        }
        if (!(defaultLanguage in this.indexes)) {
            throw new TypeError('defaultLanguage is not a registered language')
        }

        this.t = (lang: Input | string | null, key: string, ...params: unknown[]) => {
            if (!lang) lang = defaultLanguage
            if (typeof lang != 'string') {
                lang = adapter(lang) ?? defaultLanguage
            }

            const strings = this.indexes[lang] ?? fallbackIndex
            let val = strings[key] ?? fallbackIndex[key] ?? `[missing: ${key}]`
            if (typeof val == 'function') {
                val = val(...params)
            }

            return val
        }
    }
    public get langs() {
        return Object.keys(this.indexes).map((name: string) => this.indexes[name])
    }
}

export const i18n = new I18n({ primaryLanguage: { name: 'en', strings: en } })
