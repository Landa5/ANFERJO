import { getMonthlyProductivity } from '@/actions/reports'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/utils/supabase/server'

export default async function ProductivityPage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch user role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = userData?.role || 'operator'
    const isOperator = role === 'operator'

    const currentDate = new Date()
    const month = Number(searchParams.month) || currentDate.getMonth() + 1
    const year = Number(searchParams.year) || currentDate.getFullYear()

    const data = await getMonthlyProductivity(month, year, isOperator ? user.id : undefined)

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productividad Mensual</h1>
                    <p className="text-muted-foreground">Informe de rendimiento por empleado.</p>
                </div>
                <div className="flex gap-2">
                    {/* Simple navigation for now, or use a client component for select */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded border">
                        <span className="font-medium">{months[month - 1].label} {year}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Latas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc, curr) => acc + curr.totalUnits, 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1)} h
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Productividad Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(data.reduce((acc, curr) => acc + curr.totalUnits, 0) / (data.reduce((acc, curr) => acc + curr.totalHours, 0) || 1)).toFixed(0)} u/h
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Días Trab.</TableHead>
                            <TableHead>Horas</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Latas Prod.</TableHead>
                            <TableHead>Latas/Hora</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay datos para este mes.
                                </TableCell>
                            </TableRow>
                        )}
                        {data.map((row) => (
                            <TableRow key={row.userId}>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>{row.daysWorked}</TableCell>
                                <TableCell>{row.totalHours.toFixed(1)}</TableCell>
                                <TableCell>{row.logsCount}</TableCell>
                                <TableCell>{row.totalUnits.toLocaleString()}</TableCell>
                                <TableCell>
                                    <span className={Number(row.unitsPerHour) > 100 ? 'text-green-600 font-bold' : ''}>
                                        {row.unitsPerHour}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
