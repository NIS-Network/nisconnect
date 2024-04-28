import { Composer, MiddlewareFn, Scenes } from 'telegraf'
import { Context, WizardSession } from '../types'
import { i18n } from '..'
import { inlines, keyboards, removeKeyboard } from '../keyboards'
import { callbackQuery, message } from 'telegraf/filters'
import { Gender, Language, SearchingGender } from '@prisma/client'
import { error, info } from '../utils/log'
import prisma from '../utils/prisma'
import microsLogin from '../utils/microsLogin'
import getConfig from '../utils/getConfig'
import jsonStringifyBigInt from '../utils/jsonStringifyBigInt'
import parseAgeFromId from '../utils/parseAgeFromId'

const stopRegistration = async (ctx: Context, next: () => Promise<void>) => {
    const language = ctx.scene.session.signUp.language
    if (ctx.has(message('text')) && ctx.message.text == i18n.t(language, 'signUp.buttons.stopRegistration')) {
        await ctx.reply(i18n.t(language, 'signUp.registrationStopped'), removeKeyboard)
        return await ctx.scene.leave()
    }
    return next()
}

const deleteOtherUpdates = async (ctx: Context) => await ctx.deleteMessage()

const mockSignUpSession: WizardSession['signUp'] = {
    temporaryUser: { id: -1n, acceptedPolicy: false, language: 'en', latestSignUpAttempt: new Date(), registrationDate: new Date(), signUpAttempts: 0 },
    login: '',
    school: 'tk',
    language: 'en',
    age: 0,
    gender: 'male',
    searchingGender: 'female',
    name: '',
    bio: '',
    photoId: '',
}

const enterScene: MiddlewareFn<Context> = async (ctx) => {
    ctx.scene.session.signUp ??= mockSignUpSession
    const config = await getConfig()
    let temporaryUser = await prisma.temporaryUser
        .findUnique({ where: { id: ctx.from!.id } })
        .catch(async () => await error(ctx, `[scenes:signUp:enterScene:use] Error while selecting temporary user\n\nTemporary user id: ${ctx.from!.id}`))
    if (!temporaryUser) {
        temporaryUser = await prisma.temporaryUser
            .create({ data: { id: ctx.from!.id } })
            .catch(async () => await error(ctx, `[scenes:signUp:enterScene:use] Error while selecting temporary user\n\nTemporary user id: ${ctx.from!.id}`))
    }
    if (!temporaryUser) {
        await error(ctx, `[scenes:signUp:enterScene:use] Error while selecting and creating temporary user\n\nTemporary user id: ${ctx.from!.id}`)
        await ctx.reply(i18n.t(ctx, 'signUp.failedStart'))
        return await ctx.scene.leave()
    }
    if (config.maxSignUpAttempts - temporaryUser.signUpAttempts <= 0) {
        if (Date.now() - temporaryUser.latestSignUpAttempt.getTime() < config.signUpCoolDown)
            return await ctx.reply(i18n.t(temporaryUser.language, 'signUp.tooMuchAttempts', temporaryUser, config), removeKeyboard)
        else
            await prisma.temporaryUser
                .update({ where: { id: temporaryUser.id }, data: { signUpAttempts: 0 } })
                .catch(
                    async () =>
                        await error(
                            ctx,
                            `[scenes:signUp:enterScene:user] Error while setting temporary user's signUpAttempts to 0\n\nTemporary user data: ${jsonStringifyBigInt(
                                ctx.scene.session.signUp.temporaryUser,
                            )}`,
                        ),
                )
    }
    ctx.scene.session.signUp.temporaryUser = temporaryUser
    await ctx.reply(i18n.t(null, 'selectLanguage'), inlines.g(null, 'languages'))
    return ctx.wizard.next()
}

