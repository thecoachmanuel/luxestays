import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"

export const authConfig = {
  pages: {
    signIn: '/signin',
  },
  providers: [], // Configured in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isAdminLogin = nextUrl.pathname === '/admin/login'
      const role = (auth?.user as any)?.role

      if (isOnAdmin && !isAdminLogin) {
        if (!isLoggedIn) {
           return Response.redirect(new URL('/admin/login', nextUrl))
        }
        if (role !== 'admin') {
            // Redirect to home if not admin
            return Response.redirect(new URL('/', nextUrl))
        }
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        // Ensure image is passed if available
        if ((user as any).image) {
            token.picture = (user as any).image
        }
      }
      
      if (trigger === "update" && session) {
        if (session.image) token.picture = session.image
        if (session.name) token.name = session.name
      }
      
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session
    }
  }
} satisfies NextAuthConfig
