'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2, Download, Search, Eye } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Invoice {
    id: string
    nfe_number: string
    issuer_name: string
    issue_date: string
    total_value: number
    status: string
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')
    const { user } = useAuth()

    useEffect(() => {
        if (user?.user_metadata?.tenant_id) {
            fetchInvoices()
        }
    }, [user])

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`${${API_BASE_URL}}/api/v1/invoices?tenant_id=${user.user_metadata.tenant_id}`)
            const data = await response.json()
            setInvoices(data)
        } catch (err) {
            console.error('Erro ao buscar notas:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`${${API_BASE_URL}}/api/v1/invoices/upload-xml?tenant_id=${user.user_metadata.tenant_id}`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                alert('Nota Fiscal processada com sucesso!')
                fetchInvoices()
            } else {
                alert('Erro ao processar Nota Fiscal.')
            }
        } catch (err) {
            alert('Erro na conexão com o servidor.')
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notas Fiscais</h1>
                    <p className="text-gray-400 text-sm font-medium">Entrada automatizada de estoque via XML de NFe</p>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="nfe-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="nfe-upload"
                        className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                        Importar XML de NFe
                    </label>
                </div>
            </header>

            {/* Grid de Historico */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                <div className="p-6 border-b border-gray-50 flex gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-50/50 border border-gray-50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                            placeholder="Buscar por número da nota ou emitente..."
                        />
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Número / Série</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emitente</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Emissão</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Total</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{invoice.nfe_number}</p>
                                            <p className="text-xs text-gray-400 font-medium">Série {invoice.series}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-gray-600">
                                    {invoice.issuer_name}
                                </td>
                                <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                                    {new Date(invoice.issue_date).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-indigo-600">
                                    R$ {invoice.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <p className="text-gray-400 font-medium">Nenhuma nota fiscal processada.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
