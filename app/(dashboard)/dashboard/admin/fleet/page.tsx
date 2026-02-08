'use client'

import React, { useState, useEffect } from 'react'
import {
    Truck, Plus, Search, Filter, Edit2,
    Trash2, Save, X, Settings2, BarChart3,
    Calendar, Hash, Info, Gauge
} from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/components/providers/AuthProvider'
import AxleConfigBuilder from '@/components/fleet/AxleConfigBuilder'

export default function FleetPage() {
    const { user: currentUser } = useAuth()
    const supabase = createClient()

    const [vehicles, setVehicles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form state
    const [editingVehicle, setEditingVehicle] = useState<any>(null)
    const [formData, setFormData] = useState({
        placa: '',
        tipo: 'Trator',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        chassi: '',
        km_atual: 0,
        status: 'active',
        observacoes: '',
        axle_configuration: [] as any[]
    })

    useEffect(() => {
        fetchVehicles()
    }, [currentUser])

    const fetchVehicles = async () => {
        if (!currentUser?.user_metadata?.tenant_id) return

        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('tenant_id', currentUser.user_metadata.tenant_id)
                .order('placa')

            if (error) throw error
            setVehicles(data || [])
        } catch (err) {
            console.error('Erro ao buscar veículos:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (vehicle: any = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle)
            setFormData({
                placa: vehicle.placa,
                tipo: vehicle.tipo,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                ano: vehicle.ano,
                chassi: vehicle.chassi,
                km_atual: vehicle.km_atual,
                status: vehicle.status,
                observacoes: vehicle.observacoes || '',
                axle_configuration: Array.isArray(vehicle.axle_configuration) ? vehicle.axle_configuration : []
            })
        } else {
            setEditingVehicle(null)
            setFormData({
                placa: '',
                tipo: 'Trator',
                marca: '',
                modelo: '',
                ano: new Date().getFullYear(),
                chassi: '',
                km_atual: 0,
                status: 'active',
                observacoes: '',
                axle_configuration: [
                    { id: 1, type: 'dir', is_dual: false, tires: [null, null] }
                ]
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const vehicleData = {
                placa: formData.placa.toUpperCase(),
                tipo: formData.tipo,
                marca: formData.marca,
                modelo: formData.modelo,
                ano: formData.ano,
                chassi: formData.chassi,
                km_atual: formData.km_atual,
                status: formData.status,
                observacoes: formData.observacoes,
                axle_configuration: formData.axle_configuration,
                updated_at: new Date().toISOString()
            }

            if (editingVehicle) {
                const { error } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', editingVehicle.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('vehicles')
                    .insert([{
                        ...vehicleData,
                        tenant_id: currentUser.user_metadata.tenant_id
                    }])

                if (error) throw error
            }

            setIsModalOpen(false)
            fetchVehicles()
        } catch (err) {
            console.error('Erro ao salvar veículo:', err)
            alert('Erro ao salvar veículo. Verifique o console.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteVehicle = async (vehicleId: string, placa: string) => {
        if (!confirm(`Tem certeza que deseja excluir o veículo ${placa}? Esta ação não pode ser desfeita.`)) {
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', vehicleId)

            if (error) throw error

            fetchVehicles()
        } catch (err) {
            console.error('Erro ao excluir veículo:', err)
            alert('Erro ao excluir veículo. Verifique se não há pneus vinculados.')
        } finally {
            setLoading(false)
        }
    }

    const filteredVehicles = vehicles.filter(v =>
        (v.placa?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (v.modelo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8F9FD]">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Truck className="text-indigo-600" size={32} />
                        Gestão de Frota
                    </h1>
                    <p className="text-gray-400 font-medium text-sm mt-1">Gerencie os veículos e configurações de eixos</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={20} /> Novo Veículo
                </button>
            </header>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold">Carregando frota...</div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold">Nenhum veículo cadastrado.</div>
                ) : filteredVehicles.map((v) => (
                    <div key={v.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-indigo-100/20 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[60px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{v.tipo}</span>
                                    <h2 className="text-2xl font-black text-gray-900 mt-2">{v.placa}</h2>
                                    <p className="text-gray-400 font-bold text-sm">{v.marca} {v.modelo}</p>
                                </div>
                                <button
                                    onClick={() => handleOpenModal(v)}
                                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm border border-gray-50"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteVehicle(v.id, v.placa)}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-gray-50"
                                    title="Excluir veículo"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ano</p>
                                    <p className="font-black text-gray-700">{v.ano}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Km Atual</p>
                                    <p className="font-black text-gray-700">{v.km_atual?.toLocaleString() || '0'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <Settings2 size={16} className="text-indigo-600" />
                                    <span className="text-xs font-bold text-gray-500">{v.axle_configuration?.length || 0} Eixos</span>
                                </div>
                                <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${v.status === 'active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div> {v.status === 'active' ? 'Ativo' : v.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
                        <header className="px-10 py-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
                                </h3>
                                <p className="text-indigo-100/80 font-medium text-sm">Preencha os dados técnicos do caminhão</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* General Data */}
                                    <div className="space-y-8">
                                        <section>
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                <Info size={14} className="text-indigo-600" /> Identificação Básica
                                            </h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Placa</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all uppercase"
                                                        value={formData.placa}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
                                                        placeholder="ABC-1234"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                                                    <select
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none"
                                                        value={formData.tipo}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                                                    >
                                                        <option value="caminhao">Caminhão / Cavalo</option>
                                                        <option value="carreta">Carreta</option>
                                                        <option value="bitrem">Bitrem</option>
                                                        <option value="rodotrem">Rodotrem</option>
                                                        <option value="van">Van</option>
                                                        <option value="onibus">Ônibus</option>
                                                        <option value="outro">Outro</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                <Settings2 size={14} className="text-indigo-600" /> Detalhes Técnicos
                                            </h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2 col-span-2 md:col-span-1">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Marca</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                                        value={formData.marca}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                                                        placeholder="Ex: Scania, Volvo"
                                                    />
                                                </div>
                                                <div className="space-y-2 col-span-2 md:col-span-1">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Modelo</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                                        value={formData.modelo}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                                                        placeholder="Ex: R450, FH 540"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                                        value={formData.ano}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Km Atual</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                                        value={formData.km_atual}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, km_atual: parseFloat(e.target.value) }))}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Axle Configuration */}
                                    <div className="space-y-8">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <Gauge size={14} className="text-indigo-600" /> Configuração de Eixos
                                        </h4>
                                        <AxleConfigBuilder
                                            initialAxles={formData.axle_configuration}
                                            onSave={(axles) => setFormData(prev => ({ ...prev, axle_configuration: axles }))}
                                        />
                                    </div>
                                </div>

                                <footer className="pt-8 border-t border-gray-100 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-5 bg-gray-50 text-gray-500 rounded-3xl font-black hover:bg-gray-100 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Salvando...' : editingVehicle ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                                        <Save size={20} />
                                    </button>
                                </footer>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
