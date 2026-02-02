'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Database, ArrowUpDown, FileDown, Upload, Loader2, MoreVertical } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Tire {
    id: string
    serial_number: string
    brand: string
    model: string
    size: string
    status: string
    current_tread_depth: number
}

export default function TiresPage() {
    const [tires, setTires] = useState<Tire[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { user } = useAuth()

    useEffect(() => {
        if (user?.user_metadata?.tenant_id) {
            fetchTires()
        }
    }, [user])

    const fetchTires = async () => {
        try {
            const response = await fetch(`${${API_BASE_URL}}/api/v1/tires?tenant_id=${user.user_metadata.tenant_id}`)
            const data = await response.json()
            setTires(data)
        } catch (err) {
            console.error('Erro ao buscar pneus:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'estoque': return 'bg-blue-50 text-blue-600'
            case 'montado': return 'bg-emerald-50 text-emerald-600'
            case 'reforma': return 'bg-orange-50 text-orange-600'
            case 'sucata': return 'bg-rose-50 text-rose-600'
            default: return 'bg-gray-50 text-gray-600'
        }
    }

    const filteredTires = tires.filter(t =>
        t.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        t.brand.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventário de Pneus</h1>
                    <p className="text-gray-400 text-sm font-medium">Controle individual, vida útil e status de manutenção</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all font-bold text-sm">
                        <Upload size={18} /> Importar CSV
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold">
                        <Plus size={20} /> Novo Pneu
                    </button>
                </div>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatSmall label="Em Estoque" value={tires.filter(t => t.status === 'estoque').length.toString()} color="text-blue-600" />
                <StatSmall label="Em Operação" value={tires.filter(t => t.status === 'montado').length.toString()} color="text-emerald-600" />
                <StatSmall label="Em Reforma" value={tires.filter(t => t.status === 'reforma').length.toString()} color="text-orange-600" />
                <StatSmall label="Sucateados" value={tires.filter(t => t.status === 'sucata').length.toString()} color="text-rose-600" />
            </div>

            {/* Search & Table */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                <div className="p-6 border-b border-gray-50 flex gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-50/50 border border-gray-50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                            placeholder="Buscar por número de série ou marca..."
                        />
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matrícula / Modelo</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medida</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sulco Atual</th>
                            <th className="px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredTires.map((tire) => (
                            <tr key={tire.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                            <Database size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{tire.serial_number}</p>
                                            <p className="text-xs text-gray-400 font-medium">{tire.brand} {tire.model}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-gray-600">
                                    {tire.size}
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(tire.status)}`}>
                                        {tire.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                            <div
                                                className="h-full bg-emerald-500"
                                                style={{ width: `${(tire.current_tread_depth / 20) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">{tire.current_tread_depth}mm</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatSmall({ label, value, color }: any) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    )
}
