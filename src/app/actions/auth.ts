"use server"

import { signIn } from "@/auth"

export async function loginWithMagicLink(formData: FormData) {
    await signIn("nodemailer", formData)
}
