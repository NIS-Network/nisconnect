import { MiddlewareFn } from 'telegraf'
import { Context } from '../types'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import { error } from '../utils/log'
import prisma from '../utils/prisma'

const middleware: MiddlewareFn<Context> = async (ctx, next) => {
    if (typeof ctx.from == 'undefined') return
    ctx.session ??= { authorized: false, user: null, profile: null, searchResult: [], likedByProfiles: [] }
    const user = await prisma.user.findUnique({ where: { id: ctx.from.id } })
    if (!user) return next()
    const profile = await prisma.profile.findUnique({ where: { id: user.profileId } })
    if (!profile) {
        await error(ctx, `[middlewares:session] User has not a Profile\n\nUser data: ${jsonStringifyBigInt(user)}`)
        return await ctx.reply("You have an account as a User but don't have a Profile. Please, report tech support")
    }
    ctx.session.authorized = true
    ctx.session.user = user
    ctx.session.profile = profile
    return next()
}

export default middleware
