'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMonthlyProductivity(month: number, year: number, userId?: string) {
    const supabase = await createClient()

    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 1).toISOString()

    // Fetch shifts
    // Ideally we do aggregation in SQL, but for MVP JS aggregation is fine.

    let shiftsQuery = supabase
        .from('work_shifts')
        .select('*, user:users(full_name, role)')
        .gte('clock_in', startDate)
        .lt('clock_in', endDate)

    if (userId) {
        shiftsQuery = shiftsQuery.eq('user_id', userId)
    }

    const { data: shifts } = await shiftsQuery

    // Fetch logs
    let logsQuery = supabase
        .from('production_logs')
        .select('*, user:users(full_name)')
        .gte('start_time', startDate)
        .lt('start_time', endDate)
        .eq('status', 'completed')

    if (userId) {
        logsQuery = logsQuery.eq('user_id', userId)
    }

    const { data: logs } = await logsQuery

    // Aggregate by User
    const report = {} as Record<string, {
        userId: string,
        name: string,
        daysWorked: number,
        totalHours: number,
        totalUnits: number,
        logsCount: number
    }>

    if (shifts) {
        shifts.forEach(shift => {
            if (!report[shift.user_id]) {
                report[shift.user_id] = {
                    userId: shift.user_id,
                    name: shift.user?.full_name || 'Desconocido',
                    daysWorked: 0,
                    totalHours: 0,
                    totalUnits: 0,
                    logsCount: 0
                }
            }
            report[shift.user_id].daysWorked += 1
            report[shift.user_id].totalHours += Number(shift.total_hours || 0)
        })
    }

    // If filtering by user, we might have logs but no shifts if data is inconsistent or special case.
    // Ensure user entry exists from logs if not from shifts.
    if (logs) {
        logs.forEach(log => {
            if (!report[log.user_id]) {
                report[log.user_id] = {
                    userId: log.user_id,
                    name: log.user?.full_name || 'Desconocido',
                    daysWorked: 0,
                    totalHours: 0,
                    totalUnits: 0,
                    logsCount: 0
                }
            }
            report[log.user_id].totalUnits += (log.units_produced || 0)
            report[log.user_id].logsCount += 1
        })
    }

    return Object.values(report).map(row => ({
        ...row,
        unitsPerHour: row.totalHours > 0 ? (row.totalUnits / row.totalHours).toFixed(2) : 0
    }))
}

export async function getTraceability(code: string) {
    /*
     * Complex Traceability Logic:
     * 1. Check if Code matches a Packaging Lot
     * 2. If so, find its Barrel Usages -> Barrels -> Purchase Lots.
     * 3. Also check if Code matches a Barrel -> Purchase Lot.
     * 4. Also check if Code matches a Purchase Lot -> Find Barrels -> Find Packaging Lots.
     */

    const supabase = await createClient()

    // Try Packaging Lot
    const { data: packLot } = await supabase
        .from('packaging_lots')
        .select(`
            *,
            reference:references(*),
            barrel_usage(
                barrel:barrels(
                    *,
                    purchase_lot:purchase_lots(*)
                )
            )
        `)
        .eq('lot_code', code)
        .single()

    if (packLot) return { type: 'packaging', data: packLot }

    // Try Barrel
    const { data: barrel } = await supabase
        .from('barrels')
        .select(`
            *,
            purchase_lot:purchase_lots(*)
        `)
        .eq('barrel_code', code)
        .single()

    if (barrel) return { type: 'barrel', data: barrel }

    // Try Purchase Lot
    const { data: purchaseLot } = await supabase
        .from('purchase_lots')
        .select(`
            *,
            barrels(
                *,
                barrel_usage(
                    packaging_lot:packaging_lots(*)
                )
            )
        `)
        .eq('lot_code', code)
        .single()

    if (purchaseLot) return { type: 'purchase', data: purchaseLot }

    return null
}
