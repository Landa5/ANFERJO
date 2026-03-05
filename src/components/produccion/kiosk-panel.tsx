'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Square, Check, ArrowLeft, Loader2, User, Package, Box } from 'lucide-react'
import { toast } from 'sonner'
import { getActiveLogsForUser, startProductionAction, endProductionAction } from '@/actions/kiosk'

type KioskStep = 'USER' | 'ACTION' | 'PRODUCT_START' | 'PRODUCT_END' | 'QUANTITY_END' | 'CONFIRM'

interface KioskPanelProps {
    users: any[]
    references: any[]
}

export default function KioskPanel({ users, references }: KioskPanelProps) {
    const [step, setStep] = useState<KioskStep>('USER')
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [actionType, setActionType] = useState<'START' | 'END' | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<any>(null) // this is reference or activeLog array element
    const [quantity, setQuantity] = useState<number | ''>('')
    const [activeLogs, setActiveLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const resetFlow = () => {
        setStep('USER')
        setSelectedUser(null)
        setActionType(null)
        setSelectedProduct(null)
        setQuantity('')
        setActiveLogs([])
    }

    const selectUser = async (user: any) => {
        setSelectedUser(user)
        setStep('ACTION')
    }

    const selectAction = async (type: 'START' | 'END') => {
        setActionType(type)
        if (type === 'START') {
            setStep('PRODUCT_START')
        } else {
            setLoading(true)
            const { activeLogs, error } = await getActiveLogsForUser(selectedUser.id)
            setLoading(false)
            if (error) {
                toast.error('Error al cargar tareas activas: ' + error)
                return
            }
            if (!activeLogs || activeLogs.length === 0) {
                toast.error('No tienes ninguna producción iniciada.')
                return
            }
            setActiveLogs(activeLogs)
            setStep('PRODUCT_END')
        }
    }

    const handleConfirmStart = async () => {
        setLoading(true)
        const { error } = await startProductionAction(selectedUser.id, selectedProduct.id)
        setLoading(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('¡Producción Iniciada con éxito!')
            resetFlow()
        }
    }

    const handleConfirmEnd = async () => {
        if (!quantity || quantity <= 0) return toast.error('Debes introducir una cantidad válida.')
        setLoading(true)
        const { error } = await endProductionAction(selectedProduct.id, Number(quantity))
        setLoading(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('¡Producción finalizada exitosamente!')
            resetFlow()
        }
    }

    return (
        <Card className="w-full max-w-4xl bg-slate-800 border-slate-700 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between p-6">
                <div>
                    <CardTitle className="text-2xl text-white">Registro de Producción</CardTitle>
                    {selectedUser && (
                        <p className="text-emerald-400 font-semibold mt-1 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {selectedUser.full_name}
                            {actionType && <span>- {actionType === 'START' ? 'Iniciar +' : 'Finalizar ⬛'}</span>}
                        </p>
                    )}
                </div>
                {step !== 'USER' && (
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent" onClick={resetFlow}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-8">

                {/* ---------- STEP 1: ELEGIR USUARIO ---------- */}
                {step === 'USER' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-medium text-white mb-4">1. Elige tu usuario</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {users.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => selectUser(u)}
                                    className="p-4 bg-slate-700 hover:bg-emerald-600 focus:bg-emerald-600 focus:ring-4 ring-emerald-900 text-white rounded-xl transition-all font-semibold shadow flex flex-col items-center justify-center h-24"
                                >
                                    <span className="text-center">{u.full_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- STEP 2: ELEGIR ACCIÓN ---------- */}
                {step === 'ACTION' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-medium text-white mb-4">2. ¿Qué deseas hacer?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => selectAction('START')}
                                disabled={loading}
                                className="p-8 bg-blue-600 hover:bg-blue-500 rounded-2xl flex flex-col items-center justify-center text-white font-bold text-2xl shadow-lg transition-all h-64 disabled:opacity-50"
                            >
                                <Play className="w-20 h-20 mb-4 opacity-80" />
                                INICIAR PRODUCCIÓN
                            </button>

                            <button
                                onClick={() => selectAction('END')}
                                disabled={loading}
                                className="p-8 bg-amber-600 hover:bg-amber-500 rounded-2xl flex flex-col items-center justify-center text-white font-bold text-2xl shadow-lg transition-all h-64 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-20 h-20 mb-4 animate-spin opacity-80" /> : <Square className="w-20 h-20 mb-4 opacity-80 fill-current" />}
                                FINALIZAR PRODUCCIÓN
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------- STEP 3A: ELEGIR PRODUCTO PARA INICIAR ---------- */}
                {step === 'PRODUCT_START' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-medium text-white mb-4">3. ¿Qué producto vas a iniciar?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {references.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedProduct(r)
                                        setStep('CONFIRM')
                                    }}
                                    className="p-4 bg-slate-700 hover:bg-blue-600 border border-slate-600 rounded-xl text-left transition-colors flex items-start gap-3 h-28"
                                >
                                    <Package className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                    <span className="text-white font-medium">{r.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- STEP 3B: ELEGIR TAREA ACTIVA PARA FINALIZAR ---------- */}
                {step === 'PRODUCT_END' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-medium text-white mb-4">3. Selecciona la producción que vas a finalizar</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeLogs.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => {
                                        setSelectedProduct(log) // actually the log object
                                        setStep('QUANTITY_END')
                                    }}
                                    className="p-6 bg-slate-700 hover:bg-amber-600 border border-slate-600 rounded-xl text-left transition-colors flex items-start gap-4"
                                >
                                    <Box className="w-8 h-8 text-amber-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-bold text-lg mb-1">{log.reference?.name || 'Producto Desconocido'}</p>
                                        <p className="text-slate-400 text-sm">
                                            Iniciada: {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- STEP 4B: CANTIDAD PARA FINALIZAR ---------- */}
                {step === 'QUANTITY_END' && (
                    <div className="space-y-8 max-w-md mx-auto py-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Introducir Cantidad</h2>
                            <p className="text-slate-400">Producto: {selectedProduct?.reference?.name}</p>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-2xl shadow-inner text-center">
                            <Label className="text-slate-400 text-lg mb-4 block">Unidades realizadas</Label>
                            <Input
                                type="number"
                                autoFocus
                                className="text-6xl text-center h-24 bg-slate-950 border-slate-700 text-white placeholder-slate-800"
                                placeholder="0"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        <Button
                            className="w-full h-16 text-xl bg-amber-600 hover:bg-amber-500 font-bold"
                            disabled={!quantity || quantity <= 0}
                            onClick={() => setStep('CONFIRM')}
                        >
                            Continuar
                        </Button>
                    </div>
                )}

                {/* ---------- PANTALLA CONFIRMACIÓN ---------- */}
                {step === 'CONFIRM' && (
                    <div className="space-y-8 max-w-lg mx-auto py-6">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Confirma los datos</h2>
                            <p className="text-slate-400">Verifica que todo sea correcto antes de guardar.</p>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 space-y-4 shadow-inner">
                            <div className="flex justify-between border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Trabajador</span>
                                <span className="font-semibold text-white">{selectedUser?.full_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Acción</span>
                                <span className={`font-bold ${actionType === 'START' ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {actionType === 'START' ? 'INICIAR TAREA' : 'FINALIZAR TAREA'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Producto</span>
                                <span className="font-semibold text-white">
                                    {actionType === 'START' ? selectedProduct?.name : selectedProduct?.reference?.name}
                                </span>
                            </div>
                            {actionType === 'END' && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Unidades Realizadas</span>
                                    <span className="font-black text-2xl text-emerald-400">{quantity}</span>
                                </div>
                            )}
                        </div>

                        <Button
                            className={`w-full h-16 text-xl font-bold ${actionType === 'START' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                            onClick={actionType === 'START' ? handleConfirmStart : handleConfirmEnd}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Check className="w-6 h-6 mr-3" />}
                            ¡CONFIRMAR Y GUARDAR!
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
