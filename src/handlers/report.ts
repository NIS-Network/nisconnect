import { MiddlewareFn } from 'telegraf'
import { Context } from '../types'
import { callbackQuery } from 'telegraf/filters'
import prisma from '../utils/prisma'
import { error } from '../utils/log'
import { i18n } from '../utils/i18n'

const report: MiddlewareFn<Context> = async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const user = ctx.session.user!
    const intruderId = Number(ctx.callbackQuery.data.split('_')[1])
    const intruder = await prisma.user
        .findUnique({ where: { id: intruderId } })
        .catch(async () => await error(ctx, `[handlers:report:report] Error while selecting intruder\n\nIntruder id: ${intruderId}`))
    if (!intruder) {
        return await ctx.reply(i18n.t(ctx, 'report.intruderNotFound'))
    }
    await ctx.scene.enter('report', { intruder, caller: 'reportHandler' })
    await prisma.user.update({ where: { id: user.id }, data: { likedByProfiles: user.likedByProfiles.filter((id) => id != intruder.profileId) } })
}

export default report
