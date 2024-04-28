import { MiddlewareFn } from 'telegraf'
import { LOGS_GROUP } from './env'
import { Context } from './types'
import getConfig from './utils/getConfig'

const chat =
    (type: 'channel' | 'group' | 'supergroup' | 'private' | 'logs'): MiddlewareFn<Context> =>
    async (ctx, next) => {
        if (!ctx.chat) return
        if ((type == 'logs' && ctx.chat.id == LOGS_GROUP) || ctx.chat.type == type) return next()
        return
    }

const admins: MiddlewareFn<Context> = async (ctx, next) => {
    if (!ctx.session.authorized || !ctx.session.user) return
    const { admins, superadmin } = await getConfig()
    if (ctx.session.user.id == superadmin || admins.indexOf(ctx.session.user.id) != -1) return next()
    return
}

const authorized: MiddlewareFn<Context> = async (ctx, next) => {
    if (!ctx.session.authorized || !ctx.session.user || !ctx.session.profile) return
    return next()
}

const onConversation: MiddlewareFn<Context> = async (ctx, next) => {
    if (!ctx.session.authorized || !ctx.session.user || !ctx.session.user.conversationId) return
    return next()
}

export default { chat, admins, authorized, onConversation }
