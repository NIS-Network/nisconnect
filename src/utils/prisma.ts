import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ errorFormat: 'minimal', log: ['warn', 'error'] })

export default prisma
