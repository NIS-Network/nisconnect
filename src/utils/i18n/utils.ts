/**
 * Copyright 2023 alina sireneva
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import { Context } from '../../types'
import { I18nStrings, I18nValue } from './types'

export function extractLanguageFromUpdate(ctx: Context): string | null | undefined {
    if (!ctx.session || !ctx.session.user) return typeof ctx.from != 'undefined' ? ctx.from.language_code : null
    return ctx.session.user.language
}

export function createI18nStringsIndex(strings: I18nStrings): Record<string, I18nValue> {
    const ret: Record<string, I18nValue> = {}

    function add(obj: I18nStrings, prefix: string) {
        for (const key in obj) {
            const val = obj[key]

            if (typeof val == 'object') {
                add(val, prefix + key + '.')
            } else {
                ret[prefix + key] = val as string
            }
        }
    }

    add(strings, '')

    return ret
}
