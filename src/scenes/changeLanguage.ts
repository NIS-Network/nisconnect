import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import { inlines, keyboards } from '../keyboards'
import { callbackQuery, message } from 'telegraf/filters'
import { Language } from '@prisma/client'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

const dontChangeLanguage: MiddlewareFn<Context> = async (ctx, next) => {
    if (ctx.has(message('text')) && ctx.message.text == i18n.t(ctx, 'settings.buttons.dontChangeLanguage')) {
        await ctx.reply(i18n.t(ctx, 'settings.languageNotChanged'), keyboards.g(ctx, 'main', ctx.session.user!))
        return await ctx.scene.leave()
    }
    return next()
}

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(ctx, 'settings.profileNotAffectedByLanguage'), keyboards.g(ctx, 'settings.dontChangeLanguage'))
    await ctx.reply(i18n.t(null, 'selectLanguage'), inlines.g(null, 'languages'))
    return ctx.wizard.next()
}

const languageHandler = new Composer<Context>()
languageHandler.use(dontChangeLanguage)
languageHandler.action(
    i18n.langs.map((lang) => `language_${lang['locale.code']}`),
    async (ctx) => {
        if (!ctx.has(callbackQuery('data'))) return
        const user = ctx.session.user!
        const language = ctx.callbackQuery.data.split('_')[1] as Language
        await ctx.deleteMessage()
        if (language == user.language) {
            await ctx.reply(i18n.t(ctx, 'settings.successfullChangeLanguage'), keyboards.g(ctx, 'main', user))
            return await ctx.scene.leave()
        }
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { language } })
            .catch(async () => await error(ctx, `[scenes:changeLanguage:languageHandler:action] Error while updating user's language\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'settings.failedChangeLanguage'), keyboards.g(ctx, 'main', user))
        } else {
            ctx.session.user = newUser
            await ctx.reply(i18n.t(ctx, 'settings.successfullChangeLanguage'), keyboards.g(ctx, 'main', newUser))
        }
        return await ctx.scene.leave()
    },
)
languageHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('changeLanguage', enterScene, languageHandler)
