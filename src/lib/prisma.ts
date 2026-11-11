import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Every SQL query is logged only in development. In production that would fill the Docker logs
// (and the server's disk, as Docker keeps logs without a size limit by default).
const log: ("query" | "error")[] = process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"]

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter, log })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma