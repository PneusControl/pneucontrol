'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

function SetupPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Cliente apenas para ler config, não usado para auth ativa nesta página
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [tokenError, setTokenError] = useState<string | null>(null)

    const [directAccessToken, setDirectAccessToken] = useState<string | null>(null)

    const effectRan = useRef(false)

    useEffect(() => {
        if (effectRan.current) return
        effectRan.current = true

        // Lógica simplificada: Apenas lê a URL. Ignora sessão existente/zumbi.
        const handleAuthCallback = async () => {
            try {
                // Tenta limpar lixo antigo silenciosamente, mas sem depender disso
                if (typeof window !== 'undefined') {
                    // Limpeza "best effort" das chaves do supabase
                    try {
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                                localStorage.removeItem(key)
                            }
                        })
                    } catch (e) { /* ignore */ }
                }

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
                    console.log('Token encontrado. Pronto para definir senha.')
                    setDirectAccessToken(accessToken)
                    setVerifying(false)
                } else {
                    setTokenError('Link incompleto ou expirado.')
                    setVerifying(false)
                }

            } catch (err) {
                console.error('Erro ao ler URL:', err)
                setTokenError('Erro interno.')
                setVerifying(false)
            }
        }

        handleAuthCallback()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
        if (password !== confirmPassword) { setError('Senhas não conferem'); return }

        setLoading(true)

        try {
            if (!directAccessToken) {
                throw new Error('Token de autorização perdido. Recarregue a página.')
            }

            // Fetch direto na API do Supabase Auth
            const authUrl = `${supabaseUrl}/auth/v1/user`

            const response = await fetch(authUrl, {
                method: 'PUT',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${directAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.msg || errorData.message || 'Erro ao definir senha (API).')
            }

            setSuccess(true)
            // Limpa URL e redireciona
            setTimeout(() => {
                window.location.href = '/login'
            }, 2000)

        } catch (err: any) {
            console.error('Erro no submit:', err)
            if (err.message?.includes('same') || err.message?.includes('different')) {
                setError('Senha já utilizada. Redirecionando...')
                setTimeout(() => window.location.href = '/login', 2000)
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
