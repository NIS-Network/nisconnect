import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context } from '../types'
import { ReportReason, User } from '@prisma/client'
import { i18n } from '../utils/i18n'
import { inlines } from '../keyboards'
import { error, report as logReport } from '../utils/log'
import { callbackQuery } from 'telegraf/filters'
import prisma from '../utils/prisma'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'

interface State {
    intruder: User
    caller: 'viewLikedByProfiles' | 'reportHandler'
}

const dontReport: MiddlewareFn<Context> = async (ctx, next) => {
    if (ctx.has(callbackQuery('data')) && ctx.callbackQuery.data == 'report_dont') {
        const { caller } = ctx.scene.state as State
        await ctx.deleteMessage()
        await ctx.reply(i18n.t(ctx, 'report.notCreated'))
        if (caller == 'viewLikedByProfiles') {
            await ctx.scene.leave()
            return await ctx.scene.enter('viewLikedByProfiles')
        }
        return await ctx.scene.leave()
    }
    return next()
}

const deleteOtherUpdates: MiddlewareFn<Context> = async (ctx) => await ctx.deleteMessage()

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    const { intruder, caller } = ctx.scene.state as State
    if (!intruder) {
        await error(ctx, `[scenes:report:enterScene] Intruder was not passed`)
        await ctx.reply(i18n.t(ctx, 'report.intruderNotFound'))
        return await ctx.scene.leave()
    }
    if (caller == 'reportHandler') {
        await ctx.deleteMessage()
    }
    await ctx.reply(i18n.t(ctx, 'report.whatReason'), inlines.g(ctx, 'report.reasons'))
    return ctx.wizard.next()
}

const reasonHandler = new Composer<Context>()
reasonHandler.use(dontReport)
reasonHandler.action(/report_(\w+)/, async (ctx) => {
    await ctx.deleteMessage()
    const { intruder, caller } = ctx.scene.state as State
    if (!intruder || !ctx.has(callbackQuery('data'))) {
        await error(ctx, `[scenes:report:enterScene] Intruder was not passed`)
        await ctx.reply(i18n.t(ctx, 'report.intruderNotFound'))
        return await ctx.scene.leave()
    }
    const reason = ctx.callbackQuery.data.split('_')[1] as ReportReason
    const report = await prisma.report
        .create({ data: { creatorId: ctx.session.user!.id, intruderId: intruder.id, reason } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:report:reasonHandler:action] Error while creating report\n\nReport data: ${jsonStringifyBigInt({ creatorId: ctx.session.user!.id, intruderId: intruder.id, reason })}`,
                ),
        )
    if (!report) {
        await ctx.reply(i18n.t(ctx, 'report.failedCreate'))
        return await ctx.scene.leave()
    }
    const newIntruder = await prisma.user
        .update({ where: { id: intruder.id }, data: { reports: { push: report.id } } })
        .catch(async () => await error(ctx, `[scenes:report:reasonHandler:action] Error while updating intruder's reports\n\nReport data: ${jsonStringifyBigInt(report)}`))
    if (!newIntruder) {
        await prisma.report
            .delete({ where: { id: report.id } })
            .catch(
                async () =>
                    await error(ctx, `[scenes:report:reasonHandler:action] Error while deleting report after failed to update intruder's reports\n\nReport data: ${jsonStringifyBigInt(report)}`),
            )
        await ctx.reply(i18n.t(ctx, 'report.failedCreate'))
        return await ctx.scene.leave()
    }
    await logReport(ctx, report)
    await ctx.reply(i18n.t(ctx, 'report.successfullCreate'))
    if (caller == 'viewLikedByProfiles') {
        await ctx.scene.leave()
        return await ctx.scene.enter('viewLikedByProfiles')
    }
    return await ctx.scene.leave()
})
reasonHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>('report', enterScene, reasonHandler)
