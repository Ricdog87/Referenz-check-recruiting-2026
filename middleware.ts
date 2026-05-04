export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/candidates/:path*',
    '/checks/:path*',
    '/clients/:path*',
    '/integrations/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/audit/:path*',
    '/addons/:path*',
    '/report/:path*',
  ],
}
