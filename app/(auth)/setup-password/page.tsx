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
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [tokenError, setTokenError] = useState<string | null>(null)
    const [showManualReset, setShowManualReset] = useState(false)

    const effectRan = useRef(false)

    useEffect(() => {
        if (effectRan.current) return
        effectRan.current = true

        const handleAuthCallback = async () => {
            try {
                // Listener de segurança: se a sessão mudar por qualquer motivo, destrava
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        console.log('Evento SIGNED_IN detectado!')
                        setVerifying(false)
                    }
                })

                // 1. Tentar verificar sessão existente PRIMEIRO
                const { data: { session: existingSession } } = await supabase.auth.getSession()

                if (existingSession) {
                    console.log('Sessão encontrada (Cookie). Validando usuário...')
                    const { error: userError } = await supabase.auth.getUser()

                    if (userError) {
                        console.warn('Sessão fantasma detectada. Executando limpeza forçada...')

                        // 1. Tentar Logout normal (pode falhar com 403)
                        await supabase.auth.signOut().catch(() => { })

                        // 2. Limpeza Nuclear do LocalStorage
                        // O prefixo padrão é 'sb-' + PROJECT_ID + '-auth-token'
                        const projectID = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1] || 'fpdsfepxlcltaoaozvsg'
                        const storageKey = `sb-${projectID}-auth-token`

                        // Tenta limpar chaves conhecidas
                        localStorage.removeItem(storageKey)
                        localStorage.removeItem('supabase.auth.token')

                        // Limpa qualquer chave que comece com sb- e termine com -auth-token
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i)
                            if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
                                localStorage.removeItem(key)
                            }
                        }

                        console.log('Limpeza local concluída. Recarregando para aplicar...')
                        window.location.reload() // Reload necessário para limpar memória do Client Supabase
                        return
                    } else {
                        console.log('Sessão válida confirmada.')
                        setVerifying(false)
                        return
                    }
                }

                // 2. Hash Params (Segue normal se não houve return acima)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')

                const errorParam = hashParams.get('error') || searchParams.get('error')
                const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')

                if (errorParam) {
                    const { data: { session: lastCheck } } = await supabase.auth.getSession()
                    if (lastCheck) { setVerifying(false); return }

                    console.error('Erro na URL:', errorParam, errorDescription)
                    setTokenError(errorDescription || 'Link inválido ou expirado.')
                    setVerifying(false)
                    return
                }

                // 3. Troca Manual com Timeout e Fallback
                if (accessToken && refreshToken) {
                    console.log('Tokens na URL detectados, tentando troca manual...')

                    try {
                        // Promise Race com Timeout de 8s
                        const { data, error: sessionError } = await Promise.race([
                            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
                            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000))
                        ])

                        if (sessionError) {
                            const { data: { session: retrySession } } = await supabase.auth.getSession()
                            if (retrySession) { setVerifying(false); return }

                            console.error('Erro ao criar sessão:', sessionError)
                            setTokenError('Link expirado. Use o botão abaixo para redefinir sua senha.')
                            setShowManualReset(true)
                            setVerifying(false)
                            return
                        }

                        if (data?.session) {
                            console.log('Sessão criada manualmente com sucesso.')
                            window.history.replaceState(null, '', window.location.pathname)
                            setVerifying(false)
                        }
                    } catch (timeoutErr: any) {
                        console.error('Timeout ou Erro:', timeoutErr)
                        // Em caso de timeout, verificamos uma ultima vez e mostramos fallback
                        const { data: { session: finalTimeoutCheck } } = await supabase.auth.getSession()
                        if (finalTimeoutCheck) { setVerifying(false); return }

                        setTokenError('O servidor demorou para responder. Tente redefinir manualmente.')
                        setShowManualReset(true)
                        setVerifying(false)
                    }
                } else {
                    const { data: { session: finalCheck } } = await supabase.auth.getSession()
                    if (finalCheck) { setVerifying(false); return }

                    setTokenError('Link incompleto. Acesse novamente pelo email.')
                    setVerifying(false)
                }

                subscription?.unsubscribe()

            } catch (err) {
                console.error('Erro geral:', err)
                setTokenError('Erro ao processar. Tente novamente.')
                setVerifying(false)
            }
        }

        handleAuthCallback()
    }, [supabase, searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres'); return }
        if (password !== confirmPassword) { setError('As senhas não coincidem'); return }

        setLoading(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: password })
            if (updateError) {
                if (updateError.message.includes('different') || updateError.message.includes('old password')) {
                    setError('Senha já utilizada. Tente fazer login.')
                    setTimeout(() => router.push('/login'), 3000)
                    return
                }
                throw updateError
            }
            setSuccess(true)
            setTimeout(() => router.push('/dashboard'), 2000)
        } catch (err: any) {
            setError(err.message || 'Erro ao definir senha.')
        } finally {
            setLoading(false)
        }
    }

    const handleManualReset = () => {
        router.push('/login?reset=true') // Redireciona para login onde user pode clicar em Esqueci Senha
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-white text-lg">Validando seu acesso...</p>
                </div>
            </div>
        )
    }

    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Atenção</h1>
                    <p className="text-gray-300 mb-6">{tokenError}</p>

                    {showManualReset ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Como o link de convite expirou ou falhou, você pode solicitar um novo link de redefinição de senha seguro.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                Ir para Login e Redefinir Senha
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            Voltar para Login
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Sucesso!</h1>
                    <p className="text-gray-300">Redirecionando...</p>
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
