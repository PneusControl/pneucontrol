'use client'

import { useEffect } from 'react'
// Force redeploy for production sync v2
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  useEffect(() => {
    console.log('🏁 RootPage Initialized')

    const checkUser = async () => {
      try {
        console.log('🔍 Checking Supabase Session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Supabase Auth Error:', error)
          setErrorStatus(`Erro de autenticação: ${error.message}`)
          router.push('/login/')
          return
        }

        console.log('✅ Session retrieved:', session ? 'User logged in' : 'No session')

        if (session) {
          console.log('➡️ Redirecting to /dashboard/')
          router.replace('/dashboard/')
        } else {
          console.log('➡️ Redirecting to /login/')
          router.replace('/login/')
        }
      } catch (err: any) {
        console.error('💥 Fatal error in checkUser:', err)
        setErrorStatus(`Erro fatal: ${err.message || 'Desconhecido'}`)
        setTimeout(() => router.replace('/login/'), 3000)
      }
    }

    checkUser()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center gap-6">
      {!errorStatus ? (
        <>
          <Loader2 className="animate-spin text-indigo-600" size={56} />
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-900 font-black uppercase text-[12px] tracking-[6px] animate-pulse">
              Carregando Pneu Control
            </p>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Sincronizando ambiente...
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="text-rose-500" size={48} />
          <h2 className="text-xl font-black text-gray-900">Algo deu errado</h2>
          <p className="text-gray-500 font-medium text-sm">{errorStatus}</p>
          <button
            onClick={() => window.location.href = '/login/'}
            className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100"
          >
            Ir para Login
          </button>
        </div>
      )}
    </div>
  )
}