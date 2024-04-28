import { MiddlewareFn } from 'telegraf'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

const handler: MiddlewareFn<Context> = async (ctx) => {
    const user = ctx.session.user!
    if (user.likedByProfiles.length == 0) {
        return await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.noLikedBy'))
    }
    const likedByProfiles = []
    for (const id of user.likedByProfiles) {
        const likedBy = await prisma.profile
            .findUnique({ where: { id } })
            .catch(async () => await error(ctx, `[handlers:viewLikedByProfiles] Error while selecting likedByProfile\n\nLiked by profile id: ${id}`))
        if (!likedBy) {
            await prisma.user
                .update({ where: { id: user.id }, data: { likedByProfiles: user.likedByProfiles.filter((p) => p != id) } })
                .catch(
                    async () =>
                        await error(ctx, `[handlers:viewLikedByProfiles] Error while updating user's likedByProfiles after failed to select likedByProfile\n\nUser data: ${jsonStringifyBigInt(user)}`),
                )
            continue
        }
        likedByProfiles.push(likedBy)
    }
    ctx.session.likedByProfiles = likedByProfiles
    await ctx.scene.enter('viewLikedByProfiles')
}

export default handler
