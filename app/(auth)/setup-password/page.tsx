'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // O Supabase Auth automaticamente processa o token da URL
                // quando o usuario clica no link de convite
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Erro ao verificar sessão:', error)
                    setTokenError(error.message)
                    setVerifying(false)
                    return
                }

                // Verificar se há erro na URL (token expirado, etc)
                const errorParam = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                if (errorParam) {
                    console.error('Erro na URL:', errorParam, errorDescription)
                    setTokenError(errorDescription || 'Link inválido ou expirado')
                    setVerifying(false)
                    return
                }

                // Se já tem sessão, pode prosseguir
                if (session) {
                    console.log('Sessão encontrada, pronto para definir senha')
                }

                setVerifying(false)
            } catch (err) {
                console.error('Erro inesperado:', err)
                setTokenError('Erro ao processar o link de convite')
                setVerifying(false)
            }
        }

        handleAuthCallback()
    }, [supabase, searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validações
        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres')
            return
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        setLoading(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) {
                // Tratar caso especial: senha já foi definida antes
                if (updateError.message.includes('different from the old password') ||
                    updateError.message.includes('same as the old password')) {
                    setError('Esta senha já foi usada anteriormente. Você já configurou sua senha? Tente fazer login.')
                    // Redirecionar para login após 3 segundos
                    setTimeout(() => {
                        router.push('/login')
                    }, 3000)
                    return
                }
                throw updateError
            }

            setSuccess(true)

            // Aguarda 2 segundos e redireciona para o dashboard
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (err: any) {
            console.error('Erro ao definir senha:', err)
            setError(err.message || 'Erro ao definir senha. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    // Estado de verificação inicial
    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-white text-lg">Verificando seu link...</p>
                </div>
            </div>
        )
    }

    // Estado de erro no token
    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
                    <p className="text-gray-300 mb-6">{tokenError}</p>
                    <p className="text-sm text-gray-400 mb-6">
                        O link pode ter expirado ou já foi utilizado.
                        Entre em contato com o administrador para solicitar um novo link de acesso.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        )
    }

    // Estado de sucesso
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Senha Definida!</h1>
                    <p className="text-gray-300 mb-4">
                        Sua senha foi configurada com sucesso.
                    </p>
                    <p className="text-sm text-gray-400">
                        Redirecionando para o dashboard...
                    </p>
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mt-4" />
                </div>
            </div>
        )
    }

    // Formulário principal
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <img
                        src="/brand/logo.png"
                        alt="Trax Prediction"
                        className="h-16 mx-auto mb-4"
                    />
                    <h1 className="text-3xl font-bold text-white mb-2">Trax Prediction</h1>
                    <p className="text-gray-400">Configure sua senha de acesso</p>
                </div>

                {/* Card do formulário */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nova Senha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar Senha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite novamente"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                                minLength={8}
                            />
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Requisitos de senha */}
                        <div className="text-sm text-gray-400 space-y-1">
                            <p className={password.length >= 8 ? 'text-emerald-400' : ''}>
                                • Mínimo de 8 caracteres
                            </p>
                            <p className={password === confirmPassword && password.length > 0 ? 'text-emerald-400' : ''}>
                                • Senhas devem coincidir
                            </p>
                        </div>

                        {/* Botão Submit */}
                        <button
                            type="submit"
                            disabled={loading || password.length < 8 || password !== confirmPassword}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Configurando...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5" />
                                    Definir Senha
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    © 2026 Trax Prediction. Todos os direitos reservados.
                </p>
            </div>
        </div>
    )
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-white text-lg">Carregando...</p>
                </div>
            </div>
        }>
            <SetupPasswordForm />
        </Suspense>
    )
}
