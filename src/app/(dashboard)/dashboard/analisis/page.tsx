'use client'

import { useEffect, useState, useMemo } from 'react'
import { getIncentivesReport } from '@/actions/incentives'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, Loader2, TrendingUp, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function AnalysisPage() {
    const defaultMonth = new Date().getMonth() + 1
    const defaultYear = new Date().getFullYear()

    const [month, setMonth] = useState(defaultMonth)
    const [year, setYear] = useState(defaultYear)
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [workerFilter, setWorkerFilter] = useState('ALL')
    const [productFilter, setProductFilter] = useState('ALL')

    useEffect(() => {
        let isMounted = true
        async function fetch() {
            setLoading(true)
            const d = await getIncentivesReport(month, year)
            if (isMounted) {
                setData(d)
                setLoading(false)
            }
        }
        fetch()
        return () => { isMounted = false }
    }, [month, year])

    const filteredData = useMemo(() => {
        return data.filter(r => {
            if (workerFilter !== 'ALL' && r.worker !== workerFilter) return false
            if (productFilter !== 'ALL' && r.product !== productFilter) return false
            return true
        })
    }, [data, workerFilter, productFilter])

    const uniqueWorkers = Array.from(new Set(data.map(d => d.worker)))
    const uniqueProducts = Array.from(new Set(data.map(d => d.product)))

    const totalIncentives = filteredData.reduce((acc, curr) => acc + curr.incentiveEur, 0)
    const totalExcessUnits = filteredData.reduce((acc, curr) => acc + curr.excessUnits, 0)
    const totalUnits = filteredData.reduce((acc, curr) => acc + curr.units, 0)

    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData.map(d => ({
            'Fecha': d.date,
            'Trabajador': d.worker,
            'Producto': d.product,
            'Horas': Number(d.hours).toFixed(2),
            'Unidades Objetivo / H': d.targetUnitsPerHour,
            'Unidades Esperadas': Number(d.expectedUnits).toFixed(2),
            'Unidades Totales': d.units,
            'Unidades Extra': Number(d.excessUnits).toFixed(2),
            'Incentivo (€)': Number(d.incentiveEur).toFixed(2) + ' €'
        })))

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Incentivos')
        XLSX.writeFile(workbook, `Incentivos_${year}_${month}.xlsx`)
    }

    const months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500 w-8 h-8" />
                        Análisis de Datos e Incentivos
                    </h1>
                    <p className="text-muted-foreground mt-1">Consulta los registros de producción y el cálculo de exceso.</p>
                </div>

                <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger className="w-[140px] border-none bg-slate-50 focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-[100px] border-none bg-slate-50 focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[...Array(5)].map((_, i) => (
                                <SelectItem key={i} value={(defaultYear - i).toString()}>{defaultYear - i}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleDownload} variant="outline" className="ml-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200">
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-emerald-800 text-sm font-semibold uppercase tracking-wider">Total Incentivos Estimados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-600">
                            {totalIncentives.toFixed(2)} €
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-amber-800 text-sm font-semibold uppercase tracking-wider">Total Unidades Exceso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-600">
                            {totalExcessUnits.toFixed(0)} <span className="text-lg text-amber-500 font-normal">uds</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-800 text-sm font-semibold uppercase tracking-wider">Unidades Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-blue-600">
                            {totalUnits} <span className="text-lg text-blue-500 font-normal">uds</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={workerFilter} onValueChange={setWorkerFilter}>
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Todos los trabajadores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Trabajadores</SelectItem>
                            {uniqueWorkers.map(w => (
                                <SelectItem key={w as string} value={w as string}>{w as string}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Todos los productos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Productos</SelectItem>
                            {uniqueProducts.map(w => (
                                <SelectItem key={w as string} value={w as string}>{w as string}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Trabajador</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Horas</th>
                                <th className="px-6 py-4">Registradas</th>
                                <th className="px-6 py-4 text-emerald-600">Exceso</th>
                                <th className="px-6 py-4 text-right">Incentivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-500">
                                        No hay registros de producción con incentivos para este periodo.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((d, i) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">{d.date}</td>
                                        <td className="px-6 py-3">{d.worker}</td>
                                        <td className="px-6 py-3">{d.product}</td>
                                        <td className="px-6 py-3 text-slate-500">{Number(d.hours).toFixed(2)}h</td>
                                        <td className="px-6 py-3 font-medium">{d.units}</td>
                                        <td className="px-6 py-3 text-emerald-600 font-semibold">{Number(d.excessUnits).toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-800">{Number(d.incentiveEur).toFixed(2)} €</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
