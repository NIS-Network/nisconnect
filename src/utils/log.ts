import { Context } from '../types'
import { LOGS_GROUP } from '../env'
import { Report } from '@prisma/client'
import prisma from './prisma'

export async function error(ctx: Context, message: string): Promise<null> {
    console.error(message)
    const error = await ctx.telegram.sendMessage(LOGS_GROUP, `#error\n\n${message}`)
    await ctx.telegram.pinChatMessage(LOGS_GROUP, error.message_id, { disable_notification: true })
    return null
}

export async function info(ctx: Context, message: string): Promise<void> {
    console.info(message)
    await ctx.telegram.sendMessage(LOGS_GROUP, `#info\n\n${message}`)
}

export async function report(ctx: Context, report: Report): Promise<void> {
    const creator = await prisma.user.findUnique({ where: { id: report.creatorId } })
    const intruder = await prisma.user.findUnique({ where: { id: report.intruderId } })
    await ctx.telegram.sendMessage(
        LOGS_GROUP,
        `#report\n\nReport reason: ${report.reason}\n\nReport creator:\nID: ${report.creatorId}\nProfileID: ${creator!.profileId}\nReports: ${creator!.reports}\n\nIntruder:\nID: ${report.intruderId}\nProfileID: ${intruder!.profileId}\nReports: ${intruder!.reports}`,
    )
}
