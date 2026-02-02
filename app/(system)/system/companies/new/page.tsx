'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, User, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import CNPJSearch from '@/components/admin/CNPJSearch'

export default function NewCompanyPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        admin_name: '',
        admin_email: '',
        plan: 'basic'
    })
    const router = useRouter()

    const handleCNPJSuccess = (data: any) => {
        setFormData(prev => ({
            ...prev,
            name: data.nome_fantasia || data.razao_social,
            cnpj: data.cnpj
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`${${API_BASE_URL}}/api/v1/system/companies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Erro ao criar empresa')

            router.push('/system/companies')
        } catch (err) {
            alert('Erro ao cadastrar empresa. Verifique os dados.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-800">Cadastrar Nova Empresa</h1>
                <p className="text-gray-400 font-medium font-sans">Configure um novo tenant no ecossistema Pneu Control.</p>
            </header>

            <div className="space-y-10">
                {/* Passo 1: Busca */}
                <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                    <CNPJSearch onSuccess={handleCNPJSuccess} />
                </section>

                {/* Passo 2: Detalhes */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome da Empresa / Fantasia</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Building2 size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
                                    placeholder="Ex: Transportadora Silva"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Admin - Nome Completo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={formData.admin_name}
                                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                    required
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
                                    placeholder="Ex: Roberto Carlos"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Admin - E-mail Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                    required
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
                                    placeholder="roberto@transportadora.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Plano</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <ShieldCheck size={18} />
                                </div>
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all appearance-none"
                                >
                                    <option value="basic">Basic (R$ 799/mês)</option>
                                    <option value="pro">Pro (R$ 1.499/mês)</option>
                                    <option value="enterprise">Enterprise (R$ 2.499/mês)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Salvar Empresa e Enviar Convite'} <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    )
}
