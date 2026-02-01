'use client'

import React, { useState, useEffect } from 'react'
import { Truck, Search, Gauge, Ruler, Camera, CheckCircle2, AlertCircle, Loader2, ChevronRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    axle_configuration: any[]
}

interface Tire {
    id: string
    serial_number: string
    brand: string
    model: string
}

interface InspectionItemData {
    tire_id: string
    tread_depth: number
    pressure: number
    status: 'ok' | 'warning' | 'critical'
    observations?: string
    photo_url?: string
    ai_analysis?: any
}

export default function NewInspectionPage() {
    const { user } = useAuth()
    const router = useRouter()
    const tenantId = user?.user_metadata?.tenant_id

    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Step 1: Vehicle Selection
    const [searchPlate, setSearchPlate] = useState('')
    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [odometer, setOdometer] = useState<number>(0)

    // Step 2: Inspection Data
    const [inspectedTires, setInspectedTires] = useState<Record<string, InspectionItemData>>({})
    const [activeTire, setActiveTire] = useState<{ id: string, position: string } | null>(null)

    const searchParams = useSearchParams()
    const plateParam = searchParams.get('plate')

    useEffect(() => {
        if (plateParam) {
            setSearchPlate(plateParam)
        }
    }, [plateParam])

    // IA/Photo State
    const [analyzing, setAnalyzing] = useState(false)

    const searchVehicle = async () => {
        if (!searchPlate || !tenantId) return
        setLoading(true)
        try {
            // 1. Tentar API
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${baseUrl}/api/v1/vehicles?tenant_id=${tenantId}&plate=${searchPlate.toUpperCase()}`)

            if (response.ok) {
                const data = await response.json()
                if (data && data.length > 0) {
                    setVehicle(data[0])
                    setOdometer(data[0].current_km || 0)
                    return
                }
            }

            // 2. Fallback para Offline (Dexie)
            const offlineVehicle = await db.vehicles
                .where('plate')
                .equals(searchPlate.toUpperCase())
                .and(v => v.tenant_id === tenantId)
                .first()

            if (offlineVehicle) {
                setVehicle(offlineVehicle as any)
                setOdometer(0) // No offline o KM pode estar desatualizado
            } else {
                alert('Veículo não encontrado (Online ou Offline)')
            }
        } catch (err) {
            console.warn('Erro ao buscar veículo online, tentando offline...', err)
            const offlineVehicle = await db.vehicles
                .where('plate')
                .equals(searchPlate.toUpperCase())
                .first()
            if (offlineVehicle) setVehicle(offlineVehicle as any)
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, tireId: string) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        setAnalyzing(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${baseUrl}/api/v1/inspections/analyze-damage?tenant_id=${tenantId}&tire_id=${tireId}`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) throw new Error('Erro na análise')
            const result = await response.json()

            // Atualizar dados do pneu ativo com a analise da IA
            setInspectedTires(prev => ({
                ...prev,
                [tireId]: {
                    ...prev[tireId],
                    photo_url: result.photo_url,
                    ai_analysis: result.analysis,
                    status: result.analysis.severity === 'baixa' ? 'ok' : result.analysis.severity === 'media' ? 'warning' : 'critical'
                }
            }))
        } catch (err) {
            console.error('Erro no upload/IA:', err)
        } finally {
            setAnalyzing(false)
        }
    }

    const saveTireData = (tireId: string, data: Partial<InspectionItemData>) => {
        setInspectedTires(prev => ({
            ...prev,
            [tireId]: {
                tire_id: tireId,
                tread_depth: prev[tireId]?.tread_depth || 0,
                pressure: prev[tireId]?.pressure || 0,
                status: prev[tireId]?.status || 'ok',
                ...data
            }
        }))
    }

    const finishInspection = async () => {
        if (!vehicle || !tenantId) return
        setSubmitting(true)

        const inspectionData = {
            id_uuid: uuidv4(),
            tenant_id: tenantId,
            vehicle_id: vehicle.id,
            inspector_id: user?.id || '',
            odometer_km: odometer,
            items: Object.values(inspectedTires),
            created_at: Date.now(),
            synced: 0
        }

        try {
            // Tentar enviar para o Backend
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${baseUrl}/api/v1/inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: inspectionData.tenant_id,
                    vehicle_id: inspectionData.vehicle_id,
                    inspector_id: inspectionData.inspector_id,
                    odometer_km: inspectionData.odometer_km,
                    items: inspectionData.items
                })
            })

            if (response.ok) {
                router.push('/dashboard/inspections')
                return
            }

            throw new Error('Servidor indisponível')

        } catch (err) {
            console.warn('Salvando inspeção localmente (Modo Offline)...', err)
            await db.pending_inspections.add(inspectionData)
            alert('Você está offline. A inspeção foi salva no dispositivo e será sincronizada assim que a internet voltar.')
            router.push('/dashboard/inspections')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-10 max-w-5xl mx-auto">
            {step === 1 ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="mb-12">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nova Inspeção</h1>
                        <p className="text-gray-400 font-medium">Inicie selecionando o veículo no pátio.</p>
                    </header>

                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col gap-8">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Placa do Veículo (ABC-1234)"
                                    value={searchPlate}
                                    onChange={(e) => setSearchPlate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[24px] py-5 px-8 font-black text-xl uppercase placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300" />
                            </div>
                            <button
                                onClick={searchVehicle}
                                disabled={loading}
                                className="bg-indigo-600 text-white px-10 rounded-[24px] font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Buscar'}
                            </button>
                        </div>

                        {vehicle && (
                            <div className="bg-indigo-50/50 rounded-[32px] p-8 animate-in zoom-in-95 duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Truck size={40} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Veículo Identificado</p>
                                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{vehicle.plate}</h2>
                                            <p className="text-gray-500 font-bold">{vehicle.brand} {vehicle.model}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hodômetro Atual (KM)</p>
                                        <input
                                            type="number"
                                            value={odometer}
                                            onChange={(e) => setOdometer(parseFloat(e.target.value))}
                                            className="bg-white border-2 border-indigo-100 rounded-2xl py-3 px-6 text-right font-black text-2xl text-indigo-600 focus:outline-none focus:border-indigo-600 transition-all w-48 shadow-inner"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                >
                                    Iniciar Checklist de Pneus <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <header className="mb-10 flex items-center justify-between">
                        <button onClick={() => setStep(1)} className="p-3 bg-white rounded-2xl text-gray-400 hover:text-gray-900 shadow-sm border border-gray-50 transition-all">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{vehicle?.plate}</h2>
                            <p className="text-gray-400 font-medium text-sm">Inspeção Técnica de Pneus</p>
                        </div>
                        <div className="w-12"></div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Diagrama de Eixos (Simplificado p/ visualização) */}
                        <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm flex flex-col items-center gap-12">
                            <div className="w-32 h-16 bg-gray-100 rounded-t-3xl border-b-4 border-gray-200"></div>
                            {vehicle?.axle_configuration.map((axle: any) => (
                                <div key={axle.id} className="relative w-full flex flex-col items-center gap-6">
                                    <div className="h-3 bg-gray-200 rounded-full w-full mx-10"></div>
                                    <div className="absolute left-0 flex gap-1">
                                        {axle.tires.slice(0, axle.is_dual ? 2 : 1).map((tireId: string, idx: number) => (
                                            <TireButton
                                                key={`L-${idx}`}
                                                id={tireId}
                                                inspected={!!inspectedTires[tireId]}
                                                active={activeTire?.id === tireId}
                                                onClick={() => setActiveTire({ id: tireId, position: `Eixo ${axle.id} Esq` })}
                                            />
                                        ))}
                                    </div>
                                    <div className="absolute right-0 flex gap-1">
                                        {axle.tires.slice(axle.is_dual ? 2 : 1).map((tireId: string, idx: number) => (
                                            <TireButton
                                                key={`R-${idx}`}
                                                id={tireId}
                                                inspected={!!inspectedTires[tireId]}
                                                active={activeTire?.id === tireId}
                                                onClick={() => setActiveTire({ id: tireId, position: `Eixo ${axle.id} Dir` })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formulário do Pneu Ativo */}
                        <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                            {activeTire ? (
                                <div className="p-8 flex-1 flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
                                    <header>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeTire.position}</p>
                                        <h3 className="text-2xl font-black text-gray-900">Diagnóstico do Pneu</h3>
                                    </header>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase">
                                                <Ruler size={14} /> Sulco (mm)
                                            </div>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inspectedTires[activeTire.id]?.tread_depth || ''}
                                                onChange={(e) => saveTireData(activeTire.id, { tread_depth: parseFloat(e.target.value) })}
                                                placeholder="0.0"
                                                className="bg-transparent text-2xl font-black text-gray-900 border-none focus:ring-0 p-0"
                                            />
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase">
                                                <Gauge size={14} /> Pressão (PSI)
                                            </div>
                                            <input
                                                type="number"
                                                value={inspectedTires[activeTire.id]?.pressure || ''}
                                                onChange={(e) => saveTireData(activeTire.id, { pressure: parseFloat(e.target.value) })}
                                                placeholder="0"
                                                className="bg-transparent text-2xl font-black text-gray-900 border-none focus:ring-0 p-0"
                                            />
                                        </div>
                                    </div>

                                    {/* Upload de Foto / IA Vision */}
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="damage-photo"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handlePhotoUpload(e, activeTire.id)}
                                        />
                                        <label
                                            htmlFor="damage-photo"
                                            className={`w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${inspectedTires[activeTire.id]?.photo_url ? 'border-none p-0' : 'border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 group'}`}
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">IA Analisando...</p>
                                                </>
                                            ) : inspectedTires[activeTire.id]?.photo_url ? (
                                                <div className="relative w-full h-full rounded-3xl overflow-hidden group">
                                                    <img
                                                        src={inspectedTires[activeTire.id]?.photo_url}
                                                        className="w-full h-full object-cover"
                                                        alt="Avaria"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2">
                                                        <Camera size={20} /> Alterar Foto
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        <Camera size={32} />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Foto da Avaria (Opcional)</p>
                                                </>
                                            )}
                                        </label>

                                        {inspectedTires[activeTire.id]?.ai_analysis && (
                                            <div className="mt-4 p-6 bg-indigo-600 text-white rounded-3xl shadow-lg animate-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Diagnóstico IA</span>
                                                </div>
                                                <p className="font-bold text-sm">{inspectedTires[activeTire.id].ai_analysis.observations}</p>
                                                <div className="mt-3 flex gap-2">
                                                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight">
                                                        Severidade: {inspectedTires[activeTire.id].ai_analysis.severity}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <textarea
                                        placeholder="Observações adicionais..."
                                        value={inspectedTires[activeTire.id]?.observations || ''}
                                        onChange={(e) => saveTireData(activeTire.id, { observations: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[24px] p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px] resize-none"
                                    ></textarea>

                                    <button
                                        onClick={() => setActiveTire(null)}
                                        className="mt-auto w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                    >
                                        Concluir Diagnóstico deste Pneu
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 gap-6">
                                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center shadow-inner">
                                        <AlertCircle size={40} className="text-gray-200" />
                                    </div>
                                    <div>
                                        <p className="font-black text-xl text-gray-900 tracking-tight">Selecione um pneu</p>
                                        <p className="font-medium mt-1">Clique em qualquer pneu no diagrama ao lado para iniciar a medição técnica.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <footer className="mt-12 flex items-center justify-between bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm">
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inspecionados</p>
                                <p className="font-black text-2xl text-emerald-600">{Object.keys(inspectedTires).length}</p>
                            </div>
                            <div className="w-px h-10 bg-gray-100"></div>
                            <div className="text-center px-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Restantes</p>
                                <p className="font-black text-2xl text-rose-300">
                                    {(vehicle?.axle_configuration.reduce((acc: number, axle: any) => acc + (axle.is_dual ? 4 : 2), 0) || 0) - Object.keys(inspectedTires).length}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={finishInspection}
                            disabled={submitting || Object.keys(inspectedTires).length === 0}
                            className="bg-indigo-600 text-white px-12 py-5 rounded-[24px] font-black tracking-tight flex items-center gap-3 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                            FINALIZAR INSPEÇÃO COMPLETA
                        </button>
                    </footer>
                </div>
            )}
        </div>
    )
}

function TireButton({ id, inspected, active, onClick }: { id: string, inspected: boolean, active: boolean, onClick: () => void }) {
    if (!id) return null
    return (
        <button
            onClick={onClick}
            className={`w-10 h-16 rounded-lg border-2 relative transition-all active:scale-95 shadow-lg ${active ? 'bg-indigo-600 border-indigo-400 ring-4 ring-indigo-100 scale-110 z-10' :
                inspected ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-900 border-gray-800 hover:border-indigo-500'
                }`}
        >
            {inspected && !active && <CheckCircle2 className="text-white absolute inset-0 m-auto" size={16} />}
            <div className="absolute top-0 bottom-0 left-1 w-[1px] bg-white/5"></div>
            <div className="absolute top-0 bottom-0 right-1 w-[1px] bg-white/5"></div>
        </button>
    )
}
