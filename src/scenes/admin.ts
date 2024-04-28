import { Scenes } from 'telegraf'
import { Context } from '../types'
import { inlines, keyboards, removeKeyboard } from '../keyboards'
import prisma from '../utils/prisma'
import compareDates from '../utils/compareDates'
import path from 'path'
import fs from 'fs'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import { callbackQuery, message } from 'telegraf/filters'
import { Language, Role } from '@prisma/client'
import { i18n } from '../utils/i18n'

const scene = new Scenes.BaseScene<Context>('admin')

scene.on(message('text'), async (ctx, next) => {
    const message = ctx.message.text
    if (ctx.scene.session.admin.scene != '') {
        if (message == 'Go to the panel') {
            ctx.scene.session.admin.scene = ''
            return await ctx.reply('Admin panel:', keyboards.g(ctx, 'admin.panel'))
        }
    }
    if (ctx.scene.session.admin.scene == 'user_select_id') {
        const user = await prisma.user.findUnique({ where: { id: Number(message) } })
        if (!user) {
            return await ctx.reply(`Couldn't find a user with this id, try again`, keyboards.g(ctx, 'admin.back'))
        }
        ctx.scene.session.admin.scene = 'user_update'
        ctx.scene.session.admin.update.user = user
        await ctx.reply('User found:', keyboards.g(ctx, 'admin.back'))
        await ctx.reply(
            `ID: ${user.id}\nRole: ${user.role}\nProfile id: ${user.profileId}\nLogin: ${user.login}\nSchool: ${user.school}\nLanguage: ${user.language}\nRegistration date: ${user.registrationDate}\n\nConversation id: ${user.conversationId}\nAttempts of deleting account: ${user.deleteAccountAttempts}\nLatest attempt of deleting account: ${user.latestDeleteAccountAttempt}\nReports: ${user.reports}\nViewed profiles: ${user.viewedProfiles}\nLiked profiles: ${user.likedProfiles}\nLiked by profiles: ${user.likedByProfiles}`,
            inlines.g(ctx, 'admin.user.update'),
        )
    }
    return next()
})

scene.on(callbackQuery('data'), async (ctx, next) => {
    const data = ctx.callbackQuery.data
    if (ctx.scene.session.admin.scene == 'user_update') {
        const user = ctx.scene.session.admin.update.user
        if (!user) {
            ctx.scene.session.admin.scene = ''
            return await ctx.reply('User not found, admin panel:', keyboards.g(ctx, 'admin.panel'))
        }
        if (data == 'user_delete') {
            await prisma.user.delete({ where: { id: user.id } })
            return await ctx.reply('User deleted', keyboards.g(ctx, 'admin.panel'))
        }
        const key = data.split('_')[2]
        switch (key) {
            case 'role':
                ctx.scene.session.admin.scene = 'user_set_role'
                await ctx.reply('Select the new role for the user:', inlines.g(ctx, 'admin.user.role'))
                break
            case 'language':
                ctx.scene.session.admin.scene = 'user_set_language'
                await ctx.reply(i18n.t(ctx, 'selectLanguage'), inlines.g(ctx, 'languages'))
                break
            default:
                break
        }
    } else if (ctx.scene.session.admin.scene == 'user_set_role') {
        const user = ctx.scene.session.admin.update.user
        if (!user) {
            ctx.scene.session.admin.scene = ''
            return await ctx.reply('User not found, admin panel:', keyboards.g(ctx, 'admin.panel'))
        }
        const role = data.split('_')[3] as Role
        if (((user.role == 'admin' && role == 'user') || role == 'admin') && ctx.session.user!.role != 'superadmin') {
            ctx.scene.session.admin.scene = ''
            return await ctx.reply('Permission denied, admin panel:', keyboards.g(ctx, 'admin.panel'))
        }
        await prisma.user.update({ where: { id: user.id }, data: { role } })
        ctx.scene.session.admin.scene = ''
        switch (role) {
            case 'banned':
                await ctx.telegram.sendMessage(Number(user.id), i18n.t(user.language, 'youWereBanned'), { reply_markup: removeKeyboard.reply_markup })
                break
            case 'user':
                if (user.role == 'banned') {
                    await ctx.telegram.sendMessage(Number(user.id), i18n.t(user.language, 'youWereUnbanned'), { reply_markup: keyboards.g(ctx, 'main', user).reply_markup })
                } else if (user.role == 'admin') {
                    await ctx.telegram.sendMessage(Number(user.id), i18n.t(user.language, 'youWereDemoted'))
                }
                break
            case 'admin':
                await ctx.telegram.sendMessage(Number(user.id), i18n.t(user.language, 'youWerePromoted'))
                break
        }
        await ctx.reply(`The role of a user set to ${role}, admin panel:`, keyboards.g(ctx, 'admin.panel'))
    } else if (ctx.scene.session.admin.scene == 'user_set_language') {
        const user = ctx.scene.session.admin.update.user
        if (!user) {
            ctx.scene.session.admin.scene = ''
            return await ctx.reply('User not found, admin panel:', keyboards.g(ctx, 'admin.panel'))
        }
        ctx.scene.session.admin.scene = ''
        const language = data.split('_')[1] as Language
        await prisma.user.update({ where: { id: user.id }, data: { language } })
        await ctx.reply(`User's language set to ${language}, admin panel:`, keyboards.g(ctx, 'admin.panel'))
    }
    return next()
})

