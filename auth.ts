import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, (user as any).password)
        if (!valid) return null
        return { id: (user as any).id, name: user.name, email: user.email, role: (user as any).role }
      },
    }),
  ],
})

// Auth bypass: todas las rutas API funcionan sin sesión real
export async function auth() {
  return {
    user: { id: 'admin', name: 'Admin', email: 'admin@icatronic.com', role: 'ADMIN' },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
