'use client'

import { useState, useEffect } from 'react'
import { clockIn, clockOut, startTask, endTask } from '@/actions/production'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Play, Square, LogIn, LogOut, Timer, Fish } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OperatorPanelProps {
    initialShift: any
    initialLog: any
    openLots: any[]
}

export default function OperatorPanel({ initialShift, initialLog, openLots }: OperatorPanelProps) {
    const safeOpenLots = Array.isArray(openLots) ? openLots : []
    const [shift, setShift] = useState(initialShift || null)
    const [activeLog, setActiveLog] = useState(initialLog || null)
    const [loading, setLoading] = useState(false)
    const [selectedLot, setSelectedLot] = useState('')
    const [units, setUnits] = useState(0)
    const [elapsedTime, setElapsedTime] = useState('00:00:00')
    const router = useRouter()

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeLog && activeLog.start_time) {
            const start = new Date(activeLog.start_time).getTime()
            interval = setInterval(() => {
                const now = new Date().getTime()
                const diff = now - start
                const h = Math.floor(diff / (1000 * 60 * 60))
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const s = Math.floor((diff % (1000 * 60)) / 1000)
                setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
            }, 1000)
        } else {
            setElapsedTime('00:00:00')
        }
        return () => clearInterval(interval)
    }, [activeLog])

    const handleClockIn = async () => {
        setLoading(true)
        const result = await clockIn()
        if (result.error) toast.error(result.error)
        else {
            toast.success('Entrada registrada')
            router.refresh()
        }
        setLoading(false)
    }

    const handleClockOut = async () => {
        if (!shift?.id) return
        setLoading(true)
        const result = await clockOut(shift.id)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Salida registrada. ¡Hasta mañana!')
            router.refresh()
        }
        setLoading(false)
    }

    const handleStartTask = async () => {
        if (!selectedLot) return toast.error('Seleccione una orden de envasado')
        if (!shift?.id) return toast.error('Turno no válido')
        setLoading(true)
        const result = await startTask(shift.id, selectedLot)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Tarea iniciada')
            router.refresh()
        }
        setLoading(false)
    }

    const handleEndTask = async () => {
        if (units <= 0) return toast.error('Ingrese la cantidad producida')
        if (!activeLog?.id) return toast.error('Tarea no válida')
        setLoading(true)
        const result = await endTask(activeLog.id, units)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Tarea finalizada')
            setUnits(0)
            router.refresh()
        }
        setLoading(false)
    }

    // Ensure we have a valid shift object before rendering the main panel
    if (!shift || !shift.clock_in) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Jornada Laboral</CardTitle>
                        <CardDescription>No ha registrado entrada hoy.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={handleClockIn} disabled={loading}>
                            <LogIn className="w-6 h-6 mr-2" />
                            Registrar Entrada
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Estado Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Hora Entrada</p>
                            <p className="text-xl font-bold">{new Date(shift.clock_in).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500">Estado</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                En Jornada
                            </span>
                        </div>
                    </div>
                    {/* Active Task Info */}
                    {activeLog ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <div className="flex items-center text-blue-800">
                                <Timer className="w-5 h-5 mr-2 animate-pulse" />
                                <span className="font-semibold text-lg">{elapsedTime}</span>
                            </div>
                            <p className="text-sm text-blue-700">Produciendo: <span className="font-bold">{activeLog.reference?.name || 'Referencia Desconocida'}</span></p>
                            <p className="text-xs text-blue-600">Lote: {activeLog.packaging_lot?.lot_code || 'N/A'}</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                            No hay tarea activa.
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" className="w-full" onClick={handleClockOut} disabled={activeLog !== null || loading}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Registrar Salida
                    </Button>
                </CardFooter>
            </Card>

            {/* Action Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Control de Producción</CardTitle>
                    <CardDescription>{activeLog ? 'Finalice la tarea actual para continuar.' : 'Inicie una nueva tarea de envasado.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeLog ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Cantidad Producida (Latas)</Label>
                                <Input
                                    type="number"
                                    className="text-2xl h-14 text-center"
                                    value={units}
                                    onChange={(e) => setUnits(Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <Button className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg" onClick={handleEndTask} disabled={loading}>
                                <Square className="w-5 h-5 mr-2 fill-current" />
                                Finalizar Tarea
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Orden de Envasado</Label>
                                <Select onValueChange={setSelectedLot}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione Lote..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {safeOpenLots.map(lot => (
                                            lot && lot.id ? (
                                                <SelectItem key={lot.id} value={lot.id}>
                                                    {lot.lot_code} - {lot.reference?.name || 'Sin Ref'}
                                                </SelectItem>
                                            ) : null
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" onClick={handleStartTask} disabled={!selectedLot || loading}>
                                <Play className="w-5 h-5 mr-2" />
                                Iniciar Tarea
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
