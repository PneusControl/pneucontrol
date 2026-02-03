'use client'
import { API_BASE_URL } from '@/lib/api-config'
import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, AlertCircle, Loader2, Gauge, DollarSign, Upload, Trash2, Edit2, X, Check, Building2, Package, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Tire {
    id: string
    numero_serie: string
    marca: string
    modelo: string
    medida: string
    status: string
    sulco_atual: number
    valor_compra: number
    supplier_name?: string
    created_at: string
}

interface Supplier {
    id: string
    razao_social: string
    cnpj: string
}

export default function TiresPage() {
    const [tires, setTires] = useState<Tire[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        numero_serie: '',
        marca: '',
        modelo: '',
        medida: '',
        supplier_id: '',
        dot: '',
        valor_compra: ''
    })

    const tenantId = user?.user_metadata?.tenant_id

    useEffect(() => {
        console.log('📦 TiresPage: Checking tenantId...', tenantId)
        if (tenantId) {
            fetchData()
        } else {
            console.warn('⚠️ TiresPage: No tenantId found for user')
            setLoading(false)
        }
    }, [tenantId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tiresRes, suppliersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/tires?tenant_id=${tenantId}`),
                fetch(`${API_BASE_URL}/api/v1/suppliers?tenant_id=${tenantId}`)
            ])

            const tiresData = await tiresRes.json()
            const suppliersData = await suppliersRes.json()

            setTires(tiresData)
            setSuppliers(suppliersData)
        } catch (err) {
            console.error('Erro ao buscar dados:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tires`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tenant_id: tenantId,
                    valor_compra: parseFloat(formData.valor_compra) || 0,
                    numero_serie: formData.numero_serie.toUpperCase()
                })
            })

            if (response.ok) {
                setIsModalOpen(false)
                setFormData({
                    numero_serie: '', marca: '', modelo: '', medida: '', supplier_id: '', dot: '', valor_compra: ''
                })
                fetchData()
            } else {
                const error = await response.json()
                alert(error.detail || 'Erro ao salvar pneu.')
            }
        } catch (err) {
            console.error('Erro ao salvar:', err)
        } finally {
            setSaving(false)
        }
    }

    const filteredTires = tires.filter(t =>
        t.numero_serie?.toLowerCase().includes(search.toLowerCase()) ||
        t.marca?.toLowerCase().includes(search.toLowerCase()) ||
        t.modelo?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Carregando inventário...</p>
        </div>
    )

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventário de Pneus</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Controle individual, vida útil e status de manutenção</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-600 rounded-[20px] hover:bg-gray-50 transition-all font-bold shadow-sm active:scale-95">
                        <Upload size={18} className="text-indigo-500" /> Importar CSV
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all font-bold active:scale-95"
                    >
                        <Plus size={20} /> Novo Pneu
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total em Estoque', value: tires.length, icon: Package, color: 'indigo' },
                    { label: 'Ativos em Veículos', value: tires.filter(t => t.status === 'em_uso').length, icon: Gauge, color: 'emerald' },
                    { label: 'Em Manutenção', value: tires.filter(t => t.status === 'manutencao').length, icon: AlertCircle, color: 'rose' },
                    { label: 'Custos Totais', value: `R$ ${(tires.reduce((acc, t) => acc + (t.valor_compra || 0), 0) / 1000).toFixed(1)}k`, icon: DollarSign, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-100/50 border border-gray-50 flex items-center gap-5 group hover:-translate-y-1 transition-all">
                        <div className={`w-14 h-14 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-10">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-[24px] py-5 pl-14 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all placeholder:text-gray-300 font-medium"
                        placeholder="Buscar por série, marca ou modelo..."
                    />
                </div>
                <button className="px-8 bg-white border border-gray-100 rounded-[24px] flex items-center gap-3 text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm">
                    <Filter size={18} className="text-indigo-500" /> Filtros Avançados
                </button>
            </div>

            {/* Tires Table */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-gray-100/50 border border-gray-50">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pneu / Série</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fornecedor Origem</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Sulco</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {filteredTires.map((tire) => (
                            <tr key={tire.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                            <Gauge size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-800 leading-tight mb-1">{tire.marca} {tire.modelo}</p>
                                            <p className="text-xs text-gray-400 font-bold tracking-wider uppercase">{tire.numero_serie} • {tire.medida}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-3">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="text-sm font-bold text-gray-600">{tire.supplier_name || 'Manual / N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className={`text-sm font-black ${tire.sulco_atual < 4 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {tire.sulco_atual}mm
                                        </span>
                                        <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${tire.sulco_atual < 4 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${(tire.sulco_atual / 20) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${tire.status === 'em_uso' ? 'bg-emerald-50 text-emerald-600' :
                                        tire.status === 'estoque' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {tire.status}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="p-3 text-gray-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all shadow-sm">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Pneu</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Cadastro Manual e Inventário</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-90">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 max-h-[70vh] overflow-y-auto">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-indigo-600">Número de Série / Fogo</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.numero_serie}
                                            onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold uppercase"
                                            placeholder="Ex: ABC12345"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fornecedor Origem (Obrigatório)</label>
                                        <select
                                            required
                                            value={formData.supplier_id}
                                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold"
                                        >
                                            <option value="">Selecione...</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.razao_social} ({s.cnpj})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Marca</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.marca}
                                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold"
                                            placeholder="Ex: Michelin"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Modelo</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.modelo}
                                            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold"
                                            placeholder="Ex: XZA"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Medida</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.medida}
                                            onChange={(e) => setFormData({ ...formData, medida: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold"
                                            placeholder="Ex: 295/80R22.5"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Valor Unitário (R$)</label>
                                        <input
                                            type="number"
                                            value={formData.valor_compra}
                                            onChange={(e) => setFormData({ ...formData, valor_compra: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[20px] font-bold hover:bg-gray-100 transition-all active:scale-95">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-indigo-600 text-white rounded-[20px] font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                        Salvar Pneu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
