'use client'

import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/lib/api-config'
import { useAuth } from '@/components/providers/AuthProvider'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { TrendingDown, Calendar, Gauge } from 'lucide-react'

interface WearHistoryPoint {
    month: string
    sulco_medio: number
    inspections_count: number
}

export default function TireWearChart() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [data, setData] = useState<WearHistoryPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) {
                setLoading(false)
                return
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/predictions/wear-history?tenant_id=${tenantId}`)
                const result = await response.json()
                setData(result.history || [])
            } catch (err) {
                console.error('Erro ao buscar histórico:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [tenantId])

    // Formatar mês para exibição (2024-01 -> Jan/24)
    const formatMonth = (month: string) => {
        const [year, m] = month.split('-')
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return `${months[parseInt(m) - 1]}/${year.slice(2)}`
    }

    const chartData = (Array.isArray(data) ? data : []).map(d => ({
        ...d,
        name: formatMonth(d.month)
    }))

    if (loading) {
        return (
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 h-80 flex items-center justify-center">
                <div className="animate-pulse text-gray-300 font-bold">Carregando gráfico...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex flex-col items-center justify-center h-80">
                <Gauge className="text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold text-sm">Sem dados de inspeção</p>
                <p className="text-gray-300 text-xs mt-1">Faça inspeções para gerar histórico de desgaste</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <TrendingDown className="text-indigo-600" size={24} />
                        Tendência de Desgaste
                    </h3>
                    <p className="text-gray-400 text-sm font-medium">Sulco médio ao longo do tempo</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Calendar size={14} />
                    Últimos 6 meses
                </div>
            </header>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSulco" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                            label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}
                            labelStyle={{ color: '#9ca3af' }}
                            itemStyle={{ color: '#a5b4fc' }}
                            formatter={(value: number) => [`${value} mm`, 'Sulco Médio']}
                        />
                        <Area
                            type="monotone"
                            dataKey="sulco_medio"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSulco)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Resumo */}
            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between text-xs">
                <div>
                    <span className="text-gray-400 font-bold">Total de Inspeções:</span>
                    <span className="ml-2 font-black text-gray-700">
                        {(Array.isArray(data) ? data : []).reduce((acc, d) => acc + d.inspections_count, 0)}
                    </span>
                </div>
                {data.length >= 2 && (
                    <div>
                        <span className="text-gray-400 font-bold">Variação:</span>
                        <span className={`ml-2 font-black ${data[data.length - 1].sulco_medio < data[0].sulco_medio
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                            }`}>
                            {(data[data.length - 1].sulco_medio - data[0].sulco_medio).toFixed(2)} mm
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
