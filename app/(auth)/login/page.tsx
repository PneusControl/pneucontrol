'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Truck, Mail, Lock, Eye, EyeOff, ArrowRight, BrainCircuit } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError('Credenciais inválidas ou erro de conexão.')
            setLoading(false)
            return
        }

        router.push('/')
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex">
            {/* Lado Esquerdo - Hero Premium */}
            <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-20">
                {/* Efeitos de Fundo Arredondados */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-400 rounded-full blur-[120px] opacity-50"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-black/20 rounded-full blur-[100px] opacity-30"></div>

                <div className="z-10 text-white max-w-lg">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-2xl">
                            <span className="font-black text-2xl">p</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">pneu<span className="text-white/80">track</span></h2>
                    </div>

                    <h1 className="text-6xl font-black mb-8 tracking-tighter leading-[1.1]">
                        O controle total da sua frota em um só lugar.
                    </h1>
                    <p className="text-indigo-100 text-xl font-medium leading-relaxed mb-12">
                        Aumente a vida útil dos seus pneus com nossa análise preditiva baseada em IA e monitoramento de eixos em tempo real.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20 flex-1">
                            <BrainCircuit className="mb-4 text-indigo-300" size={32} />
                            <p className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-1">Inteligência</p>
                            <p className="text-white font-bold">Predictive Engine v3</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20 flex-1">
                            <Truck className="mb-4 text-indigo-300" size={32} />
                            <p className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-1">Frota</p>
                            <p className="text-white font-bold">Monitoramento 24/7</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado Direito - Form Moderno */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="mb-12">
                        <div className="lg:hidden flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                                <span className="font-black text-xl">p</span>
                            </div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">pneu<span className="text-indigo-600">track</span></h1>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Login Administrativo</h2>
                        <p className="text-gray-400 font-bold text-lg">Insira suas credenciais para acessar o painel.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-[24px] text-sm font-black flex items-center gap-3 animate-shake">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Endereço de E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white border-2 border-transparent rounded-[24px] py-5 pl-16 pr-6 text-base font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 shadow-sm transition-all placeholder:text-gray-200"
                                    placeholder="seu@email.com.br"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Senha de Acesso</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-white border-2 border-transparent rounded-[24px] py-5 pl-16 pr-16 text-base font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 shadow-sm transition-all placeholder:text-gray-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-6 flex items-center text-gray-300 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white rounded-[24px] py-6 font-black text-lg shadow-2xl shadow-indigo-200/50 hover:bg-indigo-700 hover:shadow-indigo-300/50 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? 'Validando...' : 'Acessar Painel'} <ArrowRight size={24} />
                        </button>
                    </form>

                    <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col items-center lg:items-start gap-4">
                        <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">Pneu Control v3.0 — Enterprise Fleet Solution</p>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AlertCircle({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
