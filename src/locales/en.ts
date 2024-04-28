import { Config, Gender, Profile, SearchingGender, TemporaryUser, User } from '@prisma/client'
import { POLICY_ARTICLE, SUPPORT_CHAT, TECH_SUPPORT } from '../env'
import { pluralizeEnglish } from '../utils/i18n/plurals/english'
import kz from './kz'
import ru from './ru'
import { parseMs } from '../utils/parseMs'
import { MessageType } from '../handlers/conversation'

const en = {
    locale: {
        flag: '🇬🇧',
        code: 'en',
        name: 'English',
    },
    buttons: {
        conversation: {
            join: 'Join a conversation',
            leave: 'Leave the conversation',
        },
        viewProfiles: 'Search a partner',
        myProfile: 'My profile',
        settings: 'Settings',
        back: `Go back`,
    },
    gender: {
        male: 'Male',
        female: 'Female',
    },
    searchingGender: {
        male: 'Men',
        female: 'Women',
        all: `No matter`,
    },
    pronouns: {
        all: 'they',
        male: 'he',
        female: 'she',
    },
    start: (name: string) => `👋 Hello, ${name}!\n\nI'm a bot exclusively for NIS students. You can find friends and project teammates, interact with other students just by using me.`,
    selectLanguage: () => `${en.locale!.flag} Select language\n${kz.locale!.flag} Аударылу үстінде\n${ru.locale!.flag} В процессе перевода`,
    dontSpam: `Please, don't spam`,
    youAreBanned: `You're banned`,
    youWereBanned: `You were banned by admins. Try to complain in @${SUPPORT_CHAT}, if you think this is an error`,
    youWereUnbanned: 'You were unbanned and can use me!',
    youWereDemoted: 'You were demoted to user by the superadmin :(',
    youWerePromoted: 'You were promoted to admin by the superadmin!',
    coolDown: ({ days, hours, minutes, seconds }: { days: number; hours: number; minutes: number; seconds: number }) => {
        let coolDown = ''
        if (days > 0) {
            coolDown += pluralizeEnglish(days, '1 day', `${days} days`)
        }
        if (hours > 0) {
            coolDown += (coolDown.length == 0 ? '' : ' ') + pluralizeEnglish(hours, '1 hour', `${hours} hours`)
        }
        if (minutes > 0) {
            coolDown += (coolDown.length == 0 ? '' : ' ') + pluralizeEnglish(minutes, '1 minute', `${minutes} minutes`)
        }
        if (seconds > 0) {
            coolDown += (coolDown.length == 0 ? '' : ' ') + pluralizeEnglish(seconds, '1 second', `${seconds} seconds`)
        }
        return coolDown
    },
    signUp: {
        welcome: `Hello, I'm a bot for NIS students.\n\nI can offer:\n1) Meeting new NIS friends\n2) Networking\n3) Freelancing opportunities\n4) Recruiting project team members\n\nBefore you start, you need to read <a href="${POLICY_ARTICLE}">my policy</a> and accept it`,
        failedStart: `Failed to start a registration, try again by entering /start command. Describe your case in @${SUPPORT_CHAT} if the new attempts fail too`,
        registrationStopped: `You've stopped the registration.\nYou can start it again by entering /start command!`,
        tooMuchAttempts: (temporaryUser: TemporaryUser, config: Config) => {
            const cooldown = en.coolDown(parseMs(config.signUpCoolDown + temporaryUser.latestSignUpAttempt.getTime() - Date.now()))
            return `You have no registration attempts left. Try again after ${cooldown}`
        },
        enterLogin: 'Enter your eNIS/SMS/NIS Mektep login:',
        loginIsNumber: 'Your login must be a number, try again:',
        loginIs12DigitsLong: 'Your login must contain 12 digits, try again:',
        loginIsAlreadyRegistered: `Someone have already signed up using this login. Contact @${TECH_SUPPORT} if it was you and want to delete an existing account\n\nor enter an another login:`,
        enterPassword: 'Enter your eNIS/SMS/NIS Mektep password:',
        wrongPassword: (temporaryUser: TemporaryUser, config: Config) => {
            const attemptsLeft = config.maxSignUpAttempts - temporaryUser.signUpAttempts
            const coolDown = en.coolDown(parseMs(config.signUpCoolDown))
            return `Wrong password!\n${
                attemptsLeft == 0
                    ? `You've failed too many registration attempts. Wait ${coolDown} and try again`
                    : `You can stop the registration or try again ${pluralizeEnglish(attemptsLeft, 'once', `${attemptsLeft} more times`)}:`
            }`
        },
        actualAgeIsUnderAllowed: (age: number, allowedAge: number) =>
            `You are ${age} years old according to your NIS Mektep login. You must be at least ${allowedAge} years old to use me according to my policy. You can try again be entering /start command`,
        enterAge: 'Enter your profile age:',
        ageIsNumber: 'Your age must be a number, try again:',
        ageIsUnderAllowed: (allowedAge: number) => `According to my policy, you need to be at least ${allowedAge} years old to use me. Try again:`,
        selectGender: 'Select your gender:',
        selectSearchingGender: 'Select who do you want to find using me:',
        enterName: 'Enter your profile name:',
        nameIsTooLong: `Your name's length should be up to 20 characters. Try again:`,
        enterBio: `Tell me more about yourself. What do you like or dislike? Who is the best partner for you? I'll find the best matches.`,
        bioIsTooLong: `Your bio's length should be up to 100 characters. Try again:`,
        sendPhoto: 'Send your profile photo:',
        policyAccepted: `You've accepted <a href="${POLICY_ARTICLE}">my policy</a>, let's start a registration.\nYou can stop it any time!`,
        failedCreatingUser: `Failed to create an account, try again by entering /start command. Describe your case in @${SUPPORT_CHAT} if the new attempts fail too`,
        failedSelectingProfile: 'Your account is created, but I am unable to get your profile data. You need to recreate your account. Try again by entering /start command',
        failedSignUp: 'Failed to handle your password, try again:',
        successfulSignUp: 'Your account is created. You have an access to all of my features now!',
        buttons: {
            acceptPolicy: 'I accept it',
            stopRegistration: 'Stop the registration',
        },
    },
    myProfile: {
        caption: (profile: Profile) =>
            `${profile.status == 'disabled' ? 'Your profile is disabled, nobody can see it!' : ''}\n\nThis is how your profile looks like:\n\nName: ${profile.name}\nBio: ${profile.bio}\nAge: ${
                profile.age
            }\nGender: ${en.gender[profile.gender]}\nSearching gender: ${en.searchingGender[profile.searchingGender]}`,
        whatToChange: 'What do you want to change:',
        enterNewProp: {
            name: (current: string) => `Your current profile name: ${current}\n\nEnter the new one:`,
            bio: (current: string) => `Your current bio: ${current}\n\nEnter the new one:`,
            age: (current: number) => `Your current profile age: ${current}\n\nEnter the new one:`,
            gender: (current: Gender) => `Your current profile gender: ${en.gender[current]}\n\nSelect the new one:`,
            photo: 'Send your new profile photo:',
            searchingGender: (current: SearchingGender) => `You are currently searching for: ${en.searchingGender[current]}\n\nSelect the new one:`,
            changesDiscarded: 'Changes were discarded',
            failedChange: 'Failed to update your profile data, try again',
            successfulChange: 'Your profile data was updated successfully',
            changeGenderReminder: 'Changing your profile gender or the gender of who you are searching for affects who will be recommended to you and who you will be remommended to!',
        },
        failedSwitchingProfile: `Failed to switch your profile's status, try again`,
        profileDisabled: 'Your profile was disabled, I will not recommend you to others',
        profileEnabled: 'Your profile was enabled, I will start recommending you to others',
        buttons: {
            changeProfileData: 'Change my profile data',
            disableProfile: 'Disable my profile',
            enableProfile: 'Enable my profile',
            name: 'My profile name',
            bio: 'My bio',
            age: 'My profile age',
            gender: 'My profile gender',
            searchingGender: 'My searching gender',
            photo: 'My profile photo',
            leaveCurrentProp: 'Leave current',
            viewLikedByProfiles: 'View profiles that liked me',
        },
    },
    settings: {
        message: (user: User, config: Config) => {
            const cd = config.deleteAccountCoolDown + user.latestDeleteAccountAttempt.getTime() - Date.now()
            const attemptsLeft = config.maxDeleteAccountAttempts - user.deleteAccountAttempts
            const coolDown = en.coolDown(parseMs(cd))
            const registrationDate = `${user.registrationDate.getDay().toString().padStart(2, '0')}.${(user.registrationDate.getMonth() + 1).toString().padStart(2, '0')}.${user.registrationDate.getFullYear()}`
            return `ID: ${user.id}\nLogin: ${user.login}\nSchool: ${en.schools[user.school]}\nRegistration date: ${registrationDate}${user.likedByProfiles.length != 0 ? `\nAmount of students that liked you: ${user.likedByProfiles.length}` : ''}\nLanguage: ${en.locale.flag} ${en.locale.name}${attemptsLeft != 0 ? `\nAttempts of deleting account left: ${attemptsLeft}` : ''}${cd < config.deleteAccountCoolDown && cd > 0 ? `\nYou can try to delete your account after: ${coolDown}` : ''}`
        },
        profileNotAffectedByLanguage: `Changing your language doesn't translate your profile data and others will see your profile in their language!`,
        languageNotChanged: `Your language wasn't changed`,
        failedChangeLanguage: 'Failed to change your language, try again',
        successfullChangeLanguage: 'Your language was changed successfully',
        deleteAccountDisclaimer: 'You are going to permanently delete your user account and profile!\nThis action is irreversible!',
        deleteAccountConfirmation: 'Are you sure to complete it?',
        confirmYourOwnership: (login: string) => `To make sure that this account(${login}) belongs to you, enter your eNIS/sms/NIS Mektep password:`,
        wrongPassword: (user: User, config: Config) => {
            const attemptsLeft = config.maxDeleteAccountAttempts - user.deleteAccountAttempts
            const coolDown = en.coolDown(parseMs(config.deleteAccountCoolDown))
            return `Wrong password!\n${
                attemptsLeft == 0
                    ? `You've failed too many attempts of deleting your account. Wait ${coolDown} and try again `
                    : `You can stop deleting your account or try again ${pluralizeEnglish(attemptsLeft, 'once', `${attemptsLeft} more times`)}:`
            }`
        },
        accountNotDeleted: `You account wasn't deleted`,
        tooMuchDeleteAccountAttempts: (user: User, config: Config) => {
            const coolDown = en.coolDown(parseMs(config.deleteAccountCoolDown + user.latestDeleteAccountAttempt.getTime() - Date.now()))
            return `You have no attempts to delete your account left. Try again after ${coolDown}`
        },
        failedDeleteAccount: 'Failed to delete your account, try again',
        successfullDeleteAccount: 'Your account was deleted, see you again!\n\nYou can sign up by entering /start command',
        buttons: {
            changeLanguage: 'Change the language',
            deleteAccount: 'Delete my account',
            dontChangeLanguage: `Don't change the language`,
            dontDeleteAccount: `Don't delete my account`,
            yesDeleteAccount: 'Yes, delete my account',
        },
    },
    conversation: {
        alreadyJoined: 'You are already a member of started conversation. You can leave it by entering keyboard command',
        notJoined: 'You are not a member of any conversation. You can join one by entering keyboard command',
        gender: {
            male: 'man',
            female: 'woman',
            all: 'user',
        },
        messageTypes: {
            text: 'text message',
            photo: 'photo',
            video: 'video',
            sticker: 'sticker',
            voice: 'voice message',
            video_note: 'video note',
        },
        failedStarted: 'Found 0 already started conversations that you are allowed to join and failed to start a new one, try again',
        successfullStarted: (profile: Profile) =>
            `Found 0 already started conversations that you are allowed to join, you've started a new one. A ${en.conversation.gender[profile.searchingGender]} searching for a ${en.conversation.gender[profile.gender]} or any user will join your conversation, when ${en.pronouns[profile.searchingGender]} also wants to join the conversation\n\nYou can leave the conversation by entering keyboard command`,
        failedJoin: 'Failed to join a conversation, try again',
        successfullJoin: (host: Profile) => `You've joined a conversation with a ${en.conversation.gender[host.gender]}`,
        memberJoined: (member: Profile) => `A ${en.conversation.gender[member.gender]} joined your conversation`,
        joinDisclaimer: `Now any text message, photo, video, sticker, voice and video notes you send me except my commands and ones that I require you to send would be delivered to your conversation partner\n\nPlease, be polite and don't violate on <a href="${POLICY_ARTICLE}">my policy</a>\nUse keyboard command to leave the conversation\n\nHave fun conversation!`,
        failedLeave: 'Failed to leave a conversation, try again',
        successfullLeave: `You've leaved the conversation. You can join a one by entering keyboard command`,
        memberLeaved: 'Your conversation partner leaved it',
        stopedConversation: 'The conversation is stopped. You can join a new one by entering keyboard command',
        conversationAnomaly: `There's something wrong with your conversation, I am forced to stop it. Sorry for bugs in my code, I'll handle it very soon!`,
        memberForwarded: (type: MessageType) => `Your conversation partner sent you a ${en.conversation.messageTypes[type]}:`,
        forwarded: (type: MessageType) => `Your ${en.conversation.messageTypes[type]} have been sent to your conversation partner`,
    },
    viewProfiles: {
        emptyResult: 'Found 0 profiles that match your searching gender, try again later',
        noResultsLeft: '0 unviewed profiles left\n\nDo you want to start reviewing profiles?',
        failedEnter: 'Failed to start searching partners for you, try again',
        stopedViewing: 'Stoped viewing profiles',
        caption: (profile: Profile) => `Name: ${profile.name}\nAge: ${profile.age}\nBio: ${profile.bio}`,
        failedLike: 'Failed to like the profile',
        successfullLike: 'Your like was sent, wait for a response',
        failedSkip: 'Failed to skip the profile',
        whoLiked: {
            singular: {
                all: 'NIS student',
                male: 'man',
                female: 'woman',
            },
            plural: {
                all: 'NIS students',
                male: 'men',
                female: 'women',
            },
            pronouns: {
                all: 'their',
                male: 'his',
                female: 'her',
            },
        },
        likedBy: (count: number, profile: Profile) =>
            `${count} ${pluralizeEnglish(count, en.viewProfiles.whoLiked.singular[profile.searchingGender], en.viewProfiles.whoLiked.plural[profile.searchingGender])} liked your profile\n\nUse a "${en.myProfile.buttons.viewLikedByProfiles}" button in "${en.buttons.myProfile}" section to view ${pluralizeEnglish(count, `${en.viewProfiles.whoLiked.pronouns[profile.searchingGender]} profile`, 'their profiles')}`,
        buttons: {
            startReviewing: 'Yes, start reviewing profiles',
            stopViewing: 'Stop viewing profiles',
            like: '❤️',
            quickMessage: '💌',
            skip: '👎',
            leave: '💤',
        },
    },
    quickMessage: {
        message: (maxDuration: number) => `Send a message for this NIS Student\n\nor recond a short viedeo (up to ${maxDuration} ${pluralizeEnglish(maxDuration, 'second', 'seconds')})`,
        messageTooShort: (minLength: number) => `Your message must be at least ${minLength} characters long, try again:`,
        messageTooLong: (maxLength: number) => `Your message's length must be less than ${maxLength} characters, try again:`,
        videoTooLong: (maxDuration: number) => `Your video's duration must be up to ${maxDuration} ${pluralizeEnglish(maxDuration, 'second', 'seconds')}`,
        failedSend: (type: 'text' | 'video') => `Failed to send your ${type == 'text' ? 'message' : 'video'} to this NIS Student`,
        successfullSendAndLike: (type: 'text' | 'video') => `Your ${type == 'text' ? 'message' : 'video'} and like were sent, wait for a response`,
        successfullLike: (type: 'text' | 'video') => `Your ${type == 'text' ? 'message' : 'video'} was sent, wait for a response`,
        recievedFrom: (type: 'text' | 'video', name: string) => `${name} sent you a ${type == 'text' ? 'message' : 'video'}:`,
        buttons: {
            back: 'Go back',
        },
    },
    report: {
        intruderNotFound: 'The user that you are trying to report was not found',
        whatReason: 'What is the reason of the report?',
        failedCreate: 'Failed to report this user, try again',
        successfullCreate: 'This user was reported',
        notCreated: 'This user was not reported',
        buttons: {
            report: 'Report',
            reasons: {
                inappropriate: 'Inappropriate content',
                afk: 'Not answering',
                sale: 'Sale of goods and services',
                drugs: 'Drug propaganda',
                other: 'Other',
            },
            dontReport: `Don't report`,
        },
    },
    viewLikedByProfiles: {
        noLikedBy: 'Nobody liked your profile yet',
        emptyLikedBy: `You've finished viewing profiles that liked you`,
        failedSkip: 'Failed to skip the profile',
        failedReport: 'Failed to report the profile',
        stopedViewing: 'Stoped viewing profiles that liked you',
        profilesMatched: {
            username: (name: string, username: string) => `Matched! Start chatting -> <a href="tg://resolve?domain=${username}">${name}</a>`,
            id: (name: string, id: number) => `Matched! Start chatting -> <a href="tg://user?id=${id}">${name}</a>`,
        },
        buttons: {
            like: '❤️',
            skip: '👎',
            report: '⚠️',
            leave: '💤',
        },
    },
    schools: {
        akt: `Aktau CBD`,
        akb: 'Aktobe PMD',
        fmalm: 'Almaty PMD',
        hbalm: 'Almaty CBD',
        ast: 'Astana PhMD',
        atr: 'Atyrau CBD',
        krg: 'Karagandy CBD',
        kt: 'Kokshetau PMD',
        kst: 'Kostanai PMD',
        kzl: 'Kyzylorda CBD',
        pvl: 'Pavlodar CBD',
        ptr: 'Petropavlsk CBD',
        sm: 'Semei PMD',
        tk: 'Taldykorgan PMD',
        trz: 'Taraz PhMD',
        ura: 'Oral PMD',
        ukk: 'Oskemen CBD',
        fmsh: 'Shymkent PMD',
        hbsh: 'Shymkent CBD',
        trk: 'Turkistan CBD',
    },
}

export default en
