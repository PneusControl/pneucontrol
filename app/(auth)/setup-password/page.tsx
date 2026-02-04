'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

function SetupPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'implicit',
                detectSessionInUrl: false,
                persistSession: true,
            }
        }
    )

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [tokenError, setTokenError] = useState<string | null>(null)

    // Armazena o token cru para uso direto via Fetch (Bypass no Client Supabase)
    const [directAccessToken, setDirectAccessToken] = useState<string | null>(null)

    const effectRan = useRef(false)

    useEffect(() => {
        if (effectRan.current) return
        effectRan.current = true

        const handleAuthCallback = async () => {
            try {
                // 1. Limpeza preventiva de sessões Zumbis
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession) {
                    const { error: userError } = await supabase.auth.getUser()
                    if (userError) {
                        console.warn('Sessão zumbi detectada. Limpando armazenamento...')
                        localStorage.clear() // Remove lixo
                        // NÃO recarregar a página para evitar loops. 
                        // Como usamos Direct Fetch, a sessão suja não atrapalha o submit.
                        // Apenas garantimos que o verify não pare aqui.
                    } else {
                        // Se sessão válida, ótimo.
                        console.log('Sessão válida já existe.')
                        setVerifying(false)
                        return
                    }
                }

                // 2. Extrair Token da URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const errorParam = hashParams.get('error')
                const errorDescription = hashParams.get('error_description')

                if (errorParam) {
                    setTokenError(errorDescription || 'Link inválido.')
                    setVerifying(false)
                    return
                }

                if (accessToken) {
                    console.log('Token detectado. Modo Direct Fetch ativado.')
                    setDirectAccessToken(accessToken)
                    setVerifying(false)
                } else {
                    setTokenError('Link incompleto ou expirado.')
                    setVerifying(false)
                }

            } catch (err) {
                console.error('Erro no setup:', err)
                setTokenError('Erro interno.')
                setVerifying(false)
            }
        }

        handleAuthCallback()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
        if (password !== confirmPassword) { setError('Senhas não conferem'); return }

        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                const { error: updateError } = await supabase.auth.updateUser({ password: password })
                if (updateError) throw updateError
            } else if (directAccessToken) {
                // Endpoint: PUT /auth/v1/user
                const authUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`

                const response = await fetch(authUrl, {
                    method: 'PUT',
                    headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        'Authorization': `Bearer ${directAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password: password })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.msg || errorData.message || 'Erro ao definir senha (API).')
                }
            } else {
                throw new Error('Sessão não encontrada e Token ausente.')
            }

            setSuccess(true)
            setTimeout(() => router.push('/login'), 2000)

        } catch (err: any) {
            // Se der erro de "Same Password", tratamos amigavelmente
            if (err.message?.includes('same') || err.message?.includes('different')) {
                setError('Senha já utilizada. Redirecionando para login...')
                setTimeout(() => router.push('/login'), 2000)
            } else {
                setError(err.message || 'Erro ao salvar senha.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
        )
    }

    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Link Expirado</h1>
                    <p className="text-gray-300 mb-6">{tokenError}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        Ir para Login e Redefinir Senha
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Senha Definida!</h1>
                    <p className="text-gray-300">Faça login para continuar.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/brand/logo.png" alt="Trax" className="h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Definir Senha</h1>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required minLength={8}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a senha"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required minLength={8}
                            />
                        </div>
                        {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded">{error}</div>}
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : <Lock className="h-5 w-5" />}
                            Salvar Senha
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-10">Carregando...</div>}>
            <SetupPasswordForm />
        </Suspense>
    )
}