const languageHandler = new Composer<Context>()
languageHandler.action(
    i18n.langs.map((lang) => `language_${lang['locale.code']}`),
    async (ctx) => {
        if (!ctx.has(callbackQuery('data'))) return
        const language = ctx.callbackQuery.data.split('_')[1] as Language
        await prisma.temporaryUser
            .update({ where: { id: ctx.scene.session.signUp.temporaryUser.id }, data: { language } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[scenes:signUp:languageHandler:action] Error while updating temporary user's language\n\nTemporay user data: ${jsonStringifyBigInt(ctx.scene.session.signUp.temporaryUser)}`,
                    ),
            )
        ctx.scene.session.signUp.language = language
        await ctx.deleteMessage()
        if (!ctx.scene.session.signUp.temporaryUser.acceptedPolicy) {
            await ctx.replyWithHTML(i18n.t(language, 'signUp.welcome'), inlines.g(language, 'signUp.acceptPolicy'))
            return ctx.wizard.next()
        }
        await ctx.reply(i18n.t(language, 'signUp.enterLogin'), keyboards.g(language, 'signUp.stopRegistration'))
        return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
    },
)
languageHandler.use(deleteOtherUpdates)

const acceptPolicyHandler = new Composer<Context>()
acceptPolicyHandler.action('acceptPolicy', async (ctx) => {
    const language = ctx.scene.session.signUp.language
    await prisma.temporaryUser
        .update({ where: { id: ctx.scene.session.signUp.temporaryUser.id }, data: { acceptedPolicy: true } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:acceptPolicyHandler:action] Error while updating temporary user's acceptPolicy\n\nTemporary user data: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp.temporaryUser,
                    )}`,
                ),
        )
    await ctx.deleteMessage()
    await ctx.replyWithHTML(`${i18n.t(language, 'signUp.policyAccepted')}\n\n${i18n.t(language, 'signUp.enterLogin')}`, keyboards.g(language, 'signUp.stopRegistration'))
    return ctx.wizard.next()
})
acceptPolicyHandler.use(deleteOtherUpdates)

const loginHandler = new Composer<Context>()
loginHandler.use(stopRegistration)
loginHandler.on(message('text'), async (ctx) => {
    const language = ctx.scene.session.signUp.language
    const login = ctx.message.text
    if (login == '000000000000') {
        ctx.scene.session.signUp.login = login
        await ctx.reply(i18n.t(language, 'signUp.enterPassword'), keyboards.g(language, 'signUp.stopRegistration'))
        return ctx.wizard.next()
    }
    await prisma.temporaryUser
        .update({ where: { id: ctx.scene.session.signUp.temporaryUser.id }, data: { latestSignUpAttempt: new Date() } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:loginHandler:onMessageText] Error while updating temporary user's latestAttempt\n\nTemporary user data: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp.temporaryUser,
                    )}`,
                ),
        )
    if (isNaN(Number(login))) {
        return await ctx.reply(i18n.t(language, 'signUp.loginIsNumber'), keyboards.g(language, 'signUp.stopRegistration'))
    } else if (login.length != 12) {
        return await ctx.reply(i18n.t(language, 'signUp.loginIs12DigitsLong'), keyboards.g(language, 'signUp.stopRegistration'))
    }
    const existingUser = await prisma.user
        .findUnique({ where: { login: login.toString() } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:loginHandler:onMessageText] Error while selecting existing user\n\nTemporary user data: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp.temporaryUser,
                    )}\nLogin: ${login}`,
                ),
        )
    if (existingUser) {
        return await ctx.reply(i18n.t(language, 'signUp.loginIsAlreadyRegistered'), keyboards.g(language, 'signUp.stopRegistration'))
    }
    const config = await getConfig()
    const actualAge = parseAgeFromId(login)
    if (actualAge < config.minAllowedAge) {
        await prisma.temporaryUser
            .update({ where: { id: ctx.scene.session.signUp.temporaryUser.id }, data: { acceptedPolicy: false } })
            .catch(
                async () =>
                    await error(
                        ctx,
                        `[scenes:signUp:loginHandler:onMessageText] Error while updating temporary user's acceptPolicy\n\nTemporary user data: ${jsonStringifyBigInt(
                            ctx.scene.session.signUp.temporaryUser,
                        )}`,
                    ),
            )
        await ctx.reply(i18n.t(language, 'signUp.actualAgeIsUnderAllowed', actualAge, config.minAllowedAge), removeKeyboard)
        return await ctx.scene.leave()
    }
    ctx.scene.session.signUp.login = login
    await ctx.reply(i18n.t(language, 'signUp.enterPassword'), keyboards.g(language, 'signUp.stopRegistration'))
    return ctx.wizard.next()
})
loginHandler.use(deleteOtherUpdates)

const passwordHandler = new Composer<Context>()
passwordHandler.use(stopRegistration)
passwordHandler.on(message('text'), async (ctx) => {
    const language = ctx.scene.session.signUp.language
    const password = ctx.message.text
    if (ctx.scene.session.signUp.login == '000000000000') {
        ctx.scene.session.signUp.school = 'tk'
        await ctx.reply(i18n.t(language, 'signUp.enterAge'), keyboards.g(language, 'signUp.stopRegistration'))
        return ctx.wizard.next()
    }
    const school = await microsLogin(ctx.scene.session.signUp.login, password)
    const config = await getConfig()
    const newTemporaryUser = await prisma.temporaryUser
        .update({ where: { id: ctx.scene.session.signUp.temporaryUser.id }, data: { signUpAttempts: { increment: 1 } } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:passwordHandler:onMessageText] Error while incrementing temporary user's signUpAttempts\n\nUser data: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp.temporaryUser,
                    )}`,
                ),
        )
    if (!newTemporaryUser) {
        return await ctx.reply(i18n.t(language, 'signUp.failedSignUp'), keyboards.g(language, 'signUp.stopRegistration'))
    }
    if (!school) {
        return await ctx.reply(
            i18n.t(language, 'signUp.wrongPassword', newTemporaryUser, config),
            config.maxSignUpAttempts - newTemporaryUser.signUpAttempts == 0 ? removeKeyboard : keyboards.g(language, 'signUp.stopRegistration'),
        )
    }
    ctx.scene.session.signUp.school = school
    await ctx.reply(i18n.t(language, 'signUp.enterAge'), keyboards.g(language, 'signUp.stopRegistration'))
    return ctx.wizard.next()
})
passwordHandler.use(deleteOtherUpdates)

