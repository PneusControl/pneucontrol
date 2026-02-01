'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Building2, Phone, Mail, MoreHorizontal, Edit2, Trash2, Loader2, Filter } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Supplier {
    id: string
    name: string
    cnpj: string
    contact_name?: string
    email?: string
    phone?: string
    created_at: string
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { user } = useAuth()

    useEffect(() => {
        if (user?.user_metadata?.tenant_id) {
            fetchSuppliers()
        }
    }, [user])

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/suppliers?tenant_id=${user.user_metadata.tenant_id}`)
            const data = await response.json()
            setSuppliers(data)
        } catch (err) {
            console.error('Erro ao buscar fornecedores:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.cnpj.includes(search)
    )

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
                    <p className="text-gray-400 text-sm font-medium">Gestão de parceiros e histórico de compras</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold">
                    <Plus size={20} /> Novo Fornecedor
                </button>
            </header>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
                        placeholder="Buscar por nome ou CNPJ..."
                    />
                </div>
                <button className="px-6 bg-white border border-gray-100 rounded-2xl flex items-center gap-2 text-gray-500 font-bold hover:bg-gray-50 transition-all">
                    <Filter size={18} /> Filtros
                </button>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fornecedor</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contato</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cadastrado em</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{supplier.name}</p>
                                            <p className="text-xs text-gray-400 font-medium">{supplier.cnpj}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={14} className="text-gray-400" />
                                            <span className="text-xs font-medium">{supplier.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={14} className="text-gray-400" />
                                            <span className="text-xs font-medium">{supplier.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                                    {new Date(supplier.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                        <Edit2 size={18} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-2">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                    <p className="text-gray-400 font-medium">Nenhum fornecedor encontrado.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
