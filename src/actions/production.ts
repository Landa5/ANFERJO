'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOperatorStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get Active Shift
    // Check if there is a shift today/recently without clock_out
    const { data: shift } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .single()

    // 2. Get Active Production Log
    let activeLog = null
    if (shift) {
        const { data: log } = await supabase
            .from('production_logs')
            .select(`
                *,
                packaging_lot:packaging_lots(lot_code),
                reference:references(code, name)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()
        activeLog = log
    }

    return {
        shift: shift || null,
        activeLog: activeLog || null
    }
}

export async function clockIn() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if already clocked in
    const { count } = await supabase
        .from('work_shifts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('clock_out', null)

    if (count && count > 0) return { error: 'Ya tiene un turno activo' }

    const { error } = await supabase.from('work_shifts').insert({
        user_id: user.id,
        clock_in: new Date().toISOString()
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/production')
    return { success: true }
}

export async function clockOut(shiftId: string) {
    const supabase = await createClient()

    // Check if there is an active task
    const { count } = await supabase
        .from('production_logs')
        .select('*', { count: 'exact', head: true })
        .eq('work_shift_id', shiftId)
        .eq('status', 'active')

    if (count && count > 0) return { error: 'Debe finalizar la tarea activa antes de salir' }

    // Calculate total hours
    const { data: shift } = await supabase.from('work_shifts').select('clock_in').eq('id', shiftId).single()
    if (!shift) return { error: 'Turno no encontrado' }

    const start = new Date(shift.clock_in)
    const end = new Date()
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    const { error } = await supabase.from('work_shifts').update({
        clock_out: end.toISOString(),
        total_hours: hours
    }).eq('id', shiftId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/production')
    return { success: true }
}

export async function startTask(shiftId: string, packagingLotId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Reference ID from Packaging Lot
    const { data: lot } = await supabase.from('packaging_lots').select('reference_id').eq('id', packagingLotId).single()
    if (!lot) return { error: 'Lote no encontrado' }

    const { error } = await supabase.from('production_logs').insert({
        user_id: user.id,
        work_shift_id: shiftId,
        packaging_lot_id: packagingLotId,
        reference_id: lot.reference_id,
        start_time: new Date().toISOString(),
        status: 'active'
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/production')
    return { success: true }
}

export async function endTask(logId: string, units: number) {
    const supabase = await createClient()

    const { error } = await supabase.from('production_logs').update({
        end_time: new Date().toISOString(),
        units_produced: units,
        status: 'completed'
    }).eq('id', logId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/production')
    return { success: true }
}

export async function getOpenPackagingLotsForOperator() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('packaging_lots')
        .select('id, lot_code, reference:references(name)')
        .eq('status', 'open')
        .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
}
