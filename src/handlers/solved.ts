import { message } from 'telegraf/filters'
import { LOGS_GROUP } from '../env'
import { Context } from '../types'
import { MiddlewareFn } from 'telegraf'

const handler: MiddlewareFn<Context> = async (ctx: Context) => {
    if (!ctx.has(message('text'))) return
    const error = ctx.message.reply_to_message
    if (!error || !('text' in error)) return
    await ctx.telegram.unpinChatMessage(LOGS_GROUP, error.message_id)
    const status = error.text.split('\n')[0] as '#error' | '#solvederror'
    await ctx.deleteMessage()
    if (status == '#solvederror') return
    await ctx.telegram.editMessageText(LOGS_GROUP, error.message_id, undefined, error.text.replace(status, '#solvederror'))
}

export default handler
