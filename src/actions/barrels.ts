'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addDays } from 'date-fns'

export type BarrelData = {
    purchase_lot_id: string
    net_weight_kg: number
    location: string
    notes?: string
}

export async function getBarrels() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('barrels')
        .select(`
            *,
            purchase_lot:purchase_lots(lot_code, species)
        `)
        .order('creation_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function createBarrel(data: BarrelData) {
    const supabase = await createClient()

    // Generate Barrel Code: BA-{LotCode}-{Sequencial}?
    // For MVP: BA-{Random or Timestamp}
    // Better: Fetch Purchase Lot Code and append count?
    // Let's use simple timestamp for now or random string to avoid race conditions in MVP logic.
    // Actually, SQL trigger is best for this, but for now JS.

    // Get purchase lot code
    const { data: lot } = await supabase.from('purchase_lots').select('lot_code').eq('id', data.purchase_lot_id).single()
    const lotCode = lot?.lot_code || 'UNK'

    const barrelCode = `BA-${lotCode}-${Math.floor(Math.random() * 1000)}`

    const estimatedReady = addDays(new Date(), 2) // 48h curing default

    const { error } = await supabase.from('barrels').insert({
        ...data,
        barrel_code: barrelCode,
        estimated_ready_date: estimatedReady.toISOString(),
        status: 'curing'
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/barrels')
    return { success: true }
}

export async function updateBarrelStatus(id: string, status: 'curing' | 'ready' | 'blocked' | 'consumed') {
    const supabase = await createClient()

    const { error } = await supabase.from('barrels').update({ status }).eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/barrels')
    return { success: true }
}
