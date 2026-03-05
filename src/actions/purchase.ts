'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type PurchaseLotData = {
    lot_code: string
    provider: string
    purchase_date: Date
    species: string
    kg_bought: number
    caliber: string
    price_per_kg: number
    reception_temp: number
    notes?: string
}

export async function getPurchaseLots() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('purchase_lots')
        .select('*')
        .order('purchase_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function createPurchaseLot(data: PurchaseLotData) {
    const supabase = await createClient()

    // Auto-generate lot_code if not provided? Use user input for now.
    // Ideally we generate it: LC-YYYYMMDD-SEQ.
    // For MVP, user enters it or we simple-gen it.
    // Let's assume input for now to be safe.

    const { error } = await supabase.from('purchase_lots').insert({
        ...data,
        status: 'received' // Default to received for simplicity in MVP
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/purchase-lots')
    return { success: true }
}

export async function deletePurchaseLot(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('purchase_lots').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/purchase-lots')
    return { success: true }
}
