'use client'

import React, { useState } from 'react'
import { Plus, Minus, Info, Save, RotateCcw, X } from 'lucide-react'

interface Tire {
    id: string
    serial_number: string
    brand: string
}

interface Axle {
    id: number
    type: 'dir' | 'traction' | 'load'
    is_dual: boolean
    tires: (string | null)[] // IDs dos pneus montados
}

interface AxleConfigBuilderProps {
    initialAxles?: Axle[]
    availableTires?: Tire[]
    onSave: (axles: Axle[]) => void
}

export default function AxleConfigBuilder({ initialAxles, availableTires = [], onSave }: AxleConfigBuilderProps) {
    // Templates predefinidos de configurações de eixos comuns
    const axleTemplates: { [key: string]: { name: string, description: string, axles: Axle[] } } = {
        '4x2': {
            name: '4x2 (Toco)',
            description: '1 eixo dianteiro + 1 eixo tração',
            axles: [
                { id: 1, type: 'dir', is_dual: false, tires: [null, null] },
                { id: 2, type: 'traction', is_dual: true, tires: [null, null, null, null] }
            ]
        },
        '6x2': {
            name: '6x2 (Truck)',
            description: '1 eixo dianteiro + 2 eixos (1 tração + 1 carga)',
            axles: [
                { id: 1, type: 'dir', is_dual: false, tires: [null, null] },
                { id: 2, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 3, type: 'load', is_dual: true, tires: [null, null, null, null] }
            ]
        },
        '6x4': {
            name: '6x4 (Bi-Truck)',
            description: '1 eixo dianteiro + 2 eixos tração',
            axles: [
                { id: 1, type: 'dir', is_dual: false, tires: [null, null] },
                { id: 2, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 3, type: 'traction', is_dual: true, tires: [null, null, null, null] }
            ]
        },
        'bitrem': {
            name: 'Bitrem (7 eixos)',
            description: 'Cavalo 6x4 + 2 semi-reboques de 2 eixos',
            axles: [
                { id: 1, type: 'dir', is_dual: false, tires: [null, null] },
                { id: 2, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 3, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 4, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 5, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 6, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 7, type: 'load', is_dual: true, tires: [null, null, null, null] }
            ]
        },
        'rodotrem': {
            name: 'Rodotrem (9 eixos)',
            description: 'Cavalo 6x4 + 2 semi-reboques de 3 eixos',
            axles: [
                { id: 1, type: 'dir', is_dual: false, tires: [null, null] },
                { id: 2, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 3, type: 'traction', is_dual: true, tires: [null, null, null, null] },
                { id: 4, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 5, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 6, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 7, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 8, type: 'load', is_dual: true, tires: [null, null, null, null] },
                { id: 9, type: 'load', is_dual: true, tires: [null, null, null, null] }
            ]
        }
    }

    const [axles, setAxles] = useState<Axle[]>(initialAxles || [
        { id: 1, type: 'dir', is_dual: false, tires: [null, null] }
    ])
    const [selecting, setSelecting] = useState<{ axleId: number, index: number } | null>(null)

    const applyTemplate = (templateKey: string) => {
        const template = axleTemplates[templateKey]
        if (template) {
            setAxles(template.axles.map(axle => ({ ...axle, tires: axle.tires.map(() => null) })))
        }
    }

    const addAxle = () => {
        const nextId = axles.length + 1
        setAxles([...axles, { id: nextId, type: 'load', is_dual: true, tires: [null, null, null, null] }])
    }

    const removeAxle = () => {
        if (axles.length > 1) {
            setAxles(axles.slice(0, -1))
        }
    }

    const toggleDual = (id: number) => {
        setAxles(axles.map(axle => {
            if (axle.id === id) {
                const is_dual = !axle.is_dual
                return {
                    ...axle,
                    is_dual,
                    tires: is_dual ? [null, null, null, null] : [null, null]
                }
            }
            return axle
        }))
    }

    const changeType = (id: number, type: 'dir' | 'traction' | 'load') => {
        setAxles(axles.map(axle => axle.id === id ? { ...axle, type } : axle))
    }

    const selectTire = (tireId: string) => {
        if (!selecting) return
        setAxles(axles.map(axle => {
            if (axle.id === selecting.axleId) {
                const newTires = [...axle.tires]
                newTires[selecting.index] = tireId
                return { ...axle, tires: newTires }
            }
            return axle
        }))
        setSelecting(null)
    }

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 flex flex-col gap-8 relative">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Configurador de Eixos</h2>
                    <p className="text-gray-400 text-sm font-medium">Monte o layout do veículo e vincule os pneus</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Template selector */}
                    <select
                        onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                        className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled>📋 Usar Template</option>
                        {Object.entries(axleTemplates).map(([key, template]) => (
                            <option key={key} value={key}>{template.name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={removeAxle} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><Minus size={20} /></button>
                        <button onClick={addAxle} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 transition-colors"><Plus size={20} /></button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col items-center gap-12 py-12 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <div className="w-32 h-20 bg-gray-300 rounded-t-3xl relative mb-[-32px] shadow-inner">
                    <div className="absolute top-4 left-6 right-6 h-3 bg-white/40 rounded-full"></div>
                </div>

                {axles.map((axle) => (
                    <div key={axle.id} className="relative flex flex-col items-center w-full max-w-sm">
                        {/* Rodas esquerdas */}
                        <div className="absolute left-0 flex gap-1">
                            {axle.tires.slice(0, axle.is_dual ? 2 : 1).map((tireId, i) => (
                                <TireSlot
                                    key={`L-${i}`}
                                    serial={availableTires.find(t => t.id === tireId)?.serial_number}
                                    onClick={() => setSelecting({ axleId: axle.id, index: i })}
                                />
                            ))}
                        </div>

                        {/* Eixo */}
                        <div className={`h-3 bg-gray-300 rounded-full w-full mx-14 ${axle.type === 'traction' ? 'bg-indigo-400 shadow-lg shadow-indigo-100' : ''}`}></div>

                        {/* Rodas direitas */}
                        <div className="absolute right-0 flex gap-1">
                            {axle.tires.slice(axle.is_dual ? 2 : 1).map((tireId, i) => {
                                const realIndex = axle.is_dual ? i + 2 : i + 1
                                return (
                                    <TireSlot
                                        key={`R-${i}`}
                                        serial={availableTires.find(t => t.id === tireId)?.serial_number}
                                        onClick={() => setSelecting({ axleId: axle.id, index: realIndex })}
                                    />
                                )
                            })}
                        </div>

                        {/* Controles */}
                        <div className="mt-10 flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <button
                                onClick={() => toggleDual(axle.id)}
                                className={`px-3 py-1.5 rounded-lg border transition-all ${axle.is_dual ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                                {axle.is_dual ? 'Duplo' : 'Simples'}
                            </button>
                            <select
                                value={axle.type}
                                onChange={(e) => changeType(axle.id, e.target.value as any)}
                                className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 focus:outline-none shadow-sm"
                            >
                                <option value="dir">Direcional</option>
                                <option value="traction">Tração</option>
                                <option value="load">Carga</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Seleção de Pneu */}
            {selecting && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 rounded-[32px] p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Selecionar Pneu para {selecting.axleId}º Eixo</h3>
                        <button onClick={() => setSelecting(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {availableTires.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Info className="text-gray-300 mb-4" size={40} />
                                <p className="text-gray-500 font-bold">Nenhum pneu em estoque</p>
                                <p className="text-gray-400 text-xs mt-1">É necessário importar pneus antes de vinculá-los.</p>
                            </div>
                        ) : (
                            availableTires.map(tire => (
                                <button
                                    key={tire.id}
                                    onClick={() => selectTire(tire.id)}
                                    className="w-full bg-gray-50 p-4 rounded-xl flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="font-bold text-sm tracking-tighter uppercase">{tire.serial_number}</p>
                                        <p className="text-[10px] font-black text-gray-400 group-hover:text-indigo-400">{tire.brand}</p>
                                    </div>
                                    <Plus size={16} />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <footer className="mt-4 flex justify-end gap-3">
                <button className="px-6 py-3 border border-gray-100 rounded-2xl text-gray-400 font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <RotateCcw size={18} /> Resetar
                </button>
                <button
                    onClick={() => onSave(axles)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-bold flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Save size={20} /> Salvar Configuração
                </button>
            </footer>
        </div>
    )
}

function TireSlot({ serial, onClick }: { serial?: string, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`w-10 h-16 rounded-lg border-2 shadow-xl relative cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden ${serial ? 'bg-indigo-600 border-indigo-700 ring-2 ring-indigo-100' : 'bg-gray-900 border-gray-800 hover:border-indigo-500 hover:shadow-indigo-100'}`}
        >
            {serial ? (
                <>
                    <span className="text-[8px] font-bold text-white transform -rotate-90 whitespace-nowrap tracking-tight">{serial}</span>
                </>
            ) : (
                <Plus size={14} className="text-gray-600 group-hover:text-indigo-400" />
            )}

            {/* Sulcos */}
            <div className="absolute top-0 bottom-0 left-1 w-[1px] bg-white/5"></div>
            <div className="absolute top-0 bottom-0 right-1 w-[1px] bg-white/5"></div>
        </div>
    )
}
