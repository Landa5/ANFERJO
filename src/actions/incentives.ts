'use server'

import { createClient } from '@/utils/supabase/server'

export async function getIncentivesReport(month: number, year: number) {
    const supabase = await createClient()

    // 1st day of month
    const startDate = new Date(year, month - 1, 1).toISOString()
    // 1st day of NEXT month
    const endDate = new Date(year, month, 1).toISOString()

    const { data: logs, error } = await supabase
        .from('production_logs')
        .select(`
            id,
            start_time,
            end_time,
            units_produced,
            user_id,
            user:users(id, full_name),
            reference:references(id, name, target_units_per_hour, incentive_per_unit)
        `)
        .gte('start_time', startDate)
        .lt('start_time', endDate)
        .eq('status', 'completed')
        .not('end_time', 'is', null)

    if (error) {
        console.error('Error fetching logs:', error)
        return []
    }

    // Process logs to group by user and by product.
    // However, we want to show a detailed view maybe, or summarize per user.
    // The user wants: "métricas de producción de los trabajadores, los productos producidos y los incentivos obtenidos... filtros por fechas, productos, trabajadores e incentivos... descargable en Excel."

    const results = logs.map((rawLog: any) => {
        const log = rawLog as any
        const start = new Date(log.start_time)
        const end = new Date(log.end_time)
        const diffMs = end.getTime() - start.getTime()
        const hours = diffMs / (1000 * 60 * 60)

        const ref = log.reference || {} as any
        const targetUnitsPerHour = Number(ref.target_units_per_hour || 0)
        const incentivePerUnit = Number(ref.incentive_per_unit || 0)

        const expectedUnits = hours * targetUnitsPerHour
        const excessUnits = Math.max(0, (log.units_produced || 0) - expectedUnits)
        const incentiveEur = excessUnits * incentivePerUnit

        return {
            id: log.id,
            date: start.toLocaleDateString(),
            worker: log.user?.full_name || 'Desconocido',
            product: ref.name || 'Desconocido',
            hours: hours,
            units: log.units_produced,
            targetUnitsPerHour: targetUnitsPerHour,
            expectedUnits: expectedUnits,
            excessUnits: excessUnits,
            incentiveEur: incentiveEur
        }
    })

    return results;
}
