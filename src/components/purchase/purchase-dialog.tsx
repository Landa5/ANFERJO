'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createPurchaseLot, PurchaseLotData } from '@/actions/purchase'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const formSchema = z.object({
    lot_code: z.string().min(3),
    provider: z.string().min(2),
    purchase_date: z.string(), // Input type date returns string
    species: z.string().default('Boquerón'),
    kg_bought: z.coerce.number().min(0.1),
    caliber: z.string().optional(),
    price_per_kg: z.coerce.number().min(0),
    reception_temp: z.coerce.number(),
    notes: z.string().optional(),
})

export default function PurchaseDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            lot_code: '',
            provider: '',
            purchase_date: new Date().toISOString().split('T')[0],
            species: 'Boquerón',
            kg_bought: 0,
            caliber: '',
            price_per_kg: 0,
            reception_temp: 0,
            notes: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const data: PurchaseLotData = {
                ...values,
                purchase_date: new Date(values.purchase_date),
                caliber: values.caliber || '',
            }

            const result = await createPurchaseLot(data)

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success('Lote de compra registrado')
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
                    Nueva Entrada
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Recepción de Mercancía</DialogTitle>
                    <DialogDescription>
                        Registre la entrada de pescado fresco.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="lot_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lote Interno</FormLabel>
                                        <FormControl>
                                            <Input placeholder="LC-2024-..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="purchase_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Compra</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proveedor / Barco</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pescados Hnos..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="kg_bought"
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
                                name="caliber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Calibre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="G/M/P" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reception_temp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temp ºC</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Registrar Entrada</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
