import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    const isAuthPage = pathname.startsWith('/login')
    const isDashboardPage = pathname.startsWith('/dashboard')
    const isSystemPage = pathname.startsWith('/system')
    const isSetupPage = pathname.startsWith('/setup-password')
    const isRootPage = pathname === '/'

    // Rotas que não precisam de autenticação
    if (isSetupPage) {
        return response
    }

    // System admin pages - precisa de autenticação especial (verificada na página)
    if (isSystemPage) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return response
    }

    // Se estiver logado e tentar acessar root ou login, vai para dashboard
    if (session && (isRootPage || isAuthPage)) {
        return NextResponse.redirect(new URL('/dashboard/', request.url))
    }

    // Se NÃO estiver logado e tentar acessar dashboard, vai para login
    if (!session && isDashboardPage) {
        return NextResponse.redirect(new URL('/login/', request.url))
    }

    // Se estiver em root e não logado, vai para login
    if (!session && isRootPage) {
        return NextResponse.redirect(new URL('/login/', request.url))
    }

    return response
}


export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
