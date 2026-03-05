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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createReference, updateReference, ReferenceData } from '@/actions/references'
import { toast } from 'sonner'
import { Plus, Edit } from 'lucide-react'

const formSchema = z.object({
    code: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    format: z.string().optional(),
    weight_g: z.coerce.number().min(0, 'El peso debe ser positivo'),
    units_per_box: z.coerce.number().int().min(1, 'Debe haber al menos 1 unidad'),
    is_final_product: z.boolean().default(true),
    active: z.boolean().default(true),
    target_units_per_hour: z.coerce.number().min(0),
    incentive_per_unit: z.coerce.number().min(0),
})

interface ReferenceDialogProps {
    mode: 'create' | 'edit'
    reference?: any // Type should be inferred from DB usually
}

export default function ReferenceDialog({ mode, reference }: ReferenceDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: reference ? {
            code: reference.code,
            name: reference.name,
            format: reference.format || '',
            weight_g: reference.weight_g,
            units_per_box: reference.units_per_box || 1,
            is_final_product: reference.is_final_product,
            active: reference.active,
            target_units_per_hour: reference.target_units_per_hour || 0,
            incentive_per_unit: reference.incentive_per_unit || 0
        } : {
            code: '',
            name: '',
            format: '',
            weight_g: 0,
            units_per_box: 1,
            is_final_product: true,
            active: true,
            target_units_per_hour: 0,
            incentive_per_unit: 0,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let result
            // Cast values to ReferenceData. In real app, types should be stricter.
            const data = values as ReferenceData

            if (mode === 'create') {
                result = await createReference(data)
            } else {
                result = await updateReference(reference.id, data)
            }

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success(mode === 'create' ? 'Referencia creada' : 'Referencia actualizada')
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
                {mode === 'create' ? (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Referencia
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Nueva Referencia' : 'Editar Referencia'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Añada un nuevo SKU al catálogo.' : 'Modifique los datos de la referencia.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código</FormLabel>
                                        <FormControl>
                                            <Input placeholder="BOQ-120" {...field} disabled={mode === 'edit'} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="weight_g"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso (g)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Comercial</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Boquerón en Vinagre..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Lata RR-125" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="units_per_box"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Uds/Caja</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="target_units_per_hour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidades Objetivo / H</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="incentive_per_unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Incentivo / Unidad (€)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.0001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-between items-center rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Producto Final</FormLabel>
                                <FormDescription>
                                    ¿Es vendible?
                                </FormDescription>
                            </div>
                            <FormField
                                control={form.control}
                                name="is_final_product"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-between items-center rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Activo</FormLabel>
                                <FormDescription>
                                    Visible en producción.
                                </FormDescription>
                            </div>
                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
