'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { createReference, getReferences } from '@/actions/references'

export function ImportReferencesDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const downloadTemplate = () => {
        const template = [{
            code: 'MGF-1',
            name: 'MGF Boquerón',
            format: '250g',
            weight_g: 250,
            units_per_box: 10,
            target_units_per_hour: 400,
            incentive_per_unit: 0.05
        }]

        const worksheet = XLSX.utils.json_to_sheet(template)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Referencias')
        XLSX.writeFile(workbook, 'Plantilla_Referencias.xlsx')
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const rawData = XLSX.utils.sheet_to_json(worksheet) as any[]

            if (rawData.length === 0) {
                toast.error('El archivo está vacío')
                return
            }

            const existingRefs = await getReferences()
            const existingCodes = existingRefs.map(r => r.code)

            let successCount = 0
            let errors = []

            for (const row of rawData) {
                try {
                    const code = String(row.code || '').trim()
                    if (!code) continue

                    if (existingCodes.includes(code)) {
                        errors.push(`Referencia duplicada: ${code}`)
                        continue
                    }

                    const refToCreate = {
                        code,
                        name: String(row.name || ''),
                        format: String(row.format || ''),
                        weight_g: Number(row.weight_g) || 0,
                        units_per_box: Number(row.units_per_box) || 1,
                        target_units_per_hour: Number(row.target_units_per_hour) || 0,
                        incentive_per_unit: Number(row.incentive_per_unit) || 0,
                        is_final_product: true,
                        active: true
                    }

                    const result = await createReference(refToCreate)
                    if (result.success) {
                        successCount++
                    } else {
                        errors.push(`Error en ${code}: ${result.error}`)
                    }
                } catch (err: any) {
                    errors.push(err.message)
                }
            }

            if (successCount > 0) {
                toast.success(`Se importaron ${successCount} referencias correctamente.`)
            }
            if (errors.length > 0) {
                toast.warning(`Fallaron ${errors.length} referencias.`)
            }

            if (successCount > 0 || errors.length === 0) {
                setOpen(false)
                router.refresh()
            }

        } catch (error) {
            console.error(error)
            toast.error('Error procesando el archivo.')
        } finally {
            setLoading(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Importar Referencias</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) con los datos de múltiples referencias para crearlas a la vez.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <Button variant="secondary" onClick={downloadTemplate} className="w-full justify-start text-left">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Plantilla Excel
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            ref={fileRef}
                            onChange={handleFileUpload}
                        />
                        <Button
                            className="w-full justify-start text-left"
                            disabled={loading}
                            onClick={() => fileRef.current?.click()}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                            {loading ? 'Procesando...' : 'Seleccionar archivo y subir'}
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <p className="text-xs text-muted-foreground w-full text-center">Asegúrate de no duplicar códigos existentes.</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
