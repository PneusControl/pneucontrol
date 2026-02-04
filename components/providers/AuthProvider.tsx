'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  const supabase = createClient()
  const router = useRouter()

  const checkIsSystemAdmin = async (email: string) => {
    try {
      console.log('[AuthDebug] Verificando SysAdmin para:', email)
      const { data, error } = await supabase
        .from('system_admins')
        .select('id')
        .eq('email', email)
        .maybeSingle() // Alterado de single() para evitar erro 406 se não existir

      const isSys = !!data
      console.log('[AuthDebug] Resultado SysAdmin:', isSys, data, error)
      setIsSystemAdmin(isSys)
    } catch (err) {
      console.error('[AuthDebug] Erro ao verificar system_admin:', err)
      setIsSystemAdmin(false)
    }
  }

  const fetchProfile = async (userId: string, sessionUser: any = null) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Evita 406 se não houver perfil ainda

      if (data) {
        setProfile(data)
      } else {
        console.warn('Perfil público não encontrado ou erro de fetch. Usando metadata de fallback.')
        if (sessionUser) {
          // CRITICAL FIX: Se o banco falhar, usamos o JWT para garantir acesso Admin
          // Isso previne que o Admin vire "Operator" e veja tela branca
          setProfile({
            id: sessionUser.id,
            role: sessionUser.user_metadata?.role || 'operator',
            full_name: sessionUser.user_metadata?.full_name,
            email: sessionUser.email,
            permissions: []
          })
        }
      }
    } catch (err) {
      console.error('Erro ao buscar perfil do usuário:', err)
      // Mesmo no catch, tentamos o fallback se tivermos user
      if (sessionUser) {
        setProfile({
          id: sessionUser.id,
          role: sessionUser.user_metadata?.role || 'operator',
          full_name: sessionUser.user_metadata?.full_name,
          email: sessionUser.email,
          permissions: []
        })
      }
    }
  }

  useEffect(() => {
    const setData = async () => {
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
        // Importante: Passamos o objeto user para a função de perfil poder usar como backup
        await fetchProfile(session.user.id, session.user)
      } else {
        setIsSystemAdmin(false)
        setProfile(null)
      }

      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await checkIsSystemAdmin(session.user.email!)
        await fetchProfile(session.user.id, session.user)
      } else {
        setIsSystemAdmin(false)
        setProfile(null)
      }

      setLoading(false)
    })

    setData()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

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
