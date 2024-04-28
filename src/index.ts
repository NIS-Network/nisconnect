import { Telegraf, TelegramError, session } from 'telegraf'
import { Context } from './types'
import { TOKEN } from './env'
export { i18n } from './utils/i18n'
import middlewares from './middlewares'
import { Stage } from 'telegraf/scenes'
import scenes from './scenes'
import filters from './filters'
import handlers from './handlers'
import { i18n } from './utils/i18n'
import changeProfileData from './scenes/changeProfileData'
import { error } from './utils/log'
import rateLimit from './utils/rateLimit'
import { message } from 'telegraf/filters'
import { MessageType } from './handlers/conversation'
import { Prisma } from '@prisma/client'
import { AxiosError } from 'axios'

const bot = new Telegraf<Context>(TOKEN)
const stage = new Stage([...Object.values(scenes), ...Object.values(changeProfileData)])
bot.use(rateLimit({ limit: 1, window: 2000, onLimitExceeded: async (ctx) => await ctx.reply(i18n.t(ctx, 'dontSpam')) }))
bot.use(session())
bot.use(middlewares.session)
bot.use(middlewares.banned)
bot.use(stage.middleware())

bot.command('admin', filters.chat('private'), filters.admins, handlers.admin)
bot.command('solved', filters.chat('logs'), filters.admins, handlers.solved)
bot.command('id', filters.admins, async (ctx) => await ctx.reply(String(ctx.chat.id)))

bot.start(filters.chat('private'), handlers.start)

bot.hears(
    i18n.langs.map((lang) => lang['buttons.myProfile'] as string),
    filters.chat('private'),
    filters.authorized,
    handlers.myProfile.myProfile,
)
bot.action('myProfile', filters.chat('private'), filters.authorized, handlers.myProfile.myProfile)
bot.action('changeProfileData', filters.chat('private'), filters.authorized, handlers.myProfile.changeProfileData)
bot.action(/changeProfileData_(\w+)/, filters.chat('private'), filters.authorized, handlers.myProfile.changeProfileDataProp)
bot.action(/switchProfile_(\w+)/, filters.chat('private'), filters.authorized, handlers.myProfile.switchProfile)

bot.hears(
    i18n.langs.map((lang) => lang['buttons.settings'] as string),
    filters.chat('private'),
    filters.authorized,
    handlers.settings.settings,
)
bot.action('changeLanguage', filters.chat('private'), filters.authorized, handlers.settings.changeLanguage)
bot.action('deleteAccount', filters.chat('private'), filters.authorized, handlers.settings.deleteAccount)
bot.action('viewLikedByProfiles', filters.chat('private'), filters.authorized, handlers.viewLikedByProfiles)

bot.hears(
    i18n.langs.map((lang) => lang['buttons.conversation.join'] as string),
    filters.chat('private'),
    filters.authorized,
    handlers.conversation.joinConversation,
)
bot.hears(
    i18n.langs.map((lang) => lang['buttons.conversation.leave'] as string),
    filters.chat('private'),
    filters.authorized,
    handlers.conversation.leaveConversation,
)

bot.hears(
    i18n.langs.map((lang) => lang['buttons.viewProfiles'] as string),
    filters.chat('private'),
    filters.authorized,
    handlers.viewProfiles,
)

bot.action(/report_(\w+)/, filters.chat('private'), filters.authorized, handlers.report)

bot.use(filters.chat('private'), filters.authorized, filters.onConversation, async (ctx, next) => {
    for (const type of ['text', 'photo', 'voice', 'sticker', 'video', 'video_note']) {
        if (ctx.has(message(type as MessageType))) {
            await handlers.conversation.forward(type as MessageType)(ctx, next)
        }
    }
})

bot.catch(async (err, ctx) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        await error(ctx, `[bot:catch:prisma:known] [${err.code}] ${err.message}\n\n${err.meta ? `Meta: ${err.meta}` : ''}\n\n${err.stack ? `Stack: ${err.stack}` : ''}`)
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        await error(ctx, `[bot:catch:prisma:unknown] ${err.message}`)
    } else if (err instanceof Prisma.PrismaClientRustPanicError) {
        await error(ctx, `[bot:catch:prisma:panic] ${err.message}\n\n${err.stack ? `Stack: ${err.stack}` : ''}`)
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        await error(ctx, `[bot:catch:prisma:init] [${err.errorCode}] ${err.message}\n\n${err.stack ? `Stack: ${err.stack}` : ''}`)
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        await error(ctx, `[bot:catch:prisma:validation] ${err.message}\n\n${err.stack ? `Stack: ${err.stack}` : ''}`)
    } else if (err instanceof AxiosError) {
        await error(
            ctx,
            `[bot:catch:axios:${err.name}] ${err.code ? err.code : ''} ${err.message}\n\n${err.cause ? `Cause: ${err.cause}` : ''}\n${err.request ? `URL: ${err.request._currentUrl}\nMethod: ${err.request._options.method}` : ''}\n${err.stack ? `Stack: ${err.stack}` : ''}`,
        )
    } else if (err instanceof TelegramError) {
        await error(
            ctx,
            `[bot:catch:telegram:${err.name}] [${err.code}] ${err.message}\n\nDescription: ${err.description}\n${err.cause ? `Cause: ${err.cause}` : ''}\n${err.stack ? `Stack: ${err.stack}` : ''}`,
        )
    } else {
        await error(ctx, `[bot:catch] Unhandled error\n${String(err)}`)
    }
})

bot.launch()
