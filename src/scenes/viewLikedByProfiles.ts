import { MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import { inlines, keyboards } from '../keyboards'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

async function show(ctx: Context) {
    const user = ctx.session.user!
    ctx.session.likedByProfiles ??= []
    if (ctx.session.likedByProfiles.length == 0) {
        await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.emptyLikedBy'), keyboards.g(ctx, 'main', user))
        return await ctx.scene.leave()
    }
    const result = ctx.session.likedByProfiles
    await ctx.sendPhoto(result[0].photoId, { caption: i18n.t(ctx, 'viewProfiles.caption', result[0]), reply_markup: keyboards.g(ctx, 'viewLikedByProfile.actions').reply_markup })
}

const scene = new Scenes.BaseScene<Context>('viewLikedByProfiles')

scene.enter(show)

scene.hears(
    i18n.langs.map((lang) => lang['viewLikedByProfiles.buttons.like'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const profile = ctx.session.profile!
        const result = ctx.session.likedByProfiles
        if (result.length == 0) return await show(ctx)
        ctx.session.likedByProfiles = result.slice(1, -1)
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { likedByProfiles: user.likedByProfiles.filter((id) => id != result[0].id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:like] Error while updating user's likedByProfiles\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        const likedByUser = await prisma.user
            .findUnique({ where: { profileId: result[0].id } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:like] Error while selecting user\n\nUser's profileId: ${result[0].id}`))
        if (!likedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        const newlikedByUser = await prisma.user
            .update({ where: { id: likedByUser.id }, data: { likedProfiles: likedByUser.likedProfiles.filter((id) => id != profile.id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:like] Error while updating user's likedProfiles\n\nUser data: ${jsonStringifyBigInt(likedByUser)}`))
        if (!newlikedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        const matchedUser = await ctx.telegram.getChat(Number(newlikedByUser.id))
        if (ctx.from.username) {
            await ctx.telegram.sendMessage(Number(newlikedByUser.id), i18n.t(newlikedByUser.language, 'viewLikedByProfiles.profilesMatched.username', profile.name, ctx.from.username), {
                reply_markup: inlines.g(newlikedByUser.language, 'report.report', user.id).reply_markup,
                parse_mode: 'HTML',
            })
        } else {
            await ctx.telegram.sendMessage(Number(newlikedByUser.id), i18n.t(newlikedByUser.language, 'viewLikedByProfiles.profilesMatched.id', profile.name, ctx.from.id), {
                reply_markup: inlines.g(newlikedByUser.language, 'report.report', user.id).reply_markup,
                parse_mode: 'HTML',
            })
        }
        if (matchedUser.type == 'private' && matchedUser.username) {
            await ctx.replyWithHTML(i18n.t(ctx, 'viewLikedByProfiles.profilesMatched.username', result[0].name, matchedUser.username), inlines.g(ctx, 'report.report', newlikedByUser.id))
        } else {
            await ctx.replyWithHTML(i18n.t(ctx, 'viewLikedByProfiles.profilesMatched.id', result[0].name, matchedUser.id), inlines.g(ctx, 'report.report', newlikedByUser.id))
        }
        await show(ctx)
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewLikedByProfiles.buttons.skip'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const profile = ctx.session.profile!
        const result = ctx.session.likedByProfiles
        if (result.length == 0) return await show(ctx)
        ctx.session.likedByProfiles = result.slice(1, -1)
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { likedByProfiles: user.likedByProfiles.filter((id) => id != result[0].id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:skip] Error while updating user's likedByProfiles\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedSkip'))
            return await show(ctx)
        }
        const likedByUser = await prisma.user
            .findUnique({ where: { profileId: result[0].id } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:skip] Error while selecting user\n\nUser's profileId: ${result[0].id}`))
        if (!likedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedSkip'))
            return await show(ctx)
        }
        const newlikedByUser = await prisma.user
            .update({ where: { id: likedByUser.id }, data: { likedProfiles: likedByUser.likedProfiles.filter((id) => id != profile.id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:skip] Error while updating user's likedProfiles\n\nUser data: ${jsonStringifyBigInt(likedByUser)}`))
        if (!newlikedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedSkip'))
            return await show(ctx)
        }
        await show(ctx)
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewLikedByProfiles.buttons.report'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const profile = ctx.session.profile!
        const result = ctx.session.likedByProfiles
        if (result.length == 0) return await show(ctx)
        ctx.session.likedByProfiles = result.slice(1, -1)
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { likedByProfiles: user.likedByProfiles.filter((id) => id != result[0].id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:report] Error while updating user's likedByProfiles\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedReport'))
            return await show(ctx)
        }
        const likedByUser = await prisma.user
            .findUnique({ where: { profileId: result[0].id } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:report] Error while selecting user\n\nUser's profileId: ${result[0].id}`))
        if (!likedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedReport'))
            return await show(ctx)
        }
        const newlikedByUser = await prisma.user
            .update({ where: { id: likedByUser.id }, data: { likedProfiles: likedByUser.likedProfiles.filter((id) => id != profile.id) } })
            .catch(async () => await error(ctx, `[scenes:viewLikedByProfiles:report] Error while updating user's likedProfiles\n\nUser data: ${jsonStringifyBigInt(likedByUser)}`))
        if (!newlikedByUser) {
            await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.failedSkip'))
            return await show(ctx)
        }
        await ctx.scene.leave()
        await ctx.scene.enter('report', { intruder: newlikedByUser, caller: 'viewLikedByProfiles' })
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewLikedByProfiles.buttons.leave'] as string),
    async (ctx) => {
        await ctx.reply(i18n.t(ctx, 'viewLikedByProfiles.stopedViewing'), keyboards.g(ctx, 'main', ctx.session.user!))
        return await ctx.scene.leave()
    },
)

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

scene.use(deleteOtherUpdates)

export default scene
