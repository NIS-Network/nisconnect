import { School as SchoolType } from '@prisma/client'
import axios from 'axios'
import { v4 } from 'uuid'

interface Application {
    gid: string
    organizationGid: string
    name: string
    serviceUrl: string | null
    url: string
    type: number
}

interface LoginResult {
    accessToken: string
    refreshToken: string
    applications: Application[]
}

interface School {
    gid: string
    name: {
        kk: string
        ru: string
        en: string
    }
}

interface AdditionalUserInfo {
    photoUrl: string
    klass: string
    school: School
    children: unknown
}

export default async function microsLogin(login: string, password: string): Promise<false | SchoolType> {
    const loginResponse = await axios.request<LoginResult>({
        method: 'POST',
        data: {
            action: 'v1/Users/Authenticate',
            operationId: v4(),
            username: login,
            password,
            deviceInfo: 'SM-G977N',
        },
        url: 'https://identity.micros.nis.edu.kz/v1/Users/Authenticate',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (loginResponse.status != 200) {
        return false
    }
    const { accessToken, applications } = loginResponse.data
    const additionalResponse = await axios.request<AdditionalUserInfo>({
        method: 'POST',
        data: {
            applicationType: 'ContingentAPI',
            action: 'Api/AdditionalUserInfo',
            operationId: v4(),
        },
        url: 'https://contingent.micros.nis.edu.kz/Api/AdditionalUserInfo',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    })
    const {
        school: { gid: UserSchoolGid },
    } = additionalResponse.data
    const schoolOrganization = applications.find((application) => application.organizationGid == UserSchoolGid && application.type == 52)
    const cityAbbr = schoolOrganization?.url.split('.')[1]
    if (!cityAbbr) {
        return false
    }
    return cityAbbr as SchoolType
}
