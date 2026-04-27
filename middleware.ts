export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/candidates',
    '/candidates/:path*',
    '/checks',
    '/checks/:path*',
    '/settings',
    '/settings/:path*',
  ],
}
