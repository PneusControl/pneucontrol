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
      const { data, error } = await supabase
        .from('system_admins')
        .select('id')
        .eq('email', email)
        .single()

      setIsSystemAdmin(!!data && !error)
    } catch (err) {
      console.error('Erro ao verificar system_admin:', err)
      setIsSystemAdmin(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Erro ao buscar perfil do usuário:', err)
    }
  }

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await checkIsSystemAdmin(session.user.email!)
        await fetchProfile(session.user.id)
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
        await fetchProfile(session.user.id)
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
