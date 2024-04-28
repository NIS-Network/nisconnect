import { OtherLanguageWrap } from '../utils/i18n/types'
import en from './en'

const kz: OtherLanguageWrap<typeof en> = {
    locale: {
        flag: '🇰🇿',
        code: 'kz',
        name: 'Қазақ',
    },
    buttons: {
        back: 'Оралу',
        conversation: {
            join: 'Диалогқа қосылу',
            leave: 'Диалогтан шығу',
        },
        myProfile: 'Менің профилім',
        settings: 'Баптаулар',
        viewProfiles: 'Профильдерді шолу',
    },
    start: (name: string) => `👋 Сәлем, ${name}!\n\nМен тек НЗМ оқушыларына арналған ботпын. Мен арқылы достар мен жобаластар тауып, басқа оқушылармен араласа аласың.`,
    gender: {
        male: 'Ер',
        female: 'Әйел',
    },
    searchingGender: {
        male: 'Ұлдар',
        female: 'Қыңда',
    },
    pronouns: {
        all: 'ол',
        female: 'ол',
        male: 'ол',
    },
}

export default kz
