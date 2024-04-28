import { Markup } from 'telegraf'
import { K6d } from './utils/k6d'
import { i18n } from '.'
import { Context } from './types'
import { User } from '@prisma/client'

const inlineKeyboards = {
    languages: Markup.inlineKeyboard(i18n.langs.map((lang) => Markup.button.callback(`${lang['locale.flag']} ${lang['locale.name']}`, `language_${lang['locale.code']}`))),
    signUp: {
        acceptPolicy: (lang: string) => Markup.inlineKeyboard([Markup.button.callback(i18n.t(lang, 'signUp.buttons.acceptPolicy'), 'acceptPolicy')]),
        selectGender: (lang: string) =>
            Markup.inlineKeyboard([Markup.button.callback(i18n.t(lang, 'gender.male'), 'gender_male'), Markup.button.callback(i18n.t(lang, 'gender.female'), 'gender_female')]),
        selectSearchingGender: (lang: string) =>
            Markup.inlineKeyboard([
                Markup.button.callback(i18n.t(lang, 'searchingGender.male'), 'searchingGender_male'),
                Markup.button.callback(i18n.t(lang, 'searchingGender.female'), 'searchingGender_female'),
                Markup.button.callback(i18n.t(lang, 'searchingGender.all'), 'searchingGender_all'),
            ]),
    },
    myProfile: {
        editProfile: (lang: string, ctx: Context) =>
            Markup.inlineKeyboard([
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.changeProfileData'), 'changeProfileData')],
                [
                    Markup.button.callback(
                        i18n.t(lang, ctx.session.profile!.status == 'enabled' ? 'myProfile.buttons.disableProfile' : 'myProfile.buttons.enableProfile'),
                        ctx.session.profile!.status == 'enabled' ? 'switchProfile_disabled' : 'switchProfile_enabled',
                    ),
                ],
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.viewLikedByProfiles'), 'viewLikedByProfiles')],
            ]),
        whatToChange: (lang: string) =>
            Markup.inlineKeyboard([
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.photo'), 'changeProfileData_photo')],
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.name'), 'changeProfileData_name'), Markup.button.callback(i18n.t(lang, 'myProfile.buttons.bio'), 'changeProfileData_bio')],
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.age'), 'changeProfileData_age')],
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.gender'), 'changeProfileData_gender')],
                [Markup.button.callback(i18n.t(lang, 'myProfile.buttons.searchingGender'), 'changeProfileData_searchingGender')],
                [Markup.button.callback(i18n.t(lang, 'buttons.back'), 'myProfile')],
            ]),
    },
    settings: {
        editSettings: (lang: string) =>
            Markup.inlineKeyboard([
                [Markup.button.callback(i18n.t(lang, 'settings.buttons.changeLanguage'), 'changeLanguage')],
                [Markup.button.callback(i18n.t(lang, 'settings.buttons.deleteAccount'), 'deleteAccount')],
            ]),
        yesDeleteMyProfile: (lang: string) => Markup.inlineKeyboard([Markup.button.callback(i18n.t(lang, 'settings.buttons.yesDeleteAccount'), 'yesDeleteAccount')]),
    },
    viewProfiles: {
        emptyResult: (lang: string) =>
            Markup.inlineKeyboard([
                [Markup.button.callback(i18n.t(lang, 'viewProfiles.buttons.startReviewing'), 'startReviewing')],
                [Markup.button.callback(i18n.t(lang, 'viewProfiles.buttons.stopViewing'), 'stopViewing')],
            ]),
    },
    report: {
        report: (lang: string, userId: bigint) => Markup.inlineKeyboard([Markup.button.callback(i18n.t(lang, 'report.buttons.report'), `report_${userId.toString()}`)]),
        reasons: (lang: string) =>
            Markup.inlineKeyboard([
                [Markup.button.callback(i18n.t(lang, 'report.buttons.reasons.inappropriate'), `report_inappropriate`)],
                [Markup.button.callback(i18n.t(lang, 'report.buttons.reasons.afk'), `report_afk`)],
                [Markup.button.callback(i18n.t(lang, 'report.buttons.reasons.sale'), `report_sales`)],
                [Markup.button.callback(i18n.t(lang, 'report.buttons.reasons.drugs'), `report_drugs`)],
                [Markup.button.callback(i18n.t(lang, 'report.buttons.reasons.other'), `report_other`)],
                [Markup.button.callback(i18n.t(lang, 'report.buttons.dontReport'), 'report_dont')],
            ]),
    },
    admin: {
        user: {
            actions: Markup.inlineKeyboard([[Markup.button.callback('Select', 'user_select')], [Markup.button.callback('Create', 'user_create')]]),
            update: Markup.inlineKeyboard([
                [Markup.button.callback('Update role', 'user_update_role'), Markup.button.callback('Update langugage', 'user_update_language')],
                [Markup.button.callback('Delete user', 'user_delete')],
            ]),
            role: Markup.inlineKeyboard([
                [Markup.button.callback('User', 'user_set_role_user'), Markup.button.callback('Admin', 'user_set_role_admin'), Markup.button.callback('Banned', 'user_set_role_banned')],
            ]),
        },
    },
}

