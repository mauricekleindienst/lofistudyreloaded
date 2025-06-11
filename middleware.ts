import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from './src/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // This `createClient` function creates a Supabase client configured to use cookies
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    await supabase.auth.getUser()

    return response
  } catch (e) {
    // If you are here, a Supabase client could probably not be created!
    // This is likely because you have not set up environment variables.
    // Check out https://github.com/vercel/next.js/tree/canary/examples/with-supabase
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
