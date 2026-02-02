'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Truck, Settings2, BarChart3, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    current_km: number
    axle_configuration: any
}

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { user } = useAuth()

    useEffect(() => {
        if (user?.user_metadata?.tenant_id) {
            fetchVehicles()
        }
    }, [user])

    const fetchVehicles = async () => {
        try {
            const response = await fetch(`${${API_BASE_URL}}/api/v1/vehicles?tenant_id=${user.user_metadata.tenant_id}`)
            const data = await response.json()
            setVehicles(data)
        } catch (err) {
            console.error('Erro ao buscar veículos:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredVehicles = vehicles.filter(v =>
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Frota de Veículos</h1>
                    <p className="text-gray-400 text-sm font-medium">Monitoramento e configuração de eixos da frota ativa</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold">
                    <Plus size={20} /> Novo Veículo
                </button>
            </header>

            {/* Grid de Veículos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                <Truck className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none flex items-center h-6">
                                {vehicle.plate}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{vehicle.brand} {vehicle.model}</h3>
                        <p className="text-xs text-gray-400 font-medium mb-6">{vehicle.year} • {vehicle.current_km.toLocaleString()} KM</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-50">
                            <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                <Settings2 size={16} /> Configurar
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                <BarChart3 size={16} /> Dashboard
                            </button>
                        </div>
                    </div>
                ))}
                {filteredVehicles.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-100">
                        <Truck className="mx-auto text-gray-100 mb-4" size={48} />
                        <p className="text-gray-400 font-medium">Nenhum veículo cadastrado na frota.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
