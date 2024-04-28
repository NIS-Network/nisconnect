/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context } from '../../types'
import { K6dAdapter, K6dFunction, K6dKeyboards, MarkupType } from './types'
import { createK6dKeyboardsIndex, extractLanguageFromUpdate } from './utils'

export interface K6dParameters<Type extends MarkupType, Keyboards extends K6dKeyboards<Type>, Input extends Context> {
    keyboards: Keyboards
    defaultLanguage: string
    adapter?: K6dAdapter<Input>
}

export class K6d<Type extends MarkupType, Keyboards extends K6dKeyboards<Type>, Input extends Context = Context> {
    public g: K6dFunction<Type, Keyboards, Input>
    constructor(private params: K6dParameters<Type, Keyboards, Input>) {
        const { keyboards, defaultLanguage, adapter = extractLanguageFromUpdate as K6dAdapter<Input> } = this.params
        const indexes = createK6dKeyboardsIndex(keyboards)
        this.g = (lang: Input | string | null, key: string, ...params: unknown[]) => {
            if (!lang) lang = defaultLanguage
            if (typeof lang != 'string') {
                lang = adapter(lang) ?? defaultLanguage
            }
            let val = indexes[key]
            if (typeof val == 'function') {
                val = val(lang, ...params)
            }
            return val
        }
    }
}
