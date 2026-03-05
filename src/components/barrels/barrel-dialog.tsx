'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createBarrel } from '@/actions/barrels'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const formSchema = z.object({
    purchase_lot_id: z.string().min(1, 'Seleccione un lote'),
    net_weight_kg: z.coerce.number().min(1),
    location: z.string().min(1),
})

interface BarrelDialogProps {
    purchaseLots: any[]
}

export default function BarrelDialog({ purchaseLots }: BarrelDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            purchase_lot_id: '',
            net_weight_kg: 0,
            location: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await createBarrel(values)

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success('Barril registrado')
                setOpen(false)
                form.reset()
                router.refresh()
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Barril
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Barril</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="purchase_lot_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lote de Compra</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Lote" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {purchaseLots.map((lot) => (
                                                <SelectItem key={lot.id} value={lot.id}>
                                                    {lot.lot_code} - {lot.provider}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="net_weight_kg"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kg Netos</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubicación</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Zona A, Nave 1..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