scene.enter(async (ctx) => {
    ctx.scene.session.admin ??= { update: { user: null }, scene: '' }
    await ctx.reply('Admin panel:', keyboards.g(ctx, 'admin.panel'))
})

scene.hears('Metrics', async (ctx) => {
    const temporaryUsers = await prisma.temporaryUser.findMany()
    const users = await prisma.user.findMany()
    const profiles = await prisma.profile.findMany()
    const conversations = await prisma.conversation.findMany()
    const reports = await prisma.report.findMany()
    const newUsers = users.filter((user) => compareDates(user.registrationDate, new Date()))

    const females = profiles.filter((profile) => profile.gender == 'female')
    const males = profiles.filter((profile) => profile.gender == 'male')
    await ctx.reply(
        `Users count: ${users.length}\nProfiles count: ${profiles.length}\nConversations count: ${conversations.length}\nTemporary users count: ${temporaryUsers.length}\nReports count: ${reports.length}\nNew users today: ${newUsers.length}\n\nMen count: ${males.length}\nWomen count: ${females.length}`,
    )
})

scene.hears('Backups', async (ctx) => {
    const today = new Date()
    const date = `${today.getDay().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`
    const users = await prisma.user.findMany()
    const profiles = await prisma.profile.findMany()
    const reports = await prisma.report.findMany()
    const conversations = await prisma.conversation.findMany()
    const dirPath = path.join(__dirname, '..', '..', 'backups', date)
    const usersPath = path.join(__dirname, '..', '..', 'backups', date, `user.json`)
    const profilesPath = path.join(__dirname, '..', '..', 'backups', date, `profile.json`)
    const conversationsPath = path.join(__dirname, '..', '..', 'backups', date, `conversation.json`)
    const reportsPath = path.join(__dirname, '..', '..', 'backups', date, `report.json`)
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath)
    }
    fs.writeFile(usersPath, jsonStringifyBigInt(users), () => {
        fs.writeFile(profilesPath, jsonStringifyBigInt(profiles), async () => {
            fs.writeFile(conversationsPath, jsonStringifyBigInt(conversations), async () => {
                fs.writeFile(reportsPath, jsonStringifyBigInt(reports), async () => {
                    await ctx.replyWithDocument({ source: usersPath, filename: `users_${date}.json` }, { caption: `Users backup for ${date}` })
                    await ctx.replyWithDocument({ source: profilesPath, filename: `profiles_${date}.json` }, { caption: `Profiles backup for ${date}` })
                    await ctx.replyWithDocument({ source: conversationsPath, filename: `conversations_${date}.json` }, { caption: `Conversations backup for ${date}` })
                    await ctx.replyWithDocument({ source: reportsPath, filename: `reports_${date}.json` }, { caption: `Reports backup for ${date}` })
                })
            })
        })
    })
})

scene.hears('User', async (ctx) => {
    await ctx.reply('Choose an action:', inlines.g(ctx, 'admin.user.actions'))
})
scene.action('user_select', async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    ctx.scene.session.admin.scene = 'user_select_id'
    await ctx.reply(`Enter user's id:`, keyboards.g(ctx, 'admin.back'))
})

scene.command('exit', async (ctx) => {
    await ctx.reply('Leaved the admin panel', keyboards.g(ctx, 'main', ctx.session.user!))
    await ctx.scene.leave()
})

export default scene
