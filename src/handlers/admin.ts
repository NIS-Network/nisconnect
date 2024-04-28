import { MiddlewareFn } from 'telegraf'
import { Context } from '../types'

const handler: MiddlewareFn<Context> = async (ctx) => {
    await ctx.scene.enter('admin')
}

export default handler
