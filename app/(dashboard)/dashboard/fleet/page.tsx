'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Truck, Search, Plus, MapPin, Gauge, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { db } from '@/lib/db'
import Link from 'next/link'

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    current_km: number
    status?: string
}

export default function MobileVehiclesPage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const loadVehicles = async () => {
            if (!tenantId) {
                setLoading(false)
                return
            }
            try {
                // Tenta carregar do cache offline primeiro para velocidade
                const cached = await db.vehicles.where('tenant_id').equals(tenantId).toArray()
                if (cached.length > 0) setVehicles(cached as any)

                // Tenta atualizar da API
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/vehicles?tenant_id=${tenantId}`)
                if (response.ok) {
                    const data = await response.json()
                    setVehicles(data)
                    // Atualizar cache
                    await db.vehicles.clear()
                    await db.vehicles.bulkAdd(data)
                }
            } catch (err) {
                console.warn('Usando dados offline para veículos')
            } finally {
                setLoading(false)
            }
        }
        loadVehicles()
    }, [tenantId])

    const filtered = vehicles.filter(v =>
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6">
            <header className="mb-8 mt-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Frota Ativa</h1>
                <p className="text-gray-400 font-medium">Selecione um veículo para inspecionar.</p>
            </header>

            {/* Busca Mobile Otimizada */}
            <div className="relative mb-8">
                <input
                    type="text"
                    placeholder="Buscar placa ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-3xl py-5 px-8 font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>

            {loading && vehicles.length === 0 ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((v) => (
                        <Link
                            key={v.id}
                            href={`/dashboard/inspections/new?plate=${v.plate}`}
                            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Truck size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{v.plate}</h2>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{v.brand} {v.model}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-indigo-500 text-[10px] font-black uppercase">
                                            <Gauge size={12} /> {v.current_km?.toLocaleString()} KM
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-200 group-hover:text-indigo-600 transition-colors">
                                <AlertCircle size={20} />
                            </div>
                        </Link>
                    ))}

                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">
                            {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
                        </div>
                    )}
                </div>
            )}

            {/* FAB Float Action Button para Nova Inspeção */}
            <Link
                href="/dashboard/inspections/new"
                className="fixed bottom-28 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 md:hidden"
            >
                <Plus size={32} strokeWidth={3} />
            </Link>
        </div>
    )
}
