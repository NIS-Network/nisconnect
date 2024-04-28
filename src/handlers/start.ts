import { MiddlewareFn } from 'telegraf'
import { keyboards } from '../keyboards'
import { Context } from '../types'
import { i18n } from '../utils/i18n'

const handler: MiddlewareFn<Context> = async (ctx) => {
    if (!ctx.session.authorized) {
        return await ctx.scene.enter('signUp')
    }
    await ctx.reply(i18n.t(ctx, 'start', ctx.from!.first_name), keyboards.g(ctx, 'main', ctx.session.user!))
}

export default handler