const ageHandler = new Composer<Context>()
ageHandler.use(stopRegistration)
ageHandler.on(message('text'), async (ctx) => {
    const language = ctx.scene.session.signUp.language
    const age = Number(ctx.message.text)
    const config = await getConfig()
    if (isNaN(age)) {
        return await ctx.reply(i18n.t(language, 'signUp.ageIsNumber'), keyboards.g(language, 'signUp.stopRegistration'))
    } else if (age < config.minAllowedAge) {
        return await ctx.reply(i18n.t(language, 'signUp.ageIsUnderAllowed', config.minAllowedAge), keyboards.g(language, 'signUp.stopRegistration'))
    }
    ctx.scene.session.signUp.age = age
    await ctx.reply(i18n.t(language, 'signUp.selectGender'), inlines.g(language, 'signUp.selectGender'))
    return ctx.wizard.next()
})
ageHandler.use(deleteOtherUpdates)

const genderHandler = new Composer<Context>()
genderHandler.use(stopRegistration)
genderHandler.action(['gender_male', 'gender_female'], async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const language = ctx.scene.session.signUp.language
    const gender = ctx.callbackQuery.data.split('_')[1] as Gender
    ctx.scene.session.signUp.gender = gender
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(language, 'signUp.selectSearchingGender'), inlines.g(language, 'signUp.selectSearchingGender'))
    return ctx.wizard.next()
})
genderHandler.use(deleteOtherUpdates)

const searchingGenderHandler = new Composer<Context>()
searchingGenderHandler.use(stopRegistration)
searchingGenderHandler.action(['searchingGender_male', 'searchingGender_female', 'searchingGender_all'], async (ctx) => {
    if (!ctx.has(callbackQuery('data'))) return
    const language = ctx.scene.session.signUp.language
    const searchingGender = ctx.callbackQuery.data.split('_')[1] as SearchingGender
    ctx.scene.session.signUp.searchingGender = searchingGender
    await ctx.deleteMessage()
    await ctx.reply(i18n.t(language, 'signUp.enterName'), keyboards.g(language, 'signUp.stopRegistration'))
    return ctx.wizard.next()
})
searchingGenderHandler.use(deleteOtherUpdates)

