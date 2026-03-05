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
import { bulkCreateUsers, UserData } from '@/actions/users'

export function ImportUsersDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const downloadTemplate = () => {
        const template = [{
            full_name: 'Juan Perez',
            dni: '12345678X',
            email: 'juan@anferjo.com',
            password: 'password123',
            role: 'operator',
            cost_per_hour: 12.5
        }]

        const worksheet = XLSX.utils.json_to_sheet(template)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios')
        XLSX.writeFile(workbook, 'Plantilla_Usuarios.xlsx')
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

            const usersToCreate: UserData[] = rawData.map(row => ({
                full_name: String(row.full_name || ''),
                dni: String(row.dni || ''),
                email: String(row.email || ''),
                password: String(row.password || '123456'), // Default pass if missing
                role: ['admin', 'manager', 'operator', 'jefe_almacen', 'almacen', 'envasadora', 'cortadora'].includes(row.role) ? row.role : 'operator',
                cost_per_hour: Number(row.cost_per_hour) || 0
            })).filter(u => u.full_name && u.dni && u.email) // extremely basic validation

            if (usersToCreate.length === 0) {
                toast.error('No se encontraron empleados válidos para importar.')
                return
            }

            const result = await bulkCreateUsers(usersToCreate)

            if (result.successCount > 0) {
                toast.success(`Se importaron ${result.successCount} empleados correctamente.`)
                if (result.errors.length > 0) {
                    toast.warning(`No se pudieron importar ${result.errors.length} empleados.`)
                }
                setOpen(false)
                router.refresh()
            } else {
                toast.error('Error importando empleados. Todos fallaron.')
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
                    <DialogTitle>Importar Empleados</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) con los datos de múltiples trabajadores para crearlos a la vez.
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
                    <p className="text-xs text-muted-foreground w-full text-center">Asegúrate de respetar las columnas de la plantilla.</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
