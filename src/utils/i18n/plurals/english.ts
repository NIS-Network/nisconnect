/**
 * Copyright 2023 alina sireneva
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */

import { I18nValue, I18nValueDynamic } from '../types.js'

export function ordinalSuffixEnglish(n: number): string {
    const v = n % 100
    if (v > 3 && v < 21) return 'th'

    switch (v % 10) {
        case 1:
            return 'st'
        case 2:
            return 'nd'
        case 3:
            return 'rd'
        default:
            return 'th'
    }
}

export function pluralizeEnglish<T>(n: number, one: T, many: T): T {
    return n == 1 ? one : many
}

export function createPluralEnglish<Args extends unknown[] = []>(one: I18nValue<[number, ...Args]>, many: I18nValue<[number, ...Args]>): I18nValueDynamic<[number, ...Args]> {
    if (typeof one == 'function' && typeof many == 'function') {
        return (n, ...args) => (n == 1 ? one(n, ...args) : many(n, ...args))
    }

    if (typeof one === 'string' && typeof many == 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (n, ...args) => (n == 1 ? one : many)
    }

    if (typeof one === 'string' && typeof many == 'function') {
        return (n, ...args) => (n == 1 ? one : many(n, ...args))
    }

    if (typeof one === 'function' && typeof many == 'string') {
        return (n, ...args) => (n == 1 ? one(n, ...args) : many)
    }

    throw new TypeError()
}
