import { callbackQuery } from 'telegraf/filters'
import { inlines, keyboards } from '../keyboards'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import { ProfileStatus } from '@prisma/client'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import { InlineKeyboardMarkup } from 'telegraf/types'
import { MiddlewareFn } from 'telegraf'

const myProfile: MiddlewareFn<Context> = async (ctx) => {
    if (ctx.has(callbackQuery('data'))) {
        await ctx.deleteMessage()
    }
    const profile = ctx.session.profile!
    await ctx.sendPhoto(profile.photoId, {
        caption: i18n.t(ctx, 'myProfile.caption', profile),
        reply_markup: inlines.g(ctx, 'myProfile.editProfile', ctx).reply_markup,
    })
}

const changeProfileData: MiddlewareFn<Context> = async (ctx) => {
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(ctx, 'myProfile.whatToChange'), inlines.g(ctx, 'myProfile.whatToChange'))
}

export type ChangeProfileDataProp = 'name' | 'bio' | 'age' | 'gender' | 'searchingGender' | 'photo'

const changeProfileDataProp: MiddlewareFn<Context> = async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const prop = ctx.callbackQuery.data.split('_')[1] as ChangeProfileDataProp
    await ctx.scene.enter(`changeProfileData_${prop}`)
}

const switchProfile: MiddlewareFn<Context> = async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const status = ctx.callbackQuery.data.split('_')[1] as ProfileStatus
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    if (status == profile.status) return
    const newProfile = await prisma.profile
        .update({ where: { id: profile.id }, data: { status } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[handlers:myProfile:switchProfile] Error while switching a profile's status\n\nProfile data: ${jsonStringifyBigInt(profile)}\nUser data: ${jsonStringifyBigInt(user)}`,
                ),
        )
    if (!newProfile) {
        return await ctx.reply(i18n.t(ctx, 'myProfile.failedSwitchingProfile'), keyboards.g(ctx, 'main', user))
    }
    ctx.session.profile = newProfile
    await ctx.answerCbQuery(i18n.t(ctx, status == 'enabled' ? 'myProfile.profileDisabled' : 'myProfile.profileEnabled'))
    await ctx.editMessageCaption(i18n.t(ctx, 'myProfile.caption', newProfile), { reply_markup: inlines.g(ctx, 'myProfile.editProfile', ctx).reply_markup as InlineKeyboardMarkup })
}

export default { myProfile, changeProfileData, changeProfileDataProp, switchProfile }
