import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../../types'
import { message } from 'telegraf/filters'
import { i18n } from '../../utils/i18n'
import { keyboards } from '../../keyboards'
import prisma from '../../utils/prisma'
import { error } from '../../utils/log'
import jsonStringifyBigInt from '../../utils/jsonStringifyBigInt'

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
    await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.name', ctx.session.profile!.name), keyboards.g(ctx, 'myProfile.leaveCurrentProp'))
    return ctx.wizard.next()
}

const nameHandler = new Composer<Context>()
nameHandler.use(leaveCurrentProp)
nameHandler.on(message('text'), async (ctx) => {
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    const name = ctx.message.text
    if (name.length > 20) {
        return await ctx.reply(i18n.t(ctx, 'signUp.nameIsTooLong'), keyboards.g(ctx, 'myProfile.leaveCurrentProp'))
    }
    const newProfile = await prisma.profile
        .update({ where: { id: profile.id }, data: { name } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:changeProfileData:name:nameHandler:onMessageText] Error while updating a profile's name\n\nUser data: ${jsonStringifyBigInt(user)}\nProfile data: ${jsonStringifyBigInt(
                        profile,
                    )}`,
                ),
        )
    if (!newProfile) {
        await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.failedChange'), keyboards.g(ctx, 'main', user))
    } else {
        await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.successfulChange'), keyboards.g(ctx, 'main', user))
    }
    return await ctx.scene.leave()
})
nameHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('changeProfileData_name', enterScene, nameHandler)
