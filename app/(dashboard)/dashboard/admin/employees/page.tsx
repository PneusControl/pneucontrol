'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Plus, Search, Filter, MoreHorizontal,
    Mail, Shield, CheckCircle2, XCircle, Edit2,
    Trash2, Save, X, ChevronRight, Menu
} from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/components/providers/AuthProvider'

const AVAILABLE_MENUS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'fleet', label: 'Frota Ativa', icon: 'Truck' },
    { id: 'tires', label: 'Estoque de Pneus', icon: 'Package' },
    { id: 'reports', label: 'Relatórios', icon: 'FileText' },
    { id: 'inspections', label: 'Inspeções', icon: 'ClipboardList' },
    { id: 'maintenance', label: 'Manutenções', icon: 'Settings' }
]

export default function EmployeesPage() {
    const { user: currentUser } = useAuth()
    const supabase = createClient()

    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form state
    const [editingEmployee, setEditingEmployee] = useState<any>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'operator',
        is_active: true,
        permissions: [] as string[]
    })

    useEffect(() => {
        fetchEmployees()
    }, [currentUser])

    const fetchEmployees = async () => {
        if (!currentUser?.user_metadata?.tenant_id) return

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('tenant_id', currentUser.user_metadata.tenant_id)
                .order('full_name')

            if (error) throw error
            setEmployees(data || [])
        } catch (err) {
            console.error('Erro ao buscar funcionários:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (employee: any = null) => {
        if (employee) {
            setEditingEmployee(employee)
            setFormData({
                full_name: employee.full_name,
                email: employee.email,
                role: employee.role,
                is_active: employee.is_active,
                permissions: employee.permissions || []
            })
        } else {
            setEditingEmployee(null)
            setFormData({
                full_name: '',
                email: '',
                role: 'operator',
                is_active: true,
                permissions: []
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingEmployee) {
                const { error } = await supabase
                    .from('users')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        is_active: formData.is_active,
                        permissions: formData.permissions,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingEmployee.id)

                if (error) throw error
            } else {
                // In a real app, you'd use a service / edge function to create the auth user too
                const { error } = await supabase
                    .from('users')
                    .insert([{
                        tenant_id: currentUser.user_metadata.tenant_id,
                        full_name: formData.full_name,
                        email: formData.email,
                        role: formData.role,
                        is_active: formData.is_active,
                        permissions: formData.permissions
                    }])

                if (error) throw error
            }

            setIsModalOpen(false)
            fetchEmployees()
        } catch (err) {
            console.error('Erro ao salvar funcionário:', err)
            alert('Erro ao salvar funcionário. Verifique o console.')
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = (menuId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(menuId)
                ? prev.permissions.filter(p => p !== menuId)
                : [...prev.permissions, menuId]
        }))
    }

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8F9FD]">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} />
                        Gestão de Colaboradores
                    </h1>
                    <p className="text-gray-400 font-medium text-sm mt-1">Gerencie sua equipe e níveis de acesso</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={20} /> Novo Funcionário
                </button>
            </header>

            {/* Filters & Search */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-6 py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-all">
                    <Filter size={18} /> Filtros
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Nível</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Permissões</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">Carregando...</td>
                            </tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">Nenhum funcionário encontrado.</td>
                            </tr>
                        ) : filteredEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg">
                                            {emp.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 leading-none mb-1">{emp.full_name}</p>
                                            <p className="text-gray-400 text-sm font-medium">{emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${emp.role === 'admin' ? 'bg-amber-50 text-amber-600' :
                                            emp.role === 'manager' ? 'bg-indigo-50 text-indigo-600' :
                                                'bg-gray-100 text-gray-500'
                                        }`}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex justify-center">
                                        {emp.is_active ?
                                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div> Ativo
                                            </span> :
                                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-black uppercase">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Inativo
                                            </span>
                                        }
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex justify-center flex-wrap gap-1 max-w-[200px] mx-auto">
                                        {emp.permissions?.length > 0 ? (
                                            emp.permissions.slice(0, 3).map((p: string) => (
                                                <div key={p} className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center text-[10px] font-bold text-gray-500" title={p}>
                                                    {p.charAt(0).toUpperCase()}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-gray-300 font-black italic">Nenhuma</span>
                                        )}
                                        {emp.permissions?.length > 3 && (
                                            <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                +{emp.permissions.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => handleOpenModal(emp)}
                                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        <header className="px-10 py-8 bg-indigo-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
                                </h3>
                                <p className="text-indigo-100/80 font-medium text-sm">Configure o acesso e perfil</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                        <input
                                            required
                                            disabled={!!editingEmployee}
                                            type="email"
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-50"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="joao@empresa.com.br"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Função</label>
                                            <select
                                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none"
                                                value={formData.role}
                                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                            >
                                                <option value="operator">Operador</option>
                                                <option value="manager">Gestor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={formData.is_active}
                                                    className="w-5 h-5 rounded-lg border-2 border-gray-100 text-indigo-600 focus:ring-0 transition-all"
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                                />
                                                <label htmlFor="is_active" className="font-bold text-gray-700 cursor-pointer select-none">Ativo</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Shield size={16} /> Permissões de Menu
                                    </label>
                                    <div className="bg-gray-50 rounded-3xl p-6 grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto no-scrollbar">
                                        {AVAILABLE_MENUS.map(menu => (
                                            <button
                                                key={menu.id}
                                                type="button"
                                                onClick={() => togglePermission(menu.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.permissions.includes(menu.id)
                                                        ? 'bg-white border-indigo-600/20 text-indigo-600 shadow-sm'
                                                        : 'border-transparent text-gray-400 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <span className="font-black text-sm">{menu.label}</span>
                                                {formData.permissions.includes(menu.id) ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <footer className="flex gap-4">
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
                                    {loading ? 'Salvando...' : editingEmployee ? 'Salvar Alterações' : 'Cadastrar agora'}
                                    <Save size={20} />
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
