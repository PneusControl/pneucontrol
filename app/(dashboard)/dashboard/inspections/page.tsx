'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, ClipboardList, Search, Loader2, Calendar, Truck, User, ChevronRight, Gauge } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

interface Inspection {
    id: string
    created_at: string
    status: string
    odometer_km: number
    vehicle_id: string
    inspector_id: string
    vehicles?: {
        placa: string
    } | null
}

export default function InspectionHistoryPage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id

    const [inspections, setInspections] = useState<Inspection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInspections = async () => {
            if (!tenantId) {
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/inspections?tenant_id=${tenantId}`)
                const data = await response.json()
                setInspections(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error('Erro ao buscar inspeções:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchInspections()
    }, [tenantId])

    return (
        <div className="p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Histórico de Inspeções</h1>
                    <p className="text-gray-400 font-medium mt-1">Acompanhe todos os diagnósticos técnicos realizados na frota.</p>
                </div>

                <Link
                    href="/dashboard/inspections/new"
                    className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-bold flex items-center gap-3 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={20} /> Nova Inspeção
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-24 flex justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                    </div>
                ) : inspections.length === 0 ? (
                    <div className="col-span-full py-24 bg-white rounded-[40px] border border-gray-50 flex flex-col items-center gap-6 text-center shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-200 shadow-inner">
                            <ClipboardList size={48} />
                        </div>
                        <div>
                            <p className="font-black text-xl text-gray-900 tracking-tight">Nenhuma inspeção realizada</p>
                            <p className="text-gray-400 font-medium max-w-xs mt-1">Comece agora a medir os sulcos e pressões da sua frota.</p>
                        </div>
                    </div>
                ) : (
                    inspections.map(ins => (
                        <div key={ins.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex flex-col group hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    {ins.status}
                                </div>
                                <div className="text-gray-300 group-hover:text-indigo-600 transition-colors">
                                    <Calendar size={20} />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <Truck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{ins.vehicles?.placa || 'N/A'}</h3>
                                    <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                        <Gauge size={12} /> {ins.odometer_km.toLocaleString()} KM
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                        <User size={14} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase truncate">ID: {ins.inspector_id.slice(0, 8)}</span>
                                </div>
                                <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
