import { MiddlewareFn } from 'telegraf'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import { removeKeyboard } from '../keyboards'

const middleware: MiddlewareFn<Context> = async (ctx, next) => {
    const user = ctx.session.user
    if (user && user.role == 'banned') {
        return await ctx.reply(i18n.t(ctx, 'youAreBanned'), removeKeyboard)
    }
    return next()
}

export default middleware
