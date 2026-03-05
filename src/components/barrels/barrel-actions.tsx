'use client'

import { updateBarrelStatus } from '@/actions/barrels'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, Ban, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BarrelActions({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleStatusChange = async (status: 'ready' | 'blocked') => {
        setLoading(true)
        const result = await updateBarrelStatus(id, status)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Barril ${status === 'ready' ? 'liberado' : 'bloqueado'}`)
            router.refresh()
        }
    }

    if (currentStatus === 'ready' || currentStatus === 'consumed' || currentStatus === 'blocked') return null

    return (
        <div className="flex gap-2 justify-end">
            <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleStatusChange('ready')}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleStatusChange('blocked')}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            </Button>
        </div>
    )
}
