import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
    cookieName: 'next-auth.session-token',
  })
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'
  const isPublic =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
