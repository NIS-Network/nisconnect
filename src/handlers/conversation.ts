import { MiddlewareFn } from 'telegraf'
import { keyboards } from '../keyboards'
import { Context } from '../types'
import { i18n } from '../utils/i18n'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import { error } from '../utils/log'
import prisma from '../utils/prisma'
import { message } from 'telegraf/filters'

export type MessageType = 'text' | 'photo' | 'video' | 'sticker' | 'voice' | 'video_note'

const joinConversation: MiddlewareFn<Context> = async (ctx) => {
    const user = ctx.session.user!
    const profile = ctx.session.profile!
    if (user.conversationId) {
        return await ctx.reply(i18n.t(ctx, 'conversation.alreadyJoined'), keyboards.g(ctx, 'main', user))
    }
    const conversation = await prisma.conversation
        .findFirst({
            where: { searchingGender: { in: ['all', profile.gender] }, gender: profile.searchingGender == 'all' ? undefined : profile.searchingGender },
            orderBy: { createdAt: 'asc' },
        })
        .catch(async () => await error(ctx, `[handlers:conversation:joinConversation] Error while selecting conversation\n\nProfile data: ${jsonStringifyBigInt(profile)}`))
    if (!conversation) {
        const newConversation = await prisma.conversation
            .create({ data: { gender: profile.gender, searchingGender: profile.searchingGender, membersIds: [user.id], members: { connect: { id: user.id } } } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:joinConversation] Error while creating conversation\n\nUser data: ${jsonStringifyBigInt(user)}\nProfile data: ${jsonStringifyBigInt(profile)}`,
                    ),
            )
        if (!newConversation) {
            return await ctx.reply(i18n.t(ctx, 'conversation.failedStarted'), keyboards.g(ctx, 'main', user))
        }
        return await ctx.reply(i18n.t(ctx, 'conversation.successfullStarted', profile), keyboards.g(ctx, 'main', { ...user, conversationId: newConversation.id }))
    }
    const newConversation = await prisma.conversation
        .update({ where: { id: conversation.id }, data: { members: { connect: { id: user.id } }, membersIds: { push: user.id } } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[handlers:conversation:joinConversation] Error while adding user to conversation members\n\nConversation data: ${jsonStringifyBigInt(conversation)}\nUser data: ${jsonStringifyBigInt(user)}`,
                ),
        )
    if (!newConversation) {
        return await ctx.reply(i18n.t(ctx, 'conversation.failedJoin'), keyboards.g(ctx, 'main', user))
    }
    const hostUser = await prisma.user
        .findUnique({ where: { id: newConversation.membersIds.filter((id) => id != user.id)[0] } })
        .catch(async () => await error(ctx, `[handlers:conversation:joinConversation] Error while selecting host user\n\nConversation data: ${jsonStringifyBigInt(newConversation)}`))
    if (!hostUser) {
        await prisma.conversation
            .delete({ where: { id: newConversation.id } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:joinConversation] Error while deleting conversation after failed to select host user\n\nConversation data: ${jsonStringifyBigInt(newConversation)}`,
                    ),
            )
        return await ctx.reply(i18n.t(ctx, 'conversation.failedJoin'), keyboards.g(ctx, 'main', user))
    }
    const hostProfile = await prisma.profile
        .findUnique({ where: { id: hostUser.profileId } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[handler:conversation:joinConversation] Error while selecting host profile\n\nConversation data: ${jsonStringifyBigInt(newConversation)}\nHost user data: ${jsonStringifyBigInt(hostUser)}`,
                ),
        )
    if (!hostProfile) {
        await prisma.conversation
            .delete({ where: { id: newConversation.id } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:joinConversation] Error while deleting conversation after failed to select host profile\n\nConversation data: ${jsonStringifyBigInt(newConversation)}\nHost user data: ${jsonStringifyBigInt(hostUser)}`,
                    ),
            )
        return await ctx.reply(i18n.t(ctx, 'conversation.failedJoin'), keyboards.g(ctx, 'main', user))
    }
    newConversation.membersIds
        .filter((id) => id != user.id)
        .forEach(async (id) => {
            const member = await prisma.user.findUnique({ where: { id } }).catch(async () => await error(ctx, ``))
            if (!member) return
            await ctx.telegram.sendMessage(Number(member.id), `${i18n.t(member.language, 'conversation.memberJoined', profile)}\n\n${i18n.t(member.language, 'conversation.joinDisclaimer')}`, {
                reply_markup: keyboards.g(member.language, 'main', member).reply_markup,
                parse_mode: 'HTML',
            })
        })
    await ctx.replyWithHTML(
        `${i18n.t(ctx, 'conversation.successfullJoin', hostProfile!)}\n\n${i18n.t(ctx, 'conversation.joinDisclaimer')}`,
        keyboards.g(ctx, 'main', { ...user, conversationId: newConversation.id }),
    )
}

const leaveConversation: MiddlewareFn<Context> = async (ctx) => {
    const user = ctx.session.user!
    if (!user.conversationId) {
        return await ctx.reply(i18n.t(ctx, 'conversation.notJoined'), keyboards.g(ctx, 'main', user))
    }
    const conversation = await prisma.conversation
        .findUnique({ where: { id: user.conversationId } })
        .catch(async () => await error(ctx, `[handlers:conversation:leaveConversation] Error while selecting conversation\n\nUser data: ${jsonStringifyBigInt(user)}`))
    if (!conversation) {
        const newUser = await prisma.user
            .update({ where: { id: user.id }, data: { conversation: undefined } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:leaveConversation] Error while nullifying user's conversation after failed to select conversation\nUser data: ${jsonStringifyBigInt(user)}`,
                    ),
            )
        if (!newUser) {
            return await ctx.reply(i18n.t(ctx, 'conversation.failedLeave'), keyboards.g(ctx, 'main', user))
        }
        return await ctx.reply(i18n.t(ctx, 'conversation.successfullLeave'), keyboards.g(ctx, 'main', newUser))
    }
    const newConversation = await prisma.conversation
        .update({
            where: { id: conversation.id },
            data: { members: { disconnect: { id: user.id } }, membersIds: conversation.membersIds.filter((id) => id != user.id) },
        })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[handlers:conversation:leaveConversation] Error while updating conversation\n\nConversation data: ${jsonStringifyBigInt(conversation)}\nUser data: ${jsonStringifyBigInt(user)}`,
                ),
        )
    if (!newConversation) {
        conversation.membersIds.forEach(async (id) => {
            const member = await prisma.user
                .findUnique({ where: { id } })
                .catch(async () => await error(ctx, `[handlers:conversation:leaveConversation] Error while seletcing conversation member\n\nConversation data: ${jsonStringifyBigInt(conversation)}`))
            if (!member) return
            await prisma.user
                .update({ where: { id: member.id }, data: { conversation: undefined } })
                .catch(async () => await error(ctx, `[handlers:conversation:leaveConversation] Error while nullifying conversation member's conversation\n\nUser data; ${jsonStringifyBigInt(member)}`))
            await ctx.telegram.sendMessage(Number(member.id), i18n.t(member.language, 'conversation.conversationAnomaly'), keyboards.g(member.language, 'main', { ...member, conversationId: null }))
        })
        await prisma.conversation
            .delete({ where: { id: conversation.id } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:leaveConversation] Error while deleting conversation after failed to update it\n\nConversation data: ${jsonStringifyBigInt(conversation)}`,
                    ),
            )
        return await ctx.reply(i18n.t(ctx, 'conversation.successfullLeave'), keyboards.g(ctx, 'main', { ...user, conversationId: null }))
    }
    newConversation.membersIds.forEach(async (id) => {
        const member = await prisma.user
            .findUnique({ where: { id } })
            .catch(async () => await error(ctx, `[handlers:conversation:leaveConversation] Error while seletcing conversation member\n\nConversation data: ${jsonStringifyBigInt(newConversation)}`))
        if (!member) return
        await prisma.user
            .update({ where: { id: member.id }, data: { conversation: undefined } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[handlers:conversation:leaveConversation] Error while nullifying conversation member's conversation\n\nMember data: ${jsonStringifyBigInt(member)}\nConversation data: ${jsonStringifyBigInt(newConversation)}`,
                    ),
            )
        await ctx.telegram.sendMessage(Number(member.id), `${i18n.t(member.language, 'conversation.memberLeaved')}\n${i18n.t(member.language, 'conversation.stopedConversation')}`, {
            reply_markup: keyboards.g(member.language, 'main', { ...member, conversationId: null }).reply_markup,
        })
    })
    const deletedConversation = await prisma.conversation
        .delete({ where: { id: newConversation.id } })
        .catch(async (ctx) => await error(ctx, `[handlers:conversation:leaveConversation] Error while delering conversation\n\nConversation data: ${jsonStringifyBigInt(newConversation)}`))
    if (!deletedConversation) {
        return await ctx.reply(i18n.t(ctx, 'conversation.failedLeave'), keyboards.g(ctx, 'main', user))
    }
    await ctx.reply(i18n.t(ctx, 'conversation.successfullLeave'), keyboards.g(ctx, 'main', { ...user, conversationId: null }))
}

