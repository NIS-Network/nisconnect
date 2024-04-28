import { MiddlewareFn } from 'telegraf'
import { inlines } from '../keyboards'
import { Context } from '../types'
import getConfig from '../utils/getConfig'
import { i18n } from '../utils/i18n'

const settings: MiddlewareFn<Context> = async (ctx) => {
    const user = ctx.session.user!
    const config = await getConfig()
    await ctx.reply(i18n.t(ctx, 'settings.message', user, config), inlines.g(ctx, 'settings.editSettings'))
}

const changeLanguage: MiddlewareFn<Context> = async (ctx) => {
    await ctx.scene.enter('changeLanguage')
}

const deleteAccount: MiddlewareFn<Context> = async (ctx) => {
    await ctx.scene.enter('deleteAccount')
}

export default { settings, changeLanguage, deleteAccount }
