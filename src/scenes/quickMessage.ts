import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { i18n } from '../utils/i18n'
import { Context } from '../types'
import getConfig from '../utils/getConfig'
import { message } from 'telegraf/filters'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import { inlines, keyboards } from '../keyboards'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

const back: MiddlewareFn<Context> = async (ctx, next) => {
    if (ctx.has(message('text')) && ctx.message.text == i18n.t(ctx, 'quickMessage.buttons.back')) {
        await ctx.scene.leave()
        return await ctx.scene.enter('viewProfiles')
    }
    return next()
}

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    const config = await getConfig()
    await ctx.reply(i18n.t(ctx, 'quickMessage.message', config.maxQuickMessageVideoDuration), keyboards.g(ctx, 'quickMessage.back'))
    return ctx.wizard.next()
}

const messageHandler = new Composer<Context>()
messageHandler.use(back)
messageHandler.on(message('text'), async (ctx) => {
    const sender = ctx.session.profile!
    const result = ctx.session.searchResult
    if (result.length == 0) {
        await ctx.reply('no result')
        await ctx.scene.leave()
        return await ctx.scene.enter('viewProfiles')
    }
    ctx.session.searchResult = result.slice(1, -1)
    const message = ctx.message.text
    const config = await getConfig()
    if (message.length < config.minQuickMessageTextLength) {
        return await ctx.reply(i18n.t(ctx, 'quickMessage.messageTooShort', config.minQuickMessageTextLength), keyboards.g(ctx, 'quickMessage.back'))
    }
    if (message.length > config.maxQuickMessageTextLength) {
        return await ctx.reply(i18n.t(ctx, 'quickMessage.messageTooLong', config.maxQuickMessageTextLength), keyboards.g(ctx, 'quickMessage.back'))
    }
    const reciever = await prisma.user
        .findUnique({ where: { profileId: result[0].id } })
        .catch(async () => await error(ctx, `[scenes:quickMessage:messageHandler:onMessageText] Error while selecting reciever\n\nReciever's profile data: ${jsonStringifyBigInt(result[0])}`))
    if (!reciever) {
        await ctx.reply(i18n.t(ctx, 'quickMessage.failedSend', 'text'))
        await ctx.scene.leave()
        return await ctx.scene.enter('viewProfiles')
    }

    await ctx.telegram.sendMessage(Number(reciever.id), i18n.t(reciever.language, 'viewProfiles.likedBy', reciever.likedByProfiles.length, result[0]))
    await ctx.telegram.sendMessage(Number(reciever.id), i18n.t(reciever.language, 'quickMessage.recievedFrom', 'text', sender.name))
    await ctx.telegram.sendMessage(Number(reciever.id), message, { reply_markup: inlines.g(ctx, 'report.report', ctx.session.user!.id).reply_markup, parse_mode: 'HTML' })
    await ctx.reply(i18n.t(ctx, 'quickMessage.successfullSendAndLike', 'text'), keyboards.g(ctx, 'main', ctx.session.user!))
    await ctx.scene.leave()
    return await ctx.scene.enter('viewProfiles')
})
messageHandler.on(message('video'), async (ctx) => {
    const sender = ctx.session.profile!
    const result = ctx.session.searchResult
    if (result.length == 0) {
        await ctx.reply('no result')
        await ctx.scene.leave()
        return await ctx.scene.enter('viewProfiles')
    }
    ctx.session.searchResult = result.slice(1, -1)
    const video = ctx.message.video
    const config = await getConfig()
    if (video.duration > config.maxQuickMessageVideoDuration) {
        return await ctx.reply(i18n.t(ctx, 'quickMessage.videoTooLong', config.maxQuickMessageVideoDuration), keyboards.g(ctx, 'quickMessage.back'))
    }
    const reciever = await prisma.user
        .findUnique({ where: { profileId: result[0].id } })
        .catch(async () => await error(ctx, `[scenes:quickMessage:messageHandler:onMessageVideo] Error while selecting reciever\n\nReciever's profile data: ${jsonStringifyBigInt(result[0])}`))
    if (!reciever) {
        await ctx.reply(i18n.t(ctx, 'quickMessage.failedSend', 'video'))
        await ctx.scene.leave()
        return await ctx.scene.enter('viewProfiles')
    }

    await ctx.telegram.sendMessage(Number(reciever.id), i18n.t(reciever.language, 'viewProfiles.likedBy', reciever.likedByProfiles.length, result[0]))
    await ctx.telegram.sendMessage(Number(reciever.id), i18n.t(reciever.language, 'quickMessage.recievedFrom', 'text', sender.name))
    await ctx.telegram.sendVideo(Number(reciever.id), video.file_id, {
        reply_markup: inlines.g(ctx, 'report.report', ctx.session.user!.id).reply_markup,
        parse_mode: 'HTML',
        caption: ctx.message.caption,
    })
    await ctx.reply(i18n.t(ctx, 'quickMessage.successfullSendAndLike', 'video'), keyboards.g(ctx, 'main', ctx.session.user!))
    await ctx.scene.leave()
    return await ctx.scene.enter('viewProfiles')
})
messageHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('quickMessage', enterScene, messageHandler)
