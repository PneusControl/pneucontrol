'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Building2, Phone, Mail, MoreHorizontal, Edit2, Trash2, Loader2, Filter, X, Check } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import CNPJSearch from '@/components/admin/CNPJSearch'

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
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const { user } = useAuth()

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        contact_name: '',
        email: '',
        phone: ''
    })

    const tenantId = user?.user_metadata?.tenant_id

    useEffect(() => {
        console.log('📦 SuppliersPage: Checking tenantId...', tenantId)
        if (tenantId) {
            fetchSuppliers()
        } else {
            console.warn('⚠️ SuppliersPage: No tenantId found for user')
            setLoading(false)
        }
    }, [tenantId])

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers?tenant_id=${tenantId}`)
            const data = await response.json()
            setSuppliers(data)
        } catch (err) {
            console.error('Erro ao buscar fornecedores:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCnpjSuccess = (data: any) => {
        setFormData({
            ...formData,
            razao_social: data.razao_social || data.nome_fantasia,
            nome_fantasia: data.nome_fantasia || '',
            cnpj: data.cnpj,
            contato_email: data.email || '',
            contato_telefone: data.telefone || ''
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, tenant_id: user?.user_metadata?.tenant_id })
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({ razao_social: '', cnpj: '', nome_fantasia: '', contato_nome: '', contato_email: '', contato_telefone: '' });
                fetchSuppliers();
            } else {
                alert('Erro ao salvar fornecedor.')
            }
        } catch (err) {
            console.error('Erro ao salvar:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleEditSupplier = (supplier: Supplier) => {
        setFormData({
            razao_social: supplier.name,
            cnpj: supplier.cnpj,
            nome_fantasia: '',
            contato_nome: supplier.contact_name || '',
            contato_email: supplier.email || '',
            contato_telefone: supplier.phone || ''
        })
        setIsModalOpen(true)
    }

    const handleDeleteSupplier = async (supplierId: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o fornecedor "${name}"? Esta ação não pode ser desfeita.`)) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/${supplierId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchSuppliers()
            } else {
                alert('Erro ao excluir fornecedor.')
            }
        } catch (err) {
            console.error('Erro ao excluir:', err)
            alert('Erro ao excluir fornecedor.')
        } finally {
            setLoading(false)
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.cnpj.includes(search)
    )

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Carregando parceiros...</p>
        </div>
    )

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fornecedores</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Gestão inteligente de parceiros e histórico de compras</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all font-bold active:scale-95"
                >
                    <Plus size={20} /> Novo Fornecedor
                </button>
            </header>

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
                        placeholder="Buscar por nome, marca ou CNPJ..."
                    />
                </div>
                <button className="px-8 bg-white border border-gray-100 rounded-[24px] flex items-center gap-3 text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm">
                    <Filter size={18} className="text-indigo-500" /> Filtros Avançados
                </button>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-gray-100/50 border border-gray-50">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fornecedor</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contato Direto</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Data Registro</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-800 leading-tight mb-1">{supplier.razao_social}</p>
                                            <p className="text-xs text-gray-400 font-bold tracking-wider uppercase">{supplier.cnpj}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                                                <Mail size={12} className="text-gray-400" />
                                            </div>
                                            <span className="text-xs font-semibold">{supplier.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                                                <Phone size={12} className="text-gray-400" />
                                            </div>
                                            <span className="text-xs font-semibold">{supplier.contato_telefone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">
                                        {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEditSupplier(supplier)}
                                            className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm hover:shadow-indigo-100"
                                            title="Editar fornecedor"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                                            className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow-rose-100"
                                            title="Excluir fornecedor"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-10 py-32 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                                            <Building2 size={40} />
                                        </div>
                                        <p className="text-gray-400 font-bold text-lg">Nenhum fornecedor encontrado</p>
                                        <p className="text-gray-300 text-sm mt-1">Comece adicionando seu primeiro parceiro comercial.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Fornecedor</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Cadastro Inteligente de Parceiros</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10">
                            <CNPJSearch onSuccess={handleCnpjSuccess} />

                            <div className="h-px bg-gray-100 my-10 relative">
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Dados do Fornecedor</span>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-indigo-600">Razão Social / Nome Fantasia</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.razao_social}
                                            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300"
                                            placeholder="Ex: Pneus Siqueira Campos LTDA"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Comercial</label>
                                        <input
                                            type="email"
                                            value={formData.contato_email}
                                            onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300"
                                            placeholder="vendas@fornecedor.com.br"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.contato_telefone}
                                            onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[20px] font-bold hover:bg-gray-100 transition-all active:scale-95"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-[20px] font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                        Salvar Fornecedor
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
