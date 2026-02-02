'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, FileDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'

export default function BulkImportModal({ isOpen, onClose, onSuccess, tenantId }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setError(null)
        }
    }

    const downloadTemplate = () => {
        const header = "serial_number,brand,model,size,initial_tread,current_tread,dot\n"
        const blob = new Blob([header], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-pneucontrol.csv'
        a.click()
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const baseUrl = API_BASE_URL
            const response = await fetch(`${baseUrl}/api/v1/tires/bulk-import?tenant_id=${tenantId}`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.detail?.message || 'Erro ao processar arquivo.')
            }

            const data = await response.json()
            setResult(data)
            if (data.counts.success > 0) {
                onSuccess()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <header className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Importar Inventário</h2>
                        <p className="text-gray-400 text-sm font-medium">Suba milhares de pneus via CSV em segundos.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </header>

                <div className="p-8 pt-4 space-y-6">
                    {!result ? (
                        <>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}
                            >
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${file ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-300'}`}>
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-800 font-bold">{file ? file.name : 'Selecione seu arquivo CSV'}</p>
                                    <p className="text-gray-400 text-xs mt-1">Arraste e solte ou clique para navegar</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <FileDown className="text-amber-600" size={20} />
                                    <div>
                                        <p className="text-amber-900 font-bold text-sm">Ainda não tem o modelo?</p>
                                        <p className="text-amber-700 text-xs font-medium">Use nosso template padrão para evitar erros.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="bg-white text-amber-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
                                >
                                    Baixar Template
                                </button>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : 'Realizar Importação'}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-6 space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={48} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Processamento Concluído</h3>
                                    <p className="text-gray-400 font-medium">Resultado da sua importação:</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100">
                                    <p className="text-emerald-600 font-black text-3xl">{result.counts.success}</p>
                                    <p className="text-emerald-700/60 text-[10px] font-bold uppercase tracking-widest mt-1">Pneus Novos</p>
                                </div>
                                <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100">
                                    <p className="text-rose-600 font-black text-3xl">{result.counts.error}</p>
                                    <p className="text-rose-700/60 text-[10px] font-bold uppercase tracking-widest mt-1">Erros/Ignorados</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="text-left bg-gray-50 p-4 rounded-2xl max-h-32 overflow-y-auto">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <AlertCircle size={10} /> Registros com problema
                                    </p>
                                    {result.errors.map((msg: string, i: number) => (
                                        <p key={i} className="text-xs text-rose-500 font-medium mb-1">• {msg}</p>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-800 text-white rounded-[24px] font-bold hover:bg-gray-900 transition-all"
                            >
                                Fechar Janela
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
