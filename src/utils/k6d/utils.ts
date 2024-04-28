import { Context } from '../../types'
import { K6dKeyboards, K6dValue, MarkupType } from './types'

export function createK6dKeyboardsIndex<Type extends MarkupType>(keyboards: K6dKeyboards<Type>): Record<string, K6dValue<Type>> {
    const ret: Record<string, K6dValue<Type>> = {}
    function add(obj: K6dKeyboards<Type>, prefix: string) {
        for (const key in obj) {
            const val = obj[key]

            if (typeof val == 'object' && !('reply_markup' in val)) {
                add(val, prefix + key + '.')
            } else {
                ret[prefix + key] = val as K6dValue<Type>
            }
        }
    }
    add(keyboards, '')

    return ret
}

export function extractLanguageFromUpdate(ctx: Context): string | null | undefined {
    if (!ctx.session.user) return typeof ctx.from != 'undefined' ? ctx.from.language_code : null
    return ctx.session.user.language
}
