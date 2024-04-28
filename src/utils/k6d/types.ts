/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Markup } from 'telegraf'
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from 'telegraf/types'

type Values<T> = T[keyof T]
type SafeGet<T, K extends string> = T extends Record<K, unknown> ? T[K] : never

export type MarkupType = ReplyKeyboardMarkup | InlineKeyboardMarkup

type DynamicK6dValue<Type extends MarkupType, Args extends any[] = any[]> = (lang: string, ...args: Args) => Markup.Markup<Type>
export type K6dValue<Type extends MarkupType, Args extends any[] = any[]> = Markup.Markup<Type> | DynamicK6dValue<Type, Args>
export type K6dKeyboards<Type extends MarkupType> = {
    [key: string]: K6dValue<Type> | K6dKeyboards<Type>
}

type NestedKeysDelimited<Type extends MarkupType, T> = Values<{
    [key in Extract<keyof T, string>]: T[key] extends K6dValue<Type> ? key : `${key}.${T[key] extends infer R ? NestedKeysDelimited<Type, R> : never}`
}>
type GetValueNested<T, K extends string> = K extends `${infer P}.${infer Q}` ? GetValueNested<SafeGet<T, P>, Q> : SafeGet<T, K>
type ExtractParameter<Type extends MarkupType, Keyboards, K extends string> = GetValueNested<Keyboards, K> extends (lang: string, ...params: infer R) => Markup.Markup<Type> ? R : []

export type K6dFunction<Type extends MarkupType, Keyboards, Input extends Context> = <K extends NestedKeysDelimited<Type, Keyboards>>(
    lang: Input | string | null,
    key: K,
    ...params: ExtractParameter<Type, Keyboards, K>
) => Markup.Markup<Type>

export type K6dAdapter<Input extends Context> = (obj: Input) => string | null | undefined
