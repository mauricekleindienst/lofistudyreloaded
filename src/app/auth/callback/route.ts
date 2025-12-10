import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorParams = new URLSearchParams({
      error: error,
      error_description: errorDescription || 'OAuth provider error'
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data?.session) {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Error exchanging code for session:', exchangeError)
        
        const errorParams = new URLSearchParams({
          error: 'exchange_failed',
          error_description: exchangeError?.message || 'Failed to exchange authorization code for session'
        })
        return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err)
      const errorParams = new URLSearchParams({
        error: 'unexpected_error',
        error_description: 'An unexpected error occurred during authentication'
      })
      return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
    }
  }
  
  // No code parameter provided
  const errorParams = new URLSearchParams({
    error: 'missing_code',
    error_description: 'Authorization code is missing from the callback URL.'
  })
  return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
}
