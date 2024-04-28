interface ParsedResult {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export function parseMs(ms: number): ParsedResult {
    const result: ParsedResult = { days: 0, hours: 0, minutes: 0, seconds: 0 }

    result.days = Math.floor(ms / (24 * 60 * 60 * 1000))
    result.hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    result.minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
    result.seconds = Math.floor((ms % (60 * 1000)) / 1000)

    return result
}
