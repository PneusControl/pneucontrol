'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, Building2, Search, Loader2, MoreVertical, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Company {
    id: string
    name: string
    cnpj: string
    status: string
    created_at: string
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/system/companies`)
                const data = await response.json()
                setCompanies(data)
            } catch (err) {
                console.error('Erro ao buscar empresas:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanies()
    }, [])

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Buscando empresas cadastradas...</p>
        </div>
    )

    return (
        <div className="p-10">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Clientes Ativos</h1>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mt-1">Gestão de Tenants</p>
                </div>
                <Link
                    href="/system/companies/new"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={18} /> Cadastrar Empresa
                </Link>
            </header>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Empresa</th>
                            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">CNPJ</th>
                            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                            <Building2 className="text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-gray-800 font-bold text-lg">Nenhuma empresa encontrada</p>
                                            <p className="text-gray-400 text-sm">Comece cadastrando um novo cliente.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr key={company.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-gray-800 font-bold">{company.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">ID: {company.id.split('-')[0]}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-500 font-mono font-medium">
                                        {company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${company.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {company.status === 'active' ? 'Ativo' : company.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir esta empresa definitivamente? Todos os dados vinculados (veículos, pneus, inspeções) serão apagados.')) {
                                                        fetch(`${API_BASE_URL}/api/v1/system/companies/${company.id}`, { method: 'DELETE' })
                                                            .then(() => setCompanies(prev => prev.filter(c => c.id !== company.id)))
                                                    }
                                                }}
                                                className="p-2 text-gray-300 hover:text-rose-600 transition-colors"
                                                title="Excluir Definitivamente"
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                            <Link
                                                href={`/system/companies/${company.id}`}
                                                className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                                            >
                                                <ExternalLink size={20} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
