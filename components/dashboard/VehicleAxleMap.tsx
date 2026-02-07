'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabaseClient'
import { Settings2, Truck, AlertCircle } from 'lucide-react'

interface Axle {
    id: number
    type: 'dir' | 'traction' | 'load'
    is_dual: boolean
    tires: (string | null)[]
}

interface Vehicle {
    id: string
    placa: string
    marca: string
    modelo: string
    axle_configuration: Axle[]
}

export default function VehicleAxleMap() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const supabase = createClient()

    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFirstVehicle = async () => {
            if (!tenantId) {
                setLoading(false)
                return
            }
            try {
                const { data, error } = await supabase
                    .from('vehicles')
                    .select('id, placa, marca, modelo, axle_configuration')
                    .eq('tenant_id', tenantId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single()

                if (data && !error) {
                    setVehicle(data)
                }
            } catch (err) {
                console.error('Erro ao buscar veículo:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchFirstVehicle()
    }, [tenantId])

    if (loading) {
        return (
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center justify-center h-96">
                <div className="animate-pulse text-gray-300 font-bold">Carregando veículo...</div>
            </div>
        )
    }

    // Validação robusta para evitar erros
    const rawAxles = vehicle?.axle_configuration
    const axles = Array.isArray(rawAxles) ? rawAxles : []

    if (!vehicle || axles.length === 0) {
        return (
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center justify-center h-96">
                <Truck className="text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold text-sm">Nenhum veículo configurado</p>
                <p className="text-gray-300 text-xs mt-1">Cadastre um veículo com eixos para visualizar aqui</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center">
            <header className="w-full flex justify-between items-center mb-12">
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        Mapa de Eixos
                    </h3>
                    <p className="text-gray-400 text-sm font-medium">
                        {vehicle.marca} {vehicle.modelo} - {vehicle.placa}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-400 font-bold">OK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-gray-400 font-bold">Atenção</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        <span className="text-gray-400 font-bold">Crítico</span>
                    </div>
                </div>
            </header>

            <div className="relative w-64 flex flex-col items-center gap-10">
                {/* Cabine */}
                <div className="w-32 h-20 bg-gray-300 rounded-t-3xl relative shadow-inner">
                    <div className="absolute top-4 left-6 right-6 h-3 bg-white/40 rounded-full"></div>
                </div>

                {/* Eixos dinâmicos */}
                {axles.map((axle, index) => (
                    <div key={axle.id ?? index} className="relative flex w-full justify-between items-center px-2">
                        {/* Rodas esquerdas */}
                        <div className="flex gap-1">
                            {(Array.isArray(axle.tires) ? axle.tires : []).slice(0, axle.is_dual ? 2 : 1).map((tireId, i) => (
                                <TireNode
                                    key={`L-${i}`}
                                    status={tireId ? 'ok' : 'empty'}
                                    label={index === 0 && i === 0 ? 'FL' : undefined}
                                />
                            ))}
                        </div>

                        {/* Barra do eixo */}
                        <div className={`flex-1 mx-2 h-3 rounded-full ${axle.type === 'traction'
                            ? 'bg-indigo-400 shadow-lg shadow-indigo-100'
                            : axle.type === 'dir'
                                ? 'bg-blue-300'
                                : 'bg-gray-300'
                            }`}>
                            <div className="text-[8px] text-center text-white font-black uppercase mt-0.5">
                                {axle.type === 'traction' ? 'TRÇ' : axle.type === 'dir' ? 'DIR' : 'CAR'}
                            </div>
                        </div>

                        {/* Rodas direitas */}
                        <div className="flex gap-1">
                            {(Array.isArray(axle.tires) ? axle.tires : []).slice(axle.is_dual ? 2 : 1).map((tireId, i) => (
                                <TireNode
                                    key={`R-${i}`}
                                    status={tireId ? 'ok' : 'empty'}
                                    label={index === 0 && i === (axle.is_dual ? 1 : 0) ? 'FR' : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumo */}
            <div className="mt-8 pt-4 border-t border-gray-50 w-full flex justify-between text-xs">
                <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-indigo-600" />
                    <span className="text-gray-400 font-bold">{axles.length} Eixos</span>
                </div>
                <div>
                    <span className="text-gray-400 font-bold">Pneus montados:</span>
                    <span className="ml-2 font-black text-gray-700">
                        {axles.reduce((acc, axle) => acc + (Array.isArray(axle.tires) ? axle.tires : []).filter(t => t !== null).length, 0)} / {axles.reduce((acc, axle) => acc + (Array.isArray(axle.tires) ? axle.tires : []).length, 0)}
                    </span>
                </div>
            </div>
        </div>
    )
}

function TireNode({ status, label }: { status: 'ok' | 'warning' | 'critical' | 'empty', label?: string }) {
    const colors = {
        ok: 'bg-emerald-500 border-emerald-400 shadow-emerald-200/50',
        warning: 'bg-amber-500 border-amber-400 shadow-amber-200/50',
        critical: 'bg-red-600 border-red-500 shadow-red-200/50',
        empty: 'bg-gray-200 border-gray-300 border-dashed shadow-none'
    }

    return (
        <div className="flex flex-col items-center gap-1">
            {label && <span className="text-[8px] font-black text-gray-400">{label}</span>}
            <div className={`w-6 h-10 rounded-md border-2 shadow-lg ${colors[status]} transition-transform hover:scale-110 cursor-pointer`}></div>
        </div>
    )
}
