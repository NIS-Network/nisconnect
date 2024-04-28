/**
 * Copyright 2023 alina sireneva
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import { I18nValue, I18nValueDynamic } from '../types.js'

export function pluralizeRussian<T>(n: number, one: T, few: T, many: T): T {
    const mod10 = n % 10
    const mod100 = n % 100

    if (mod10 == 1 && mod100 != 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few

    return many
}

export function createPluralRussian<Args extends unknown[] = []>(
    one: I18nValue<[number, ...Args]>,
    few: I18nValue<[number, ...Args]>,
    many: I18nValue<[number, ...Args]>,
): I18nValueDynamic<[number, ...Args]> {
    return (n, ...args) => {
        const val = pluralizeRussian(n, one, few, many)
        if (typeof val == 'function') return val(n, ...args)

        return val
    }
}
