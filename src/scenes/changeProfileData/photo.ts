import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../../types'
import { message } from 'telegraf/filters'
import { i18n } from '../../utils/i18n'
import { keyboards } from '../../keyboards'
import prisma from '../../utils/prisma'
import jsonStringifyBigInt from '../../utils/jsonStringifyBigInt'
import { error } from '../../utils/log'

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
    await ctx.reply(i18n.t(ctx, 'myProfile.enterNewProp.photo'), keyboards.g(ctx, 'myProfile.leaveCurrentProp'))
    return ctx.wizard.next()
}

const photoHandler = new Composer<Context>()
photoHandler.use(leaveCurrentProp)
photoHandler.on(message('photo'), async (ctx) => {
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id
    const newProfile = await prisma.profile
        .update({ where: { id: profile.id }, data: { photoId } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:changeProfileData:photo:photoHandler:onMessagePhoto] Error while updating a profile's photoId\n\nUser data: ${jsonStringifyBigInt(
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
photoHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('changeProfileData_photo', enterScene, photoHandler)
