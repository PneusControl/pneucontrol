'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, FileText, Search, Loader2, Calendar, Download, Eye } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

interface Invoice {
    id: string
    nfe_number: string
    series: string
    issuer_name: string
    issuer_cnpj: string
    issue_date: string
    total_value: number
    status: string
    created_at: string
}

export default function InvoicesHistoryPage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id

    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!tenantId) {
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/invoices?tenant_id=${tenantId}`)
                const data = await response.json()
                setInvoices(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error('Erro ao buscar notas:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchInvoices()
    }, [tenantId])

    return (
        <div className="p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Entradas de Notas</h1>
                    <p className="text-gray-400 font-medium mt-1">Histórico de importações e registros de pneus via NF.</p>
                </div>

                <Link
                    href="/dashboard/invoices/new"
                    className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-bold flex items-center gap-3 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={20} /> Importar Nova NF
                </Link>
            </header>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fornecedor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Emissão</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-300">
                                            <FileText size={48} />
                                            <p className="font-bold text-gray-400">Nenhuma nota fiscal importada ainda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 tracking-tight uppercase">NF {inv.nfe_number}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">Série {inv.series}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-800 text-sm">{inv.issuer_name}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{inv.issuer_cnpj}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Calendar size={14} className="text-gray-300" />
                                                <span className="text-xs font-bold text-gray-500">{new Date(inv.issue_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-gray-900">R$ {inv.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${inv.status === 'finalizada' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                                                <Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
