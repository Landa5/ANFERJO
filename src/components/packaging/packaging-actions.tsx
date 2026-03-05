'use client'

import { closePackagingLot } from '@/actions/packaging'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PackagingActions({ id, status }: { id: string, status: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleClose = async () => {
        setLoading(true)
        const result = await closePackagingLot(id)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Lote cerrado y stock actualizado')
            router.refresh()
        }
    }

    if (status !== 'open') return null

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    Cerrar Lote
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de cerrar este lote?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción finalizará la producción. El stock de latas se consolidará y no se podrán añadir más registros.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClose} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Cierre
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
