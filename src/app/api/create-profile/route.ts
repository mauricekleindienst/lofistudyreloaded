import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create or update the profile using upsert
    const { error: upsertError } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        premium: false,
        settings: {}
      }], { onConflict: 'id' })

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to create or update profile', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Profile created successfully' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Unexpected error in create-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
