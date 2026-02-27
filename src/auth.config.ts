import NextAuth, { type NextAuthConfig } from "next-auth"

// Notice this is only an export of the NextAuth configuration,
// bypassing the Prisma Adapter and Nodemailer which rely on Node APIs.
export const authConfig = {
    providers: [], // Added in auth.ts
    pages: {
        signIn: "/login",
        verifyRequest: "/login/verify-request",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/instructor") || nextUrl.pathname.startsWith("/admin")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                if (token.role) {
                    session.user.role = token.role as "ADMIN" | "INSTRUCTOR" | "CANDIDATE"
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        }
    },
    session: { strategy: "jwt" }
} satisfies NextAuthConfig

export const { auth: edgeAuth } = NextAuth(authConfig)