const forward =
    (type: MessageType): MiddlewareFn<Context> =>
    async (ctx) => {
        const user = ctx.session.user!
        const conversation = await prisma.conversation
            .findUnique({ where: { id: user.conversationId! } })
            .catch(async () => await error(ctx, `[handlers:conversation:forward:${type}] Error while selecting conversation\n\nUser data: ${jsonStringifyBigInt(user)}`))
        if (!conversation) {
            await prisma.user.update({ where: { id: user.id }, data: { conversation: undefined } })
            return await ctx.reply(i18n.t(ctx, 'conversation.conversationAnomaly'), keyboards.g(ctx, 'main', { ...user, conversationId: null }))
        }
        conversation.membersIds
            .filter((id) => id != user.id)
            .forEach(async (id) => {
                const member = await prisma.user
                    .findUnique({ where: { id } })
                    .catch(async () => await error(ctx, `[handlers:conversation:forwardText] Error while selecting conversation member\n\nConversation data: ${jsonStringifyBigInt(conversation)}`))
                if (!member) return
                await ctx.telegram.sendMessage(Number(member.id), i18n.t(ctx, 'conversation.memberForwarded', type))
                switch (type) {
                    case 'text':
                        if (!ctx.has(message('text'))) break
                        await ctx.telegram.sendMessage(Number(member.id), ctx.message.text, { parse_mode: 'HTML' })
                        break
                    case 'photo':
                        if (!ctx.has(message('photo'))) break
                        await ctx.telegram.sendPhoto(Number(member.id), ctx.message.photo[ctx.message.photo.length - 1].file_id, { caption: ctx.message.caption, parse_mode: 'HTML' })
                        break
                    case 'video':
                        if (!ctx.has(message('video'))) break
                        await ctx.telegram.sendVideo(Number(member.id), ctx.message.video.file_id, { caption: ctx.message.caption, parse_mode: 'HTML' })
                        break
                    case 'sticker':
                        if (!ctx.has(message('sticker'))) break
                        await ctx.telegram.sendSticker(Number(member.id), ctx.message.sticker.file_id)
                        break
                    case 'voice':
                        if (!ctx.has(message('voice'))) break
                        await ctx.telegram.sendVoice(Number(member.id), ctx.message.voice.file_id)
                        break
                    case 'video_note':
                        if (!ctx.has(message('video_note'))) break
                        await ctx.telegram.sendVideo(Number(id), ctx.message.video_note.file_id)
                        break
                    default:
                        break
                }
            })
        await ctx.reply(i18n.t(ctx, 'conversation.forwarded', type))
    }

export default { joinConversation, leaveConversation, forward }
