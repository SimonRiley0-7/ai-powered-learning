import NextAuth, { type DefaultSession } from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Temporary type to bypass Prisma enum export issues
type UserRole = "ADMIN" | "INSTRUCTOR" | "CANDIDATE"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
    }
}


import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma) as any, // Cast to any to bypass Beta type conflicts
    providers: [
        Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
    ],
})