const nameHandler = new Composer<Context>()
nameHandler.use(stopRegistration)
nameHandler.on(message('text'), async (ctx) => {
    const language = ctx.scene.session.signUp.language
    const name = ctx.message.text
    if (name.length > 20) {
        return await ctx.reply(i18n.t(language, 'signUp.nameIsTooLong'), keyboards.g(language, 'signUp.stopRegistration'))
    }
    ctx.scene.session.signUp.name = name
    await ctx.reply(i18n.t(language, 'signUp.enterBio'))
    return ctx.wizard.next()
})
nameHandler.use(deleteOtherUpdates)

const bioHandler = new Composer<Context>()
bioHandler.use(stopRegistration)
bioHandler.on(message('text'), async (ctx) => {
    const language = ctx.scene.session.signUp.language
    const bio = ctx.message.text
    if (bio.length > 100) {
        return await ctx.reply(i18n.t(language, 'signUp.bioIsTooLong'), keyboards.g(language, 'signUp.stopRegistration'))
    }
    ctx.scene.session.signUp.bio = bio
    await ctx.reply(i18n.t(language, 'signUp.sendPhoto'), keyboards.g(language, 'signUp.stopRegistration'))
    return ctx.wizard.next()
})
bioHandler.use(deleteOtherUpdates)

const photoHandler = new Composer<Context>()
photoHandler.use(stopRegistration)
photoHandler.on(message('photo'), async (ctx) => {
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id
    ctx.scene.session.signUp.photoId = photoId
    const { language, login, school } = ctx.scene.session.signUp
    const { age, bio, gender, name, searchingGender } = ctx.scene.session.signUp
    const user = await prisma.user
        .create({ data: { id: ctx.from.id, language, login, school, profile: { create: { age, bio, gender, name, photoId, searchingGender } } } })
        .catch(async () => await error(ctx, `[scenes:signUp:photoHandler:onMessagePhoto] Error while creating user\n\nSign up sessin: ${jsonStringifyBigInt(ctx.scene.session.signUp)}`))
    if (!user) {
        await ctx.reply(i18n.t(language, 'signUp.failedCreatingUser'), removeKeyboard)
        return await ctx.scene.leave()
    }
    const profile = await prisma.profile
        .findUnique({ where: { id: user.profileId } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:photoHandler:onMessagePhoto] Error while selecting profile after creating user\n\nSession: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp,
                    )}\nUser data: ${jsonStringifyBigInt(user)}`,
                ),
        )
    if (!profile) {
        await prisma.user
            .delete({ where: { id: user.id } })
            .catch(async () => await error(ctx, `[scenes:signUp:photoHandler:onMessagePhoto] Error while deleting user that has no profile\n\nUser data: ${jsonStringifyBigInt(user)}`))
        await ctx.reply(i18n.t(language, 'signUp.failedSelectingProfile'), removeKeyboard)
        return await ctx.scene.leave()
    }
    await info(
        ctx,
        `New user!\n\nUser data:\nID: ${user.id}\nLogin: ${user.login}\nSchool: ${user.school}\nProfileID: ${user.profileId}\n\nProfile data:\nAge: ${profile.age}\nName: ${profile.name}\nGender: ${profile.gender}\nSearching gender: ${profile.searchingGender}\nBio: ${profile.bio}\nPhotoID: ${profile.photoId}`,
    )
    ctx.session.authorized = true
    ctx.session.user = user
    ctx.session.profile = profile
    await prisma.temporaryUser
        .delete({ where: { id: ctx.scene.session.signUp.temporaryUser.id } })
        .catch(
            async () =>
                await error(
                    ctx,
                    `[scenes:signUp:photoHandler:onMessagePhoto] Error while deleting the temporary user after successful registration\n\nTemporary user data: ${jsonStringifyBigInt(
                        ctx.scene.session.signUp.temporaryUser,
                    )}`,
                ),
        )
    await ctx.reply(i18n.t(language, 'signUp.successfulSignUp'), keyboards.g(language, 'main', user))
    return await ctx.scene.leave()
})
photoHandler.use(deleteOtherUpdates)

export default new Scenes.WizardScene<Context>(
    'signUp',
    enterScene,
    languageHandler,
    acceptPolicyHandler,
    loginHandler,
    passwordHandler,
    ageHandler,
    genderHandler,
    searchingGenderHandler,
    nameHandler,
    bioHandler,
    photoHandler,
)
