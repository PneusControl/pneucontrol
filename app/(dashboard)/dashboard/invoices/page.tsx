'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { FileText, Upload, Calendar, Search, Filter, Loader2, ArrowRight, Check, X, Building2, Package, AlertCircle, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Invoice {
    id: string
    invoice_number: string
    supplier_name: string
    total_amount: number
    issue_date: string
    status: string
    items_count: number
    created_at: string
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')

    // Import Review State
    const [showReview, setShowReview] = useState(false)
    const [reviewData, setReviewData] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id

    useEffect(() => {
        console.log('📦 InvoicesPage: Checking tenantId...', tenantId)
        if (tenantId) {
            fetchInvoices()
        } else {
            console.warn('⚠️ InvoicesPage: No tenantId found for user')
            setLoading(false)
        }
    }, [tenantId])

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/nfe/history?tenant_id=${tenantId}`)
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
            // Determine endpoint based on extension
            const endpoint = file.name.endsWith('.pdf') ? 'upload-pdf' : 'upload-xml'
            const response = await fetch(`${API_BASE_URL}/api/v1/nfe/${endpoint}?tenant_id=${tenantId}`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setReviewData(data)
                setShowReview(true)
            } else {
                alert('Erro ao processar arquivo.')
            }
        } catch (err) {
            console.error('Erro no upload:', err)
        } finally {
            setUploading(false)
        }
    }

    const handleConfirmImport = async () => {
        setSaving(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/nfe/confirm?tenant_id=${tenantId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            })

            if (response.ok) {
                setShowReview(false)
                setReviewData(null)
                fetchInvoices()
            } else {
                alert('Erro ao confirmar importação.')
            }
        } catch (err) {
            console.error('Erro ao confirmar:', err)
        } finally {
            setSaving(false)
        }
    }

    const filteredInvoices = invoices.filter(i =>
        i.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.invoice_number?.includes(search)
    )

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Carregando histórico de notas...</p>
        </div>
    )

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Entrada de Notas</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Processamento inteligente de XML e PDF (OCR)</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept=".xml,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="nfe-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="nfe-upload"
                        className={`flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all font-bold cursor-pointer active:scale-95 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                        Importar XML ou PDF
                    </label>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-10">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-[24px] py-5 pl-14 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all placeholder:text-gray-300 font-medium"
                        placeholder="Buscar por número da nota ou fornecedor..."
                    />
                </div>
                <button className="px-8 bg-white border border-gray-100 rounded-[24px] flex items-center gap-3 text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm">
                    <Filter size={18} className="text-indigo-500" /> Filtros Avançados
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-gray-100/50 border border-gray-50">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nota / Fornecedor</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Itens</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Valor Total</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Data Emissão</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50 text-gray-700">
                        {filteredInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-800 leading-tight mb-1">NF-e #{invoice.invoice_number}</p>
                                            <p className="text-xs text-indigo-600 font-black tracking-wider uppercase">{invoice.supplier_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                        {invoice.items_count} pneus
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className="text-sm font-black text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total_amount)}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold text-gray-500">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                                        <span className="text-[10px] font-medium text-gray-300">Há {Math.floor((Date.now() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24))} dias</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <button className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                        <ArrowRight size={20} />
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
