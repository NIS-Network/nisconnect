import { OtherLanguageWrap } from '../utils/i18n/types'
import en from './en'

const ru: OtherLanguageWrap<typeof en> = {
    locale: {
        flag: '🇷🇺',
        code: 'ru',
        name: 'Русский',
    },
    start: (name: string) =>
        `👋 Привет, ${name}!\n\nЯ бот, созданный исключительно для учеников НИШ. Ты можешь найди друзей и единомышленнков для проектов, общаться с другими учениками используя меня.`,
}

export default ru
