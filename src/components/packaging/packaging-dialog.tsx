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
import { createPackagingLot } from '@/actions/packaging'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const formSchema = z.object({
    lot_code: z.string().min(3),
    reference_id: z.string().min(1, 'Seleccione referencia'),
    barrel_ids: z.array(z.string()).min(1, 'Seleccione al menos un barril'), // Simplified: logic might allow 0 if just opening? But logic says consumes barrels.
})

interface PackagingDialogProps {
    references: any[]
    readyBarrels: any[]
}

export default function PackagingDialog({ references, readyBarrels }: PackagingDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            lot_code: '',
            reference_id: '',
            barrel_ids: [],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await createPackagingLot(values)

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success('Orden de envasado creada')
                setOpen(false)
                form.reset()
                router.refresh()
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        }
    }

    // Helper for multi-select of barrels (Simple implementation: List with checkboxes or Select multiple?)
    // Shadcn select doesn't support multiple by default easily. 
    // We can use a simple list of checkboxes.

    const handleBarrelToggle = (id: string) => {
        const current = form.getValues('barrel_ids')
        if (current.includes(id)) {
            form.setValue('barrel_ids', current.filter(i => i !== id))
        } else {
            form.setValue('barrel_ids', [...current, id])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Orden
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Iniciar Envasado</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="lot_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código Lote Envasado</FormLabel>
                                    <FormControl>
                                        <Input placeholder="LE-2024-..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Referencia (Producto Final)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione SKU" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {references.map((ref) => (
                                                <SelectItem key={ref.id} value={ref.id}>
                                                    {ref.code} - {ref.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>Barriles Disponibles (Listos)</FormLabel>
                            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                {readyBarrels.length === 0 && <p className="text-sm text-muted-foreground">No hay barriles listos.</p>}
                                {readyBarrels.map((barrel) => (
                                    <div key={barrel.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={barrel.id}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={form.watch('barrel_ids').includes(barrel.id)}
                                            onChange={() => handleBarrelToggle(barrel.id)}
                                        />
                                        <label htmlFor={barrel.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {barrel.barrel_code} ({barrel.net_weight_kg}kg)
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <FormMessage>{form.formState.errors.barrel_ids?.message}</FormMessage>
                        </FormItem>

                        <DialogFooter>
                            <Button type="submit">Crear Orden</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
