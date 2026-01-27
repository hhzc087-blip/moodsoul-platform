import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // 1. Root Redirect -> Dashboard
  if (url.pathname === '/') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 2. Admin Protection
  if (url.pathname.startsWith('/admin')) {
    // Check for "secret" query param or cookie
    // For MVP: ?secret=admin123
    const secret = url.searchParams.get('secret')
    const cookieSecret = request.cookies.get('admin_secret')?.value

    if (secret === 'admin123') {
        // Set cookie if param is correct
        const response = NextResponse.next()
        response.cookies.set('admin_secret', 'admin123', { httpOnly: true })
        return response
    }

    if (cookieSecret === 'admin123') {
        return NextResponse.next()
    }

    // Unauthorized
    return new NextResponse('Unauthorized Access: God Mode Locked.', { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*'],
}
