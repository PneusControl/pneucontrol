'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: any
  session: any
  loading: boolean
  isSystemAdmin: boolean
  profile: any
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // Usar useMemo para evitar criar novo cliente a cada render
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // Ref para evitar chamadas duplicadas
  const hasInitialized = useRef(false)

  const checkIsSystemAdmin = async (email: string) => {
    try {
      const { data } = await supabase
        .from('system_admins')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      setIsSystemAdmin(!!data)
    } catch (err) {
      console.error('[Auth] Erro verificar system_admin:', err)
      setIsSystemAdmin(false)
    }
  }

  const fetchProfile = async (userId: string, sessionUser: any = null) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else if (sessionUser) {
        // Fallback usando JWT metadata
        setProfile({
          id: sessionUser.id,
          role: sessionUser.user_metadata?.role || 'operator',
          full_name: sessionUser.user_metadata?.full_name,
          email: sessionUser.email,
          permissions: sessionUser.user_metadata?.permissions || []
        })
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err)
      if (sessionUser) {
        setProfile({
          id: sessionUser.id,
          role: sessionUser.user_metadata?.role || 'operator',
          full_name: sessionUser.user_metadata?.full_name,
          email: sessionUser.email,
          permissions: sessionUser.user_metadata?.permissions || []
        })
      }
    }
  }

  useEffect(() => {
    // Evitar inicialização duplicada
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Erro getSession:', error)
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await checkIsSystemAdmin(session.user.email!)
        await fetchProfile(session.user.id, session.user)
      }

      setLoading(false)
    }

    // Listener para mudanças de auth (login/logout APÓS inicialização)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar evento INITIAL_SESSION para evitar duplicação
      if (event === 'INITIAL_SESSION') return

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await checkIsSystemAdmin(session.user.email!)
        await fetchProfile(session.user.id, session.user)
      } else {
        setIsSystemAdmin(false)
        setProfile(null)
      }
    })

    initAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsSystemAdmin(false)
    setProfile(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isSystemAdmin, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
