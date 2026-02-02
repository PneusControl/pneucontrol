'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Package, Search, Ruler, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { db } from '@/lib/db'

interface Tire {
    id: string
    serial_number: string
    brand: string
    model: string
    current_tread: number
    status: string
}

export default function MobileInventoryPage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [tires, setTires] = useState<Tire[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const loadTires = async () => {
            if (!tenantId) return
            try {
                // Tenta carregar do cache offline
                const cached = await db.tires.where('tenant_id').equals(tenantId).toArray()
                if (cached.length > 0) setTires(cached as any)

                // Tenta API
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/tires?tenant_id=${tenantId}`)
                if (response.ok) {
                    const data = await response.json()
                    setTires(data)
                    // Atualizar cache
                    await db.tires.clear()
                    await db.tires.bulkAdd(data)
                }
            } catch (err) {
                console.warn('Usando dados offline para pneus')
            } finally {
                setLoading(false)
            }
        }
        loadTires()
    }, [tenantId])

    const filtered = tires.filter(t =>
        t.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6">
            <header className="mb-8 mt-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventário</h1>
                <p className="text-gray-400 font-medium">Gestão de pneus em estoque e uso.</p>
            </header>

            <div className="relative mb-8">
                <input
                    type="text"
                    placeholder="Buscar série ou marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-3xl py-5 px-8 font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>

            {loading && tires.length === 0 ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((t) => (
                        <div
                            key={t.id}
                            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.status === 'em_uso' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <Package size={28} />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="font-black text-gray-900 uppercase tracking-tighter text-lg">{t.serial_number}</h2>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t.brand} {t.model}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-indigo-600 text-[10px] font-black uppercase">
                                            <Ruler size={12} /> {t.current_tread} mm
                                        </div>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                        <div className={`text-[9px] font-black uppercase tracking-tighter ${t.status === 'em_uso' ? 'text-indigo-400' : 'text-emerald-500'}`}>
                                            {t.status === 'em_uso' ? 'Em Rodagem' : 'Em Estoque'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="p-3 bg-gray-50 rounded-2xl text-gray-300 hover:text-indigo-600 transition-all">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
