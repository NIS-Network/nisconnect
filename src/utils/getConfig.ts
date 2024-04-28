import { Config } from '@prisma/client'
import prisma from './prisma'

export default async function getConfig(): Promise<Config> {
    let config = await prisma.config.findUnique({ where: { id: 0 } })
    if (!config) {
        config = await prisma.config.create({ data: { id: 0 } })
    }
    if (config.defaultConfig != 0) {
        config = await prisma.config.findUnique({ where: { id: config.defaultConfig } })
    }
    if (!config) {
        throw new Error('Default config not provided')
    }
    return config
}
