'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type PackagingLotData = {
    lot_code: string
    reference_id: string
    barrel_ids: string[] // List of barrels to consume
}

export async function getPackagingLots() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('packaging_lots')
        .select(`
            *,
            reference:references(code, name),
            barrel_usage(barrel:barrels(barrel_code))
        `)
        .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function createPackagingLot(data: PackagingLotData) {
    const supabase = await createClient()

    // 1. Create Packaging Lot
    const { data: lot, error: lotError } = await supabase
        .from('packaging_lots')
        .insert({
            lot_code: data.lot_code,
            reference_id: data.reference_id,
            status: 'open'
        })
        .select()
        .single()

    if (lotError) return { error: lotError.message }

    // 2. Link Barrels and Update Status to 'consumed'
    // We transactionally link and update.
    // Supabase JS doesn't support transactions purely in client lib easily without RPC?
    // We'll do it sequentially. If fails, we might have inconsistency.
    // For MVP it is acceptable, or we use a stored procedure.
    // Let's us sequential: Insert usages, Update barrels.

    if (data.barrel_ids.length > 0) {
        const usageData = data.barrel_ids.map(bid => ({
            packaging_lot_id: lot.id,
            barrel_id: bid
        }))

        const { error: usageError } = await supabase.from('barrel_usage').insert(usageData)
        if (usageError) return { error: "Created lot but failed to link barrels: " + usageError.message }

        const { error: updateError } = await supabase
            .from('barrels')
            .update({ status: 'consumed' })
            .in('id', data.barrel_ids)

        if (updateError) return { error: "Linked barrels but failed to update status: " + updateError.message }
    }

    revalidatePath('/dashboard/packaging')
    revalidatePath('/dashboard/barrels') // Update barrels list too
    return { success: true }
}

export async function closePackagingLot(id: string) {
    const supabase = await createClient()

    // Calculate total units from production logs? 
    // Or we assume the production logs automatically update the total_units_produced in real-time?
    // Design says: "Sistema suma todas las units_produced".
    // We can do a sum query here to be sure.

    const { data: logs } = await supabase
        .from('production_logs')
        .select('units_produced')
        .eq('packaging_lot_id', id)
        .eq('status', 'completed') // Only completed logs

    const total = logs?.reduce((acc, curr) => acc + (curr.units_produced || 0), 0) || 0

    const { error } = await supabase
        .from('packaging_lots')
        .update({
            status: 'closed',
            end_date: new Date().toISOString(),
            total_units_produced: total
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/packaging')
    return { success: true }
}
