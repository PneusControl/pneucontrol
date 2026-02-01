'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[4px] animate-pulse">
        Carregando Pneu Control...
      </p>
    </div>
  )
}