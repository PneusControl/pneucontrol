'use client'

import React, { useState, useEffect } from 'react'
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Loader2, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { API_BASE_URL } from '@/lib/api-config'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

export default function ReportsPage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        if (tenantId) fetchStats()
    }, [tenantId])

    const fetchStats = async () => {
        setLoading(true)
        try {
            // Buscando predições para compor o relatório
            const response = await fetch(`${API_BASE_URL}/api/v1/tires?tenant_id=${tenantId}`)
            const tires = await response.json()

            // Simulação de agregação para o relatório (em um cenário real seria um endpoint de analytics)
            const alertCounts = { critical: 0, urgent: 0, attention: 0, ok: 0 }
            let totalCPK = 0
            let countWithCPK = 0

            tires.forEach((t: any) => {
                const alert = t.predictions?.nivel_alerta || 'ok'
                if (alertCounts.hasOwnProperty(alert)) alertCounts[alert as keyof typeof alertCounts]++

                if (t.predictions?.cpk) {
                    totalCPK += parseFloat(t.predictions.cpk)
                    countWithCPK++
                }
            })

            const cpkData = [
                { name: 'Jan', value: 0.12 },
                { name: 'Fev', value: 0.15 },
                { name: 'Mar', value: 0.11 },
                { name: 'Abr', value: 0.14 },
            ]

            setStats({
                totalTires: tires.length,
                alerts: alertCounts,
                avgCPK: countWithCPK > 0 ? (totalCPK / countWithCPK).toFixed(2) : "0.00",
                cpkHistory: cpkData
            })
        } catch (err) {
            console.error('Erro ao gerar relatório:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Compilando dados analíticos...</p>
        </div>
    )

    const alertDisplayData = [
        { name: 'Crítico', value: stats.alerts.critical, color: '#F43F5E' },
        { name: 'Urgente', value: stats.alerts.urgent, color: '#F59E0B' },
        { name: 'Atenção', value: stats.alerts.attention, color: '#3B82F6' },
        { name: 'OK', value: stats.alerts.ok || stats.totalTires - (stats.alerts.critical + stats.alerts.urgent + stats.alerts.attention), color: '#10B981' },
    ]

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Inteligência</h1>
                <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Relatórios preditivos e performance de frota</p>
            </header>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <TrendingUp size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-black">
                            +12% <ArrowUpRight size={14} />
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPK Médio</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">R$ {stats.avgCPK}</h3>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-rose-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-rose-500 text-xs font-black uppercase">Crítico</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pneus c/ Alerta</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.alerts.critical + stats.alerts.urgent}</h3>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-emerald-100/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <CheckCircle size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-black uppercase">Auditado</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total no Estoque</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalTires}</h3>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl shadow-indigo-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Saving Mensal</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter">R$ 1.420</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Histórico de CPK */}
                <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-50">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">Evolução do CPK</h4>
                        <select className="bg-gray-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
                            <option>Últimos 6 meses</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.cpkHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94A3B8' }} />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribuição de Alertas */}
                <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-50">
                    <h4 className="text-xl font-black text-gray-900 tracking-tight mb-10">Status de Saúde da Frota</h4>
                    <div className="grid grid-cols-2 gap-8 items-center">
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={alertDisplayData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {alertDisplayData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            {alertDisplayData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs font-bold text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="font-black text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
