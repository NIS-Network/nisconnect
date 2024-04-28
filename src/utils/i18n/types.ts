/**
 * Copyright 2023 alina sireneva
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context } from '../../types'

type Values<T> = T[keyof T]
type SafeGet<T, K extends string> = T extends Record<K, unknown> ? T[K] : never

export type I18nValueDynamic<Args extends any[] = any[]> = (...args: Args) => string
export type I18nValue<Args extends any[] = any[]> = string | I18nValueDynamic<Args>
export interface I18nStrings {
    [key: string]: I18nValue | I18nStrings
}
export type OtherLanguageWrap<Strings> = {
    [key in keyof Strings]?: Strings[key] extends I18nValue<infer A> ? I18nValue<A> : Strings[key] extends Record<string, unknown> ? OtherLanguageWrap<Strings[key]> : never
}
export type I18nAdapter<Input extends Context> = (obj: Input) => string | null | undefined
type NestedKeysDelimited<T> = Values<{
    [key in Extract<keyof T, string>]: T[key] extends I18nValue ? key : `${key}.${T[key] extends infer R ? NestedKeysDelimited<R> : never}`
}>
type GetValueNested<T, K extends string> = K extends `${infer P}.${infer Q}` ? GetValueNested<SafeGet<T, P>, Q> : SafeGet<T, K>
type ExtractParameter<Strings, K extends string> = GetValueNested<Strings, K> extends (...params: infer R) => string ? R : []
export type OtherLanguageWrapExhaustive<Strings> = {
    [key in keyof Strings]: Strings[key] extends I18nValue<infer A> ? I18nValue<A> : Strings[key] extends Record<string, unknown> ? OtherLanguageWrapExhaustive<Strings[key]> : never
}
export type I18nFunction<Strings, Input extends Context> = <K extends NestedKeysDelimited<Strings>>(lang: Input | string | null, key: K, ...params: ExtractParameter<Strings, K>) => string
