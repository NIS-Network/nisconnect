import { Scenes } from 'telegraf'
import { Context } from '../types'
import prisma from '../utils/prisma'
import { i18n } from '../utils/i18n'
import { inlines, keyboards } from '../keyboards'
import { error } from '../utils/log'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import { callbackQuery } from 'telegraf/filters'
import { Profile } from '@prisma/client'

function sortByAgeDifference(target: number, profiles: Profile[]): Profile[] {
    const result: Profile[] = []
    const diffIsIndex: Profile[][] = []
    for (const profile of profiles) {
        const diff = Math.abs(target - profile.age)
        if (!diffIsIndex[diff]) {
            diffIsIndex[diff] = []
        }
        diffIsIndex[diff].push(profile)
    }
    for (const i of diffIsIndex) {
        if (!i) continue
        result.push(...i)
    }
    return result
}

async function show(ctx: Context) {
    const profile = ctx.session.profile!
    const user = ctx.session.user!
    ctx.session.searchResult ??= []
    if (ctx.session.searchResult.length == 0) {
        const newResult = await prisma.profile
            .findMany({
                where: {
                    searchingGender: { in: ['all', profile.gender] },
                    gender: profile.searchingGender == 'all' ? undefined : profile.searchingGender,
                    id: { not: profile.id, notIn: [...user.viewedProfiles, ...user.likedProfiles, ...user.likedByProfiles] },
                    status: 'enabled',
                },
            })
            .catch(
                async () => await error(ctx, `[scenes:searchResult:show] Error while selecting searchResult\n\nUser data: ${jsonStringifyBigInt(user)}\nProfile data: ${jsonStringifyBigInt(profile)}`),
            )
        if (!newResult) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedEnter'), keyboards.g(ctx, 'main', user))
            return await ctx.scene.leave()
        }
        ctx.session.searchResult = sortByAgeDifference(profile.age, newResult)
    }
    if (ctx.session.searchResult.length == 0) {
        return await ctx.reply(i18n.t(ctx, 'viewProfiles.noResultsLeft'), inlines.g(ctx, 'viewProfiles.emptyResult'))
    }
    const result = ctx.session.searchResult
    await ctx.sendPhoto(result[0].photoId, { caption: i18n.t(ctx, 'viewProfiles.caption', result[0]), reply_markup: keyboards.g(ctx, 'viewProfiles.actions').reply_markup })
}

const scene = new Scenes.BaseScene<Context>('viewProfiles')

scene.enter(show)

scene.hears(
    i18n.langs.map((lang) => lang['viewProfiles.buttons.like'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const result = ctx.session.searchResult
        if (result.length == 0) return await show(ctx)
        ctx.session.searchResult = result.slice(1, -1)
        const newUser = await prisma.user
            .update({
                where: { id: user.id },
                data: { likedProfiles: Array.from(new Set([...user.likedByProfiles, result[0].id])), viewedProfiles: Array.from(new Set([...user.viewedProfiles, result[0].id])) },
            })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[scenes:viewProfiles:like] Error while updating user's likedProfiles and viewedProfiles\n\nUser data: ${jsonStringifyBigInt(user)}\nLiked user's profileId: ${result[0].id}`,
                    ),
            )
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        ctx.session.user = newUser
        const likedUser = await prisma.user
            .findUnique({ where: { profileId: result[0].id } })
            .catch(async () => await error(ctx, `[scenes:viewProfiles:like] Error while selecting user\n\nUser's profileId: ${result[0].id}`))
        if (!likedUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        const newlikedUser = await prisma.user
            .update({ where: { id: likedUser.id }, data: { likedByProfiles: Array.from(new Set([...likedUser.likedByProfiles, user.profileId])) } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[scenes:viewProfiles:like] Error while updating user's likedByProfile\n\nUser's profileId: ${result[0].id}\nLiked by user data: ${jsonStringifyBigInt(likedUser)}`,
                    ),
            )
        if (!newlikedUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        await ctx.telegram.sendMessage(Number(newlikedUser.id), i18n.t(newlikedUser.language, 'viewProfiles.likedBy', newlikedUser.likedByProfiles.length, result[0]))
        await ctx.reply(i18n.t(ctx, 'viewProfiles.successfullLike'), keyboards.g(ctx, 'main', user))
        await show(ctx)
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewProfiles.buttons.quickMessage'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const result = ctx.session.searchResult
        if (result.length == 0) return await show(ctx)
        const newUser = await prisma.user
            .update({
                where: { id: user.id },
                data: { likedProfiles: Array.from(new Set([...user.likedProfiles, result[0].id])), viewedProfiles: Array.from(new Set([...user.viewedProfiles, result[0].id])) },
            })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[scenes:viewProfiles:quickMessage] Error while updating user's likedProfiles and viewedProfiles\n\nUser data: ${jsonStringifyBigInt(user)}\nLiked user's profileId: ${result[0].id}`,
                    ),
            )
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        ctx.session.user = newUser
        let likedUser = await prisma.user.findUnique({ where: { profileId: result[0].id } })
        if (!likedUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        likedUser = await prisma.user
            .update({ where: { id: likedUser.id }, data: { likedByProfiles: Array.from(new Set([...likedUser.likedByProfiles, user.profileId])) } })
            .catch(
                async () =>
                    await error(ctx, `[scenes:viewProfiles:like] Error while updating user's likedByProfile\n\nUser's profileId: ${result[0].id}\nLiked by user data: ${jsonStringifyBigInt(user)}`),
            )
        if (!likedUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedLike'))
            return await show(ctx)
        }
        await ctx.scene.enter('quickMessage')
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewProfiles.buttons.skip'] as string),
    async (ctx) => {
        const user = ctx.session.user!
        const result = ctx.session.searchResult
        ctx.session.searchResult = result.slice(1, -1)
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { viewedProfiles: Array.from(new Set([...user.viewedProfiles, result[0].id])) } })
            .catch(async () => await error(ctx, `[scenes:viewProfiles:show] Error while updating user's viewedProfiles\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!newUser) {
            await ctx.reply(i18n.t(ctx, 'viewProfiles.failedSkip'))
            return await show(ctx)
        }
        ctx.session.user = newUser
        await show(ctx)
    },
)

scene.hears(
    i18n.langs.map((lang) => lang['viewProfiles.buttons.leave'] as string),
    async (ctx) => {
        await ctx.reply(i18n.t(ctx, 'viewProfiles.stopedViewing'), keyboards.g(ctx, 'main', ctx.session.user!))
        return await ctx.scene.leave()
    },
)
scene.action('stopViewing', async (ctx) => {
    await ctx.reply(i18n.t(ctx, 'viewProfiles.stopedViewing'), keyboards.g(ctx, 'main', ctx.session.user!))
    return await ctx.scene.leave()
})

scene.action('startReviewing', async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const user = ctx.session.user!
    ctx.session.searchResult ??= []
    const newUser = await prisma.user
        .update({ where: { id: user.id }, data: { viewedProfiles: [] } })
        .catch(async () => await error(ctx, `[scenes:viewProfiles:startReviewing] Error while updating user\n\nUser data: ${jsonStringifyBigInt(user)}`))
    if (!newUser) {
        await ctx.reply(i18n.t(ctx, 'viewProfiles.failedEnter'), keyboards.g(ctx, 'main', user))
        return await ctx.scene.leave()
    }
    ctx.session.user = newUser
    await show(ctx)
})

scene.use(async (ctx) => await ctx.deleteMessage())

export default scene
