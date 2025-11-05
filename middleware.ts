import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes and static assets
  if (isPublicRoute || pathname.startsWith("/_next") || pathname.startsWith("/images")) {
    return NextResponse.next()
  }

  // Check for auth session in localStorage (we'll do this client-side)
  // For now, just allow all routes - the client-side guard will handle it
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
