import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { isAppAccessEnabled } from '@/lib/flags'

const handler = NextAuth(authOptions)

// Zweite Sperre hinter der Middleware: bei geschlossenem App-Zugang wird
// keine Session ausgestellt, auch wenn ein Request die Middleware umgeht.
async function guard(req: Request, ctx: any) {
  if (!isAppAccessEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }
  return handler(req, ctx)
}

export { guard as GET, guard as POST }
