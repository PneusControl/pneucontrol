'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Tool, AlertTriangle, Clock, Loader2, Search, ArrowRight, Truck, Wrench } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { API_BASE_URL } from '@/lib/api-config'

export default function MaintenancePage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [loading, setLoading] = useState(true)
    const [tires, setTires] = useState<any[]>([])
    const [filter, setFilter] = useState<'all' | 'critical' | 'urgent'>('all')

    useEffect(() => {
        if (tenantId) fetchMaintenanceItems()
    }, [tenantId])

    const fetchMaintenanceItems = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tires?tenant_id=${tenantId}`)
            const data = await response.json()

            // Filtra apenas pneus que têm algum alerta ou precisam de atenção
            const maintenanceList = data.filter((t: any) =>
                ['critical', 'urgent', 'attention'].includes(t.predictions?.nivel_alerta)
            ).sort((a: any, b: any) => {
                const priority: any = { critical: 1, urgent: 2, attention: 3 }
                return priority[a.predictions.nivel_alerta] - priority[b.predictions.nivel_alerta]
            })

            setTires(maintenanceList)
        } catch (err) {
            console.error('Erro ao buscar itens de manutenção:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredTires = tires.filter(t => {
        if (filter === 'all') return true
        return t.predictions?.nivel_alerta === filter
    })

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-amber-600 mb-4" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Cruzando dados de inspeção e predições...</p>
        </div>
    )

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Plano de Manutenção</h1>
                    <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Ações preventivas baseadas no desgaste real</p>
                </div>
                <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Todos ({tires.length})
                    </button>
                    <button
                        onClick={() => setFilter('critical')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'critical' ? 'bg-rose-100 text-rose-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Críticos ({tires.filter(t => t.predictions?.nivel_alerta === 'critical').length})
                    </button>
                </div>
            </header>

            {filteredTires.length === 0 ? (
                <div className="bg-white rounded-[48px] p-20 flex flex-col items-center justify-center text-center border border-gray-50">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">Sua frota está em dia!</h3>
                    <p className="text-gray-400 max-w-sm mt-2">Nenhum pneu atingiu o limite de segurança para manutenção imediata.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTires.map((tire, idx) => (
                        <div key={idx} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex items-center gap-8 group hover:shadow-xl hover:shadow-gray-100/50 transition-all">
                            {/* Alert Indicator */}
                            <div className={`w-2 h-20 rounded-full ${tire.predictions?.nivel_alerta === 'critical' ? 'bg-rose-500' :
                                    tire.predictions?.nivel_alerta === 'urgent' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}></div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{tire.numero_serie}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tire.predictions?.nivel_alerta === 'critical' ? 'bg-rose-50 text-rose-600' :
                                            tire.predictions?.nivel_alerta === 'urgent' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {tire.predictions?.nivel_alerta === 'critical' ? 'Troca Imediata' :
                                            tire.predictions?.nivel_alerta === 'urgent' ? 'Programar Troca' : 'Monitorar'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6 text-gray-400 text-xs font-bold uppercase tracking-wide">
                                    <span className="flex items-center gap-2"><Truck size={14} /> Veículo {tire.veiculo_placa || 'N/D'}</span>
                                    <span className="flex items-center gap-2"><Wrench size={14} /> Pos: {tire.posicao || 'N/D'}</span>
                                    <span className="flex items-center gap-2">Sulco: <span className="text-gray-900">{tire.predictions?.sulco_atual}mm</span></span>
                                </div>
                            </div>

                            {/* Prediction Logic */}
                            <div className="text-center px-10 border-x border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Previsão de Troca</p>
                                <p className="text-xl font-black text-gray-900 italic">
                                    {tire.predictions?.data_troca_estimada ? new Date(tire.predictions.data_troca_estimada).toLocaleDateString() : 'Avaliar'}
                                </p>
                                <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">~{tire.predictions?.dias_restantes} dias</p>
                            </div>

                            {/* Action */}
                            <button className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                                <ArrowRight size={24} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
