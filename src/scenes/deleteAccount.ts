import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import { inlines, keyboards, removeKeyboard } from '../keyboards'
import { message } from 'telegraf/filters'
import microsLogin from '../utils/microsLogin'
import getConfig from '../utils/getConfig'
import prisma from '../utils/prisma'
import { error, info } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

const dontDeleteAccount: MiddlewareFn<Context> = async (ctx, next) => {
    if (ctx.has(message('text')) && ctx.message.text == i18n.t(ctx, 'settings.buttons.dontDeleteAccount')) {
        await ctx.reply(i18n.t(ctx, 'settings.accountNotDeleted'), keyboards.g(ctx, 'main', ctx.session.user!))
        return await ctx.scene.leave()
    }
    return next()
}

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    const user = ctx.session.user!
    const config = await getConfig()
    const now = Date.now()
    if (config.maxDeleteAccountAttempts - user.deleteAccountAttempts <= 0) {
        if (now - user.latestDeleteAccountAttempt.getTime() < config.deleteAccountCoolDown) {
            await ctx.reply(i18n.t(ctx, 'settings.tooMuchDeleteAccountAttempts', user, config), keyboards.g(ctx, 'main', user))
            return await ctx.scene.leave()
        } else
            await prisma.user
                .update({ where: { id: user.id }, data: { deleteAccountAttempts: 0, latestDeleteAccountAttempt: new Date() } })
                .catch(async () => await error(ctx, `[scenes:deleteAccount:enterScene] Error while setting user's deleteAccountAttempts to 0\n\nUser data: ${jsonStringifyBigInt(user)}`))
    }
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(ctx, 'settings.deleteAccountDisclaimer'), keyboards.g(ctx, 'settings.dontDeleteAccount'))
    await ctx.reply(i18n.t(ctx, 'settings.deleteAccountConfirmation'), inlines.g(ctx, 'settings.yesDeleteMyProfile'))
    return ctx.wizard.next()
}

const confirmationHandler = new Composer<Context>()
confirmationHandler.use(dontDeleteAccount)
confirmationHandler.action('yesDeleteAccount', async (ctx) => {
    const user = ctx.session.user!
    await ctx.deleteMessage()
    await prisma.user
        .update({ where: { id: user.id }, data: { latestDeleteAccountAttempt: new Date() } })
        .catch(async () => await error(ctx, `[scenes:deleteAccount:confirmationHandler:action] Error while updating user's latestDeleteAccountAttempt\n\nUser data: ${jsonStringifyBigInt(user)}`))
    await ctx.reply(i18n.t(ctx, 'settings.confirmYourOwnership', user.login), keyboards.g(ctx, 'settings.dontDeleteAccount'))
    return ctx.wizard.next()
})
confirmationHandler.use(deleteOtherUpdates)

const passwordHandler = new Composer<Context>()
passwordHandler.use(dontDeleteAccount)
passwordHandler.on(message('text'), async (ctx) => {
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    const password = ctx.message.text
    if (user.login == '000000000000') {
        await prisma.user.delete({ where: { id: user.id } })
        await prisma.profile.delete({ where: { id: profile.id } })
        await ctx.reply(i18n.t(ctx, 'settings.successfullDeleteAccount'), removeKeyboard)
        return ctx.scene.leave()
    }
    const school = await microsLogin(user.login, password)
    const config = await getConfig()
    const newUser = await prisma.user
        .update({ where: { id: user.id }, data: { deleteAccountAttempts: { increment: 1 } } })
        .catch(async () => await error(ctx, `[scenes:deleteAccount:passwordHandler:onMessageText] Error while updating user's deleteAccountAttempts\n\nUser data: ${jsonStringifyBigInt(user)}`))
    if (!newUser) {
        await ctx.reply(i18n.t(ctx, 'settings.failedDeleteAccount'), keyboards.g(ctx, 'main', user))
        return await ctx.scene.leave()
    }
    if (!school) {
        return await ctx.reply(i18n.t(ctx, 'settings.wrongPassword', newUser, config), keyboards.g(ctx, 'settings.dontDeleteAccount'))
    }
    await info(
        ctx,
        `User deleted his account :(\n\nUser data:\nID: ${newUser.id}\nLogin: ${newUser.login}\nSchool: ${newUser.school}\nProfileID: ${newUser.profileId}\n\nProfile data:\nAge: ${profile.age}\nName: ${profile.name}\nGender: ${profile.gender}\nSearching gender: ${profile.searchingGender}\nBio: ${profile.bio}\nPhotoID: ${profile.photoId}`,
    )
    await prisma.user.delete({ where: { id: newUser.id } })
    await prisma.profile.delete({ where: { id: profile.id } })
    await ctx.reply(i18n.t(ctx, 'settings.successfullDeleteAccount'), removeKeyboard)
    return ctx.scene.leave()
})
passwordHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('deleteAccount', enterScene, confirmationHandler, passwordHandler)
