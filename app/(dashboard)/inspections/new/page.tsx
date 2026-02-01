'use client'

import React, { useState } from 'react'
import { Truck, Activity, Ruler, Camera, ChevronRight, CheckCircle2, AlertTriangle, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function InspectionPage() {
    const [step, setStep] = useState(1) // 1: Selecionar Veiculo, 2: Medir Sulcos, 3: Fotos/Avarias
    const [loading, setLoading] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
    const [treadData, setTreadData] = useState<Record<string, string>>({})
    const { user } = useAuth()

    const handleStartInspection = (vehicle: any) => {
        setSelectedVehicle(vehicle)
        setStep(2)
    }

    const handleSaveTread = async () => {
        setLoading(true)
        // Simular salvamento
        setTimeout(() => {
            setLoading(false)
            setStep(3)
        }, 1500)
    }

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-gray-800">Nova Inspeção</h1>
                <p className="text-gray-400 font-medium font-sans">Siga os passos para validar a segurança da frota.</p>

                {/* Progress Bar */}
                <div className="mt-8 flex gap-4">
                    <ProgressBadge active={step >= 1} label="Veículo" activeLabel="1" />
                    <div className="flex-1 h-px bg-gray-100 self-center"></div>
                    <ProgressBadge active={step >= 2} label="Sulcos" activeLabel="2" />
                    <div className="flex-1 h-px bg-gray-100 self-center"></div>
                    <ProgressBadge active={step >= 3} label="Avarias/IA" activeLabel="3" />
                </div>
            </header>

            {step === 1 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Selecione o Veículo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Exemplo de card de veiculo */}
                        <div
                            onClick={() => handleStartInspection({ plate: 'ABC-1234', model: 'VW 24.280', id: '1' })}
                            className="bg-white border border-gray-100 p-6 rounded-[32px] cursor-pointer hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 uppercase tracking-widest">ABC-1234</p>
                                    <p className="text-xs text-gray-400 font-medium">VW 24.280 — Constellation</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="space-y-10">
                    <div className="bg-white border border-gray-100 p-8 rounded-[40px] shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                            <Ruler className="text-indigo-600" /> Medição de Sulcos (mm)
                        </h2>

                        {/* Diagrama de Veiculo (Simplificado) */}
                        <div className="flex flex-col items-center gap-10">
                            {/* Eixo Dianteiro */}
                            <div className="flex gap-40">
                                <TireInput label="ED" value={treadData['1'] || ''} onChange={(v) => setTreadData({ ...treadData, '1': v })} />
                                <TireInput label="EE" value={treadData['2'] || ''} onChange={(v) => setTreadData({ ...treadData, '2': v })} />
                            </div>
                            {/* Chassi */}
                            <div className="w-1.5 h-32 bg-gray-100 rounded-full"></div>
                            {/* Eixo Traseiro */}
                            <div className="flex gap-20">
                                <div className="flex gap-2">
                                    <TireInput label="TDE" value={treadData['3'] || ''} onChange={(v) => setTreadData({ ...treadData, '3': v })} />
                                    <TireInput label="TDI" value={treadData['4'] || ''} onChange={(v) => setTreadData({ ...treadData, '4': v })} />
                                </div>
                                <div className="flex gap-2">
                                    <TireInput label="TEI" value={treadData['5'] || ''} onChange={(v) => setTreadData({ ...treadData, '5': v })} />
                                    <TireInput label="TEE" value={treadData['6'] || ''} onChange={(v) => setTreadData({ ...treadData, '6': v })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveTread}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Salvar Medições e Continuar'} <ChevronRight size={20} />
                    </button>
                </section>
            )}

            {step === 3 && (
                <section className="space-y-8">
                    <div className="bg-indigo-600 rounded-[40px] p-10 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Análise de Avarias por IA</h2>
                            <p className="text-indigo-100/70 font-medium">Tire uma foto clara do pneu para que nossa IA identifique cortes ou bolhas.</p>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Camera size={32} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center hover:border-indigo-600 transition-all cursor-pointer group">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                                <Upload className="text-gray-300 group-hover:text-indigo-600" />
                            </div>
                            <p className="font-bold text-gray-800">Clique para subir foto</p>
                            <p className="text-xs text-gray-400 font-medium mt-1">Formatos aceitos: JPG, PNG (max 10MB)</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
                            <div className="flex items-center gap-3 text-emerald-500 font-bold mb-4">
                                <CheckCircle2 size={20} /> Status do Sistema
                            </div>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed mb-8">
                                O motor de predição está calibrado e aguardando as fotos finais para calcular o CPK estimado deste veículo.
                            </p>
                            <button className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Save size={18} /> Finalizar Inspecao
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

function ProgressBadge({ active, label, activeLabel }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {activeLabel}
            </div>
            <span className={`font-bold text-sm tracking-tight ${active ? 'text-gray-800' : 'text-gray-300'}`}>{label}</span>
        </div>
    )
}

function TireInput({ label, value, onChange }: any) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-16 bg-gray-800 rounded-lg flex items-center justify-center shadow-xl border-b-4 border-black group">
                <span className="text-[10px] text-white font-bold opacity-30 group-hover:opacity-100 transition-opacity uppercase">{label}</span>
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-14 bg-gray-50 border border-gray-100 rounded-xl py-2 text-center text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                placeholder="0.0"
            />
        </div>
    )
}
