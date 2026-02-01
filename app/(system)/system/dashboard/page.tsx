'use client'

import React, { useState, useEffect } from 'react'
import {
    Building2, Truck, ShieldCheck, Activity,
    ArrowUpRight, Users, Box, Zap, Loader2
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function SystemDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalCompanies: 0,
        totalVehicles: 0,
        totalTires: 0,
        totalInspections: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                const response = await fetch(`${baseUrl}/api/v1/system/dashboard`)
                const result = await response.json()

                if (result.success) {
                    setStats({
                        totalCompanies: result.data.total_companies,
                        totalVehicles: result.data.total_vehicles,
                        totalTires: result.data.total_tires,
                        totalInspections: result.data.total_inspections,
                    })
                }
            } catch (error) {
                console.error('Erro ao buscar stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    const chartData = [
        { name: 'Jan', companies: 2 },
        { name: 'Fev', companies: 4 },
        { name: 'Mar', companies: stats.totalCompanies },
    ]

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Carregando estatisticas reais...</p>
        </div>
    )

    return (
        <div className="p-10">
            <header className="mb-10">
                <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
                <p className="text-gray-400 text-sm font-medium">Monitoramento global em tempo real</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <KpiCard
                    icon={<Building2 className="text-indigo-600" />}
                    label="Empresas Ativas"
                    value={stats.totalCompanies.toString()}
                    trend="KPI Real"
                />
                <KpiCard
                    icon={<Truck className="text-blue-600" />}
                    label="Veículos Totais"
                    value={stats.totalVehicles.toString()}
                    trend="Cadastrados"
                />
                <KpiCard
                    icon={<Box className="text-emerald-600" />}
                    label="Pneus no Sistema"
                    value={stats.totalTires.toString()}
                    trend="Total"
                />
                <KpiCard
                    icon={<Activity className="text-orange-600" />}
                    label="Inspeções Totais"
                    value={stats.totalInspections.toLocaleString()}
                    trend="Analytics"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Crescimento */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 mb-8">Crescimento de Tenants</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="companies" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4338ca' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Logs Rápidos */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Atividades do Sistema</h2>
                    <div className="space-y-6">
                        <ActivityItem
                            icon={<ShieldCheck className="text-emerald-500" />}
                            label="Novo Secret Salvo"
                            desc="OPENROUTER_API_KEY atualizada"
                            time="2 min ago"
                        />
                        <ActivityItem
                            icon={<Plus className="text-indigo-500" />}
                            label="Empresa Cadastrada"
                            desc="Transportadora Silva via API"
                            time="1h ago"
                        />
                        <ActivityItem
                            icon={<ArrowUpRight className="text-blue-500" />}
                            label="Backup Concluído"
                            desc="Supabase DB Snapshot"
                            time="4h ago"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ icon, label, value, trend }: any) {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{trend}</span>
                <ArrowUpRight size={14} className="text-gray-300" />
            </div>
        </div>
    )
}

function ActivityItem({ icon, label, desc, time }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{label}</p>
                <p className="text-xs text-gray-400 font-medium truncate">{desc}</p>
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase shrink-0 whitespace-nowrap">{time}</span>
        </div>
    )
}


function Plus(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}
