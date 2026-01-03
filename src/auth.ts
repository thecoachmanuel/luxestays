import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { getUserByEmail } from "./lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const email = credentials.email as string
        const password = credentials.password as string

        // Hardcoded admin check
        if (email === "admin" && password === "admin") {
          return {
            id: "admin-id",
            name: "Administrator",
            email: "admin",
            role: "admin"
          }
        }

        // Regular user check
        try {
            const user = await getUserByEmail(email)
            if (!user || !user.password) {
              return null
            }
    
            const isValid = await bcrypt.compare(password, user.password)
            if (!isValid) {
              return null
            }
    
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image
            }
        } catch (error) {
            console.error("Auth error:", error)
            return null
        }
      },
    }),
  ],
})
