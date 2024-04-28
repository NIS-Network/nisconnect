import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../../types'
import { callbackQuery, message } from 'telegraf/filters'
import { i18n } from '../../utils/i18n'
import { inlines, keyboards } from '../../keyboards'
import prisma from '../../utils/prisma'
import { error } from '../../utils/log'
import jsonStringifyBigInt from '../../utils/jsonStringifyBigInt'
import { SearchingGender } from '@prisma/client'

const leaveCurrentProp: MiddlewareFn<Context> = async (ctx, next) => {
    if (ctx.has(message('text')) && ctx.message.text == i18n.t(ctx, 'myProfile.buttons.leaveCurrentProp')) {
        await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.changesDiscarded'), keyboards.g(ctx, 'main', ctx.session.user!))
        return await ctx.scene.leave()
    }
    return next()
}

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.changeGenderReminder'), keyboards.g(ctx, 'myProfile.leaveCurrentProp'))
    await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.searchingGender', ctx.session.profile!.searchingGender), inlines.g(ctx, 'signUp.selectSearchingGender'))
    return ctx.wizard.next()
}

const searchingGender = new Composer<Context>()
searchingGender.use(leaveCurrentProp)
searchingGender.action(['searchingGender_male', 'searchingGender_female', 'searchingGender_all'], async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    const searchingGender = ctx.callbackQuery.data.split('_')[1] as SearchingGender
    const newProfile = await prisma.profile
        .update({ where: { id: profile.id }, data: { searchingGender } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:changeProfileData:searchingGender:searchingGenderHandler:action] Error while updating a profile's searchingGender\n\nUser data: ${jsonStringifyBigInt(
                        user,
                    )}\nProfile data: ${jsonStringifyBigInt(profile)}`,
                ),
        )
    if (!newProfile) {
        await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.failedChange'), keyboards.g(ctx, 'main', user))
    } else {
        await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.successfulChange'), keyboards.g(ctx, 'main', user))
    }
    return await ctx.scene.leave()
})
searchingGender.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('changeProfileData_searchingGender', enterScene, searchingGender)
