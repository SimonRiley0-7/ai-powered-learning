import NextAuth, { type DefaultSession } from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { createTransport } from "nodemailer"

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
            generateVerificationToken: () => {
                // Generate a 6-digit OTP instead of a hash
                return Math.floor(100000 + Math.random() * 900000).toString()
            },
            sendVerificationRequest: async ({ identifier, url, provider, token }) => {
                const { host } = new URL(url)
                const transport = createTransport(provider.server)
                const result = await transport.sendMail({
                    to: identifier,
                    from: provider.from,
                    subject: `Your Login Code for ${host}: ${token}`,
                    text: `Your login code for ${host}\n\n${token}\n\nUse this code to login to your dashboard.`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AI Assessment Portal</h1>
              </div>
              <div style="padding: 32px; background-color: #ffffff;">
                <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">Hello,</p>
                <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.5;">Please use the following code to login securely to your account on <strong>${host}</strong>.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 4px; display: block; margin-bottom: 8px;">${token}</span>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">This code will expire in 15 minutes.</p>
                </div>
                
                <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">If you didn't request this email, you can safely ignore it.</p>
              </div>
            </div>
          `,
                })
                const failed = result.rejected.concat(result.pending).filter(Boolean)
                if (failed.length) {
                    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`)
                }
            }
        }),
    ],
})
