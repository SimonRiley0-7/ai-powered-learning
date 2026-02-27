import { edgeAuth } from "@/auth.config"

export default edgeAuth(() => {
    // If we return anything from here, we bypass the default authorization logic in authConfig.
    // The 'authorized' callback in authConfig already handles routing based on authentication.
    // We just use this middleware to trigger the auth config logic on all protected routes.
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
