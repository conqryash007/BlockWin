import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSubdomain } from '@/lib/subdomain'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Use the request origin so OAuth callbacks return to the correct subdomain.
  // For Netlify deploy-previews, fall back to the canonical URL.
  const { hostname } = new URL(request.url)
  const isPreview = hostname.endsWith('.netlify.app')
  const appUrl = isPreview ? (process.env.NEXT_PUBLIC_APP_URL || origin) : origin

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Set origin for new users based on the subdomain they signed up from
      try {
        const subdomain = getSubdomain(hostname) ?? process.env.SUBDOMAIN
        if (subdomain) {
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, origin')
            .eq('id', data.user.id)
            .maybeSingle()

          if (fetchError) {
            console.error('Error fetching user:', fetchError)
          } else if (!existingUser) {
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                origin: subdomain,
              })
            if (insertError) {
              if (insertError.code === '23505') {
                await supabaseAdmin
                  .from('users')
                  .update({ origin: subdomain })
                  .eq('id', data.user.id)
                  .is('origin', null)
              } else {
                console.error('Error inserting user with origin:', insertError)
              }
            } else {
              console.log(`New user ${data.user.id} created with origin: ${subdomain}`)
            }
          } else if (!existingUser.origin) {
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({ origin: subdomain })
              .eq('id', data.user.id)
            if (updateError) {
              console.error('Error updating user origin:', updateError)
            } else {
              console.log(`User ${data.user.id} origin updated to: ${subdomain}`)
            }
          }
        }
      } catch (e) {
        console.error('Error setting user origin:', e)
        // Continue to redirect so auth still succeeds
      }

      return NextResponse.redirect(`${appUrl}${next}`)
    } else {
      console.error('Auth Callback Error:', error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error`)
}
