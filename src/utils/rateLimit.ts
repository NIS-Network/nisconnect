import { MiddlewareFn } from 'telegraf'
import { LOGS_GROUP } from '../env'
import { Context } from '../types'

class MemoryStore {
    public hits: Map<number, number>
    constructor(private clearPeriod: number) {
        this.hits = new Map()
        setInterval(this.reset.bind(this), this.clearPeriod)
    }

    increment(key: number) {
        let counter = this.hits.get(key) || 0
        counter++
        this.hits.set(key, counter)
        return counter
    }

    reset() {
        this.hits.clear()
    }
}

interface RateLimitParameters {
    window: number
    limit: number
    onLimitExceeded: MiddlewareFn<Context>
}

export default function rateLimit(params: RateLimitParameters) {
    const store = new MemoryStore(params.window)
    return (ctx: Context, next: () => Promise<void>) => {
        if (ctx.from == null || ctx.chat == null) return next()
        if (ctx.chat.id == LOGS_GROUP) return next()
        const key = ctx.from.id
        const hit = store.increment(key)
        return hit <= params.limit ? next() : params.onLimitExceeded(ctx, next)
    }
}
