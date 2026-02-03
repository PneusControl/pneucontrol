'use client'
import { API_BASE_URL } from '@/lib/api-config'
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Building2, User, Mail, ShieldCheck, ArrowRight, Loader2, Save, Trash2 } from 'lucide-react'

export default function EditCompanyPage() {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        porte: '',
        regime_tributario: '',
        segmento: 'Transporte',
        endereco: null as any,
        admin_name: 'Manter Atual', // Admin data shouldn't be edited easily here without logic
        admin_email: 'Manter Atual',
        plan: 'basic'
    })
    const router = useRouter()

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/system/companies/${id}`)
                if (!response.ok) throw new Error('Empresa não encontrada')
                const data = await response.json()
                setFormData({
                    razao_social: data.razao_social || '',
                    nome_fantasia: data.nome_fantasia || '',
                    cnpj: data.cnpj || '',
                    porte: data.porte || '',
                    regime_tributario: data.regime_tributario || '',
                    segmento: data.segmento || 'Transporte',
                    endereco: data.endereco || null,
                    admin_name: 'N/A (Só Leitura)',
                    admin_email: 'N/A (Só Leitura)',
                    plan: data.plan || 'basic'
                })
            } catch (err) {
                console.error(err)
                router.push('/system/companies')
            } finally {
                setLoading(false)
            }
        }
        fetchCompany()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/system/companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Erro ao atualizar empresa')
            router.push('/system/companies')
        } catch (err) {
            alert('Erro ao atualizar empresa.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    )

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Editar Empresa</h1>
                    <p className="text-gray-400 font-medium">Atualize as informações do tenant.</p>
                </div>
                <button
                    onClick={() => {
                        if (confirm('EXCLUSÃO DEFINITIVA: Deseja apagar todos os dados desta empresa?')) {
                            fetch(`${API_BASE_URL}/api/v1/system/companies/${id}`, { method: 'DELETE' })
                                .then(() => router.push('/system/companies'))
                        }
                    }}
                    className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all flex items-center gap-2 font-bold"
                >
                    <Trash2 size={20} /> Excluir Cliente
                </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Building2 className="text-indigo-600" size={20} /> Dados Cadastrais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Razão Social</label>
                            <input
                                type="text"
                                value={formData.razao_social}
                                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                                required
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome Fantasia</label>
                            <input
                                type="text"
                                value={formData.nome_fantasia}
                                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Porte</label>
                            <input
                                type="text"
                                value={formData.porte}
                                onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Regime Tributário</label>
                            <input
                                type="text"
                                value={formData.regime_tributario}
                                onChange={(e) => setFormData({ ...formData, regime_tributario: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {formData.endereco && (
                        <div className="p-6 bg-indigo-50/30 rounded-[24px] border border-indigo-50">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Endereço Registrado</p>
                            <p className="text-sm text-indigo-900 font-medium">
                                {formData.endereco.logradouro}, {formData.endereco.numero} - {formData.endereco.bairro}
                            </p>
                            <p className="text-sm text-indigo-700">
                                {formData.endereco.municipio} / {formData.endereco.uf} - CEP: {formData.endereco.cep}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Plano Atual</label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium appearance-none"
                        >
                            <option value="basic">Basic (Até 50 veículos)</option>
                            <option value="pro">Pro (Até 200 veículos)</option>
                            <option value="enterprise">Enterprise (Ilimitado + IA Avançada)</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-indigo-600 text-white rounded-[24px] py-6 font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                >
                    {saving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'} <Save size={20} />
                </button>
            </form>
        </div>
    )
}
