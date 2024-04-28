export const TOKEN = process.env.BOT_TOKEN!
export const LOGS_GROUP = Number(process.env.LOGS_GROUP)
export const TECH_SUPPORT = process.env.TECH_SUPPORT!
export const POLICY_ARTICLE = process.env.POLICY_ARTICLE!
export const SUPPORT_CHAT = process.env.SUPPORT_CHAT!
if (!TOKEN || isNaN(LOGS_GROUP) || !TECH_SUPPORT || !SUPPORT_CHAT) {
    throw new Error('BOT_TOKEN or LOGS_GROUP or TECH_SUPPORT or SUPPORT_CHAT not provided')
}
if (!POLICY_ARTICLE) {
    throw new Error('POLICY_ARTICLE not provided')
}