export const inlines = new K6d({ defaultLanguage: 'en', keyboards: inlineKeyboards })

const replyKeyboards = {
    signUp: {
        stopRegistration: (lang: string) => Markup.keyboard([i18n.t(lang, 'signUp.buttons.stopRegistration')]).resize(),
    },
    main: (lang: string, user: User) =>
        Markup.keyboard([
            [i18n.t(lang, user.conversationId ? 'buttons.conversation.leave' : 'buttons.conversation.join'), i18n.t(lang, 'buttons.viewProfiles')],
            [i18n.t(lang, 'buttons.myProfile'), i18n.t(lang, 'buttons.settings')],
        ]).resize(),
    myProfile: {
        leaveCurrentProp: (lang: string) => Markup.keyboard([i18n.t(lang, 'myProfile.buttons.leaveCurrentProp')]).resize(),
    },
    custom: Markup.keyboard(['text']).resize(),
    settings: {
        dontChangeLanguage: (lang: string) => Markup.keyboard([i18n.t(lang, 'settings.buttons.dontChangeLanguage')]).resize(),
        dontDeleteAccount: (lang: string) => Markup.keyboard([i18n.t(lang, 'settings.buttons.dontDeleteAccount')]).resize(),
    },
    viewProfiles: {
        actions: (lang: string) =>
            Markup.keyboard([
                [i18n.t(lang, 'viewProfiles.buttons.like'), i18n.t(lang, 'viewProfiles.buttons.quickMessage'), i18n.t(lang, 'viewProfiles.buttons.skip'), i18n.t(lang, 'viewProfiles.buttons.leave')],
            ]).resize(),
    },
    quickMessage: {
        back: (lang: string) => Markup.keyboard([i18n.t(lang, 'quickMessage.buttons.back')]).resize(),
    },
    viewLikedByProfile: {
        actions: (lang: string) =>
            Markup.keyboard([
                [
                    i18n.t(lang, 'viewLikedByProfiles.buttons.like'),
                    i18n.t(lang, 'viewLikedByProfiles.buttons.skip'),
                    i18n.t(lang, 'viewLikedByProfiles.buttons.report'),
                    i18n.t(lang, 'viewLikedByProfiles.buttons.leave'),
                ],
            ]).resize(),
    },
    admin: {
        panel: Markup.keyboard([
            ['Metrics', 'Backups'],
            ['User', 'Config', 'Reports'],
        ]).resize(),
        back: Markup.keyboard(['Go to the panel']).resize(),
    },
}

export const removeKeyboard = Markup.removeKeyboard()

export const keyboards = new K6d({ defaultLanguage: 'en', keyboards: replyKeyboards })
