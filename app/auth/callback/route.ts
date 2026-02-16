import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSubdomain } from '@/lib/subdomain'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // The subdomain can come from two sources (in priority order):
  // 1. The hostname of the request (e.g. max.blockwin.space)
  // 2. The ?subdomain= query param we attached during signInWithOAuth
  const { hostname } = new URL(request.url)
  const subdomainFromHost = getSubdomain(hostname)
  const subdomainFromParam = searchParams.get('subdomain')
  const subdomain = subdomainFromHost || subdomainFromParam || null

  console.log('[Auth Callback] hostname:', hostname, 'subdomainFromHost:', subdomainFromHost, 'subdomainFromParam:', subdomainFromParam, 'resolved:', subdomain)

  // Build the URL to redirect the user back to after auth completes.
  // If we know the subdomain, always redirect to the subdomain origin so the
  // user stays on their white-label site.
  const isPreview = hostname.endsWith('.netlify.app')
  let appUrl: string
  if (subdomain && !isPreview) {
    appUrl = `https://${subdomain}.blockwin.space`
  } else if (isPreview) {
    appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  } else {
    appUrl = origin
  }

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
        const effectiveSubdomain = subdomain ?? process.env.SUBDOMAIN
        if (effectiveSubdomain) {
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
                origin: effectiveSubdomain,
              })
            if (insertError) {
              if (insertError.code === '23505') {
                await supabaseAdmin
                  .from('users')
                  .update({ origin: effectiveSubdomain })
                  .eq('id', data.user.id)
                  .is('origin', null)
              } else {
                console.error('Error inserting user with origin:', insertError)
              }
            } else {
              console.log(`New user ${data.user.id} created with origin: ${effectiveSubdomain}`)
            }
          } else if (!existingUser.origin) {
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({ origin: effectiveSubdomain })
              .eq('id', data.user.id)
            if (updateError) {
              console.error('Error updating user origin:', updateError)
            } else {
              console.log(`User ${data.user.id} origin updated to: ${effectiveSubdomain}`)
            }
          }
        }
      } catch (e) {
        console.error('Error setting user origin:', e)
      }

      return NextResponse.redirect(`${appUrl}${next}`)
    } else {
      console.error('Auth Callback Error:', error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error`)
}
