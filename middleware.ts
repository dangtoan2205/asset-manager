import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public paths that don't require authentication
const publicPaths = ['/', '/login'];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const isAuthenticated = !!token;

    // Get the pathname of the request
    const path = request.nextUrl.pathname;

    // If the path is public, allow access regardless of authentication
    if (publicPaths.includes(path)) {
        return NextResponse.next();
    }

    // If the user is on an authenticated path but not logged in, redirect to login
    if (!isAuthenticated) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access login page, redirect to dashboard
    if (isAuthenticated && path === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check role-based access for admin routes
    if (path.startsWith('/admin') && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
    matcher: [
        // Match all routes except for static files, api routes, and _next
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};