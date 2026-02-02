'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Secret {
    key: string
    is_encrypted: boolean
    updated_at: string
}

export default function SecretsManagerPage() {
    const [secrets, setSecrets] = useState<Secret[]>([])
    const [loading, setLoading] = useState(true)
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [showValues, setShowValues] = useState<Record<string, boolean>>({})
    const [newValues, setNewValues] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchSecrets()
    }, [])

    const fetchSecrets = async () => {
        try {
            const baseUrl = API_BASE_URL
            const response = await fetch(`${baseUrl}/api/v1/system/secrets`)
            const data = await response.json()
            // Backend now returns the array directly
            setSecrets(data || [])
        } catch (err) {
            console.error('Erro ao buscar secrets:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (key: string) => {
        setSavingKey(key)
        try {
            const baseUrl = API_BASE_URL
            const response = await fetch(`${baseUrl}/api/v1/system/secrets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key,
                    value: newValues[key] || '',
                    description: `Chave configurada via UI`
                }),
            })

            if (response.ok) {
                setNewValues(prev => ({ ...prev, [key]: '' }))
                fetchSecrets()
            }
        } catch (err) {
            alert('Erro ao salvar secret')
        } finally {
            setSavingKey(null)
        }
    }

    const secretList = [
        { key: 'RESEND_API_KEY', label: 'Resend API Key', desc: 'Para envio de e-mails transacionais (onboarding).' },
        { key: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', desc: 'Para análises de IA Vision e OCR de Notas Fiscais.' },
        { key: 'R2_ACCOUNT_ID', label: 'Cloudflare Account ID', desc: 'ID da sua conta Cloudflare para o serviço R2.' },
        { key: 'R2_ACCESS_KEY_ID', label: 'R2 Access Key ID', desc: 'Credencial de acesso (S3 API Token).' },
        { key: 'R2_SECRET_ACCESS_KEY', label: 'R2 Secret Access Key', desc: 'Chave secreta de acesso (S3 API Token).' },
        { key: 'R2_BUCKET_NAME', label: 'R2 Bucket Name', desc: 'Nome do bucket de imagens (ex: pneu-control-images).' },
        { key: 'R2_PUBLIC_URL', label: 'R2 Public URL', desc: 'URL para visualização pública (ex: pub-xxx.r2.dev).' },
    ]

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10 max-w-5xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Secrets</h1>
                <p className="text-gray-400 font-medium font-sans">Configure as chaves e credenciais de serviços externos com criptografia AES-256.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {secretList.map(({ key, label, desc }) => {
                    const isStored = secrets.find(s => s.key === key)

                    return (
                        <div key={key} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="max-w-xs">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-800">{label}</h3>
                                    {isStored && <CheckCircle2 size={16} className="text-emerald-500" />}
                                </div>
                                <p className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</p>
                                {isStored && (
                                    <p className="text-[10px] text-gray-300 font-bold mt-2 uppercase tracking-widest">
                                        Atualizado em: {new Date(isStored.updated_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 flex gap-3">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                        <History size={18} className="hidden" />
                                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Lock size={10} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <input
                                        type={showValues[key] ? "text" : "password"}
                                        value={newValues[key] || ''}
                                        onChange={(e) => setNewValues({ ...newValues, [key]: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-50 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                                        placeholder={isStored ? "••••••••••••••••" : "Não configurado"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowValues({ ...showValues, [key]: !showValues[key] })}
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showValues[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleSave(key)}
                                    disabled={savingKey === key || !newValues[key]}
                                    className="px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100"
                                >
                                    {savingKey === key ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    <span className="hidden lg:inline">Salvar</span>
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function History(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
}
