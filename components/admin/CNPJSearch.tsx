'use client'

import React, { useState } from 'react'
import { Search, Loader2, Check, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'

interface CNPJData {
    razao_social: string
    nome_fantasia: string
    cnpj: string
    endereco?: {
        logradouro: string
        numero: string
        bairro: string
        municipio: string
        uf: string
        cep: string
    }
}

interface CNPJSearchProps {
    onSuccess: (data: CNPJData) => void
}

export default function CNPJSearch({ onSuccess }: CNPJSearchProps) {
    const [cnpj, setCnpj] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async () => {
        if (cnpj.length < 14) return

        setLoading(true)
        setError(null)

        try {
            const cleanCnpj = cnpj.replace(/\D/g, '')
            const response = await fetch(`${API_BASE_URL}/api/v1/cnpj/${cleanCnpj}`)

            if (!response.ok) throw new Error('CNPJ não encontrado ou erro na busca.')

            const data = await response.json()
            onSuccess(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Buscar por CNPJ</label>
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
                            placeholder="00.000.000/0001-00"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading || cnpj.length < 14}
                        className="px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-medium px-2">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
        </div>
    )
}
