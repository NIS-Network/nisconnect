import { Profile, User } from '@prisma/client'
import { Scenes, Context as TelegrafContext } from 'telegraf'
import { Update } from 'telegraf/types'

export interface WizardSession extends Scenes.WizardSessionData {
    admin: {
        scene: string
        update: {
            user: User | null
        }
    }
}

export interface Session extends Scenes.WizardSession<WizardSession> {
    user: User | null
    profile: Profile | null
    authorized: boolean
    searchResult: Profile[]
    likedByProfiles: Profile[]
}

export interface Context<U extends Update = Update> extends TelegrafContext<U> {
    session: Session
    scene: Scenes.SceneContextScene<Context, WizardSession>
    wizard: Scenes.WizardContextWizard<Context>
}
