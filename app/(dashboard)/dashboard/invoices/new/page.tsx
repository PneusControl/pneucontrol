'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, ChevronRight, Loader2, AlertCircle, Save, X, Edit3, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

interface ExtractedItem {
    sku?: string
    description: string
    qty: number
    unit_price: number
    ncm?: string
    serial_number?: string | null
}

interface ExtractedData {
    nfe_number: string
    series: string
    issue_date: string
    issuer: {
        cnpj: string
        name: string
    }
    total_value: number
    items: ExtractedItem[]
    source: string
}

export default function NewInvoicePage() {
    const { user } = useAuth()
    const router = useRouter()
    const tenantId = user?.user_metadata?.tenant_id

    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<ExtractedData | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        const selectedFile = e.target.files[0]
        setFile(selectedFile)
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const baseUrl = API_BASE_URL
            const response = await fetch(`${baseUrl}/api/v1/invoices/upload?tenant_id=${tenantId}`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.detail || 'Erro ao processar arquivo')
            }

            const result = await response.json()
            setData(result.data)
            setStep(2)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!data || !tenantId) return
        setLoading(true)
        try {
            const baseUrl = API_BASE_URL
            const response = await fetch(`${baseUrl}/api/v1/invoices/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    ...data
                })
            })

            if (!response.ok) throw new Error('Erro ao salvar dados')

            router.push('/dashboard/invoices')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateItem = (index: number, field: keyof ExtractedItem, value: any) => {
        if (!data) return
        const newItems = [...data.items]
        newItems[index] = { ...newItems[index], [field]: value }
        setData({ ...data, items: newItems })
    }

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
                    <div className="h-px w-8 bg-gray-100"></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    {step === 1 ? 'Subir Nota Fiscal' : 'Revisar Dados da NF'}
                </h1>
                <p className="text-gray-400 font-medium mt-1">
                    {step === 1 ? 'Arraste seu DANFE (XML ou PDF) para começar.' : 'Verifique se os pneus e números de série estão corretos.'}
                </p>
            </header>

            {error && (
                <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="text-rose-600 shrink-0" size={24} />
                    <div>
                        <p className="text-rose-900 font-bold">Ocorreu um problema</p>
                        <p className="text-rose-700 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {step === 1 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-white border-2 border-dashed rounded-[48px] p-24 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all hover:bg-indigo-50/30 hover:border-indigo-300 group ${loading ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-sm">
                        {loading ? <Loader2 className="animate-spin" size={40} /> : <Upload size={40} />}
                    </div>
                    <div className="text-center">
                        <p className="text-gray-900 font-black text-2xl tracking-tight">Clique para selecionar</p>
                        <p className="text-gray-400 font-medium mt-1">Suporta arquivos .xml (NFe) e .pdf (DANFE)</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xml,.pdf" onChange={handleFileUpload} />

                    {loading && (
                        <div className="mt-4 text-center">
                            <p className="text-indigo-600 font-bold animate-pulse text-sm">PROCESSANDO COM IA...</p>
                            <p className="text-gray-400 text-xs mt-1 italic">Isso pode levar até 30 segundos para PDFs</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    {/* Cabeçalho da Nota */}
                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fornecedor</p>
                            <p className="font-bold text-gray-900 truncate">{data?.issuer.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{data?.issuer.cnpj}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">NF / Série</p>
                            <p className="font-bold text-gray-900">{data?.nfe_number} - {data?.series}</p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Emitida em {data?.issue_date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="font-black text-3xl text-indigo-600 tracking-tighter">
                                R$ {data?.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Tabela de Itens */}
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição do Pneu</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Qtd</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nº de Série (Matrícula)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor Unit.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors uppercase">{item.description}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest lowercase">sku: {item.sku || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value))}
                                                className="w-16 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Digitar Nº de Série..."
                                                    value={item.serial_number || ''}
                                                    onChange={(e) => updateItem(idx, 'serial_number', e.target.value)}
                                                    className={`w-full bg-gray-50 border rounded-xl py-2 px-4 text-sm font-bold uppercase transition-all focus:outline-none ${!item.serial_number ? 'border-amber-200 placeholder:text-amber-400 focus:ring-amber-200' : 'border-gray-100 focus:ring-indigo-100'}`}
                                                />
                                                {!item.serial_number && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500">
                                                        <AlertCircle size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-sm text-gray-500">
                                            R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="flex justify-between items-center py-6">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 text-gray-400 font-bold flex items-center gap-2 hover:text-gray-600 transition-all"
                        >
                            <Trash2 size={20} /> Descartar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || data?.items.some(i => !i.serial_number)}
                            className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-bold flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                            Confirmar Importação
                        </button>
                    </footer>
                </div>
            )}
        </div>
    )
}
