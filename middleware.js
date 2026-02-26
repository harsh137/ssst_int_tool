import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Get auth session from the JWT cookie (set by /api/auth/login)
    const token = request.cookies.get('ssst_token')?.value;

    // Protect all dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect authenticated users away from login
    if (pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect root to dashboard or login
    if (pathname === '/') {
        if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/dashboard/:path*'],
};
