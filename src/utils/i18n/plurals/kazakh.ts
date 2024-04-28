import { I18nValue, I18nValueDynamic } from '../types.js'

export function pluralizeKazakh<T>(n: number, one: T): T {
    return one
}

export function createPluralRussian<Args extends unknown[] = []>(one: I18nValue<[number, ...Args]>): I18nValueDynamic<[number, ...Args]> {
    return (n, ...args) => {
        const val = pluralizeKazakh(n, one)
        if (typeof val == 'function') return val(n, ...args)

        return val
    }
}
