'use client'

import { useState } from 'react'
import { getTraceability } from '@/actions/reports'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Package, Anchor, Fish } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function TraceabilityPage() {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState<any>(null)
    const [type, setType] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query) return

        setLoading(true)
        setResult(null)
        setType(null)

        try {
            // Since getTraceability is a server action, it returns plain data.
            // Accessing it from client component.
            // Note: Imported server action in client component.
            const data = await getTraceability(query)
            if (data) {
                setResult(data.data)
                setType(data.type)
            } else {
                toast.error('No se encontraron resultados')
            }
        } catch (error) {
            toast.error('Error al buscar')
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Trazabilidad</h1>
                <p className="text-muted-foreground">Busque por Lote de Envasado, Barril o Entrada.</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            placeholder="Ej: LE-2024-001, BA-LC-..., LC-2024-..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Buscando...' : <Search className="w-4 h-4 mr-2" />}
                            Buscar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6 fade-in animate-in slide-in-from-bottom-4">
                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                {type === 'packaging' && <Package className="w-6 h-6 mr-2 text-blue-600" />}
                                {type === 'barrel' && <Anchor className="w-6 h-6 mr-2 text-blue-600" />}
                                {type === 'purchase' && <Fish className="w-6 h-6 mr-2 text-blue-600" />}
                                Información Principal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Código</p>
                                <p className="text-lg font-bold">{result.lot_code || result.barrel_code}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Estado</p>
                                <Badge variant={
                                    result.status === 'received' || result.status === 'ready' || result.status === 'closed' || result.status === 'completed'
                                        ? 'default'
                                        : result.status === 'curing' || result.status === 'active' || result.status === 'open'
                                            ? 'secondary'
                                            : 'destructive'
                                }>
                                    {{
                                        'received': 'Recibido',
                                        'curing': 'En Curado',
                                        'ready': 'Listo',
                                        'blocked': 'Bloqueado',
                                        'consumed': 'Consumido',
                                        'open': 'En Curso',
                                        'closed': 'Cerrado',
                                        'active': 'Activo',
                                        'completed': 'Completado'
                                    }[result.status as string] || result.status}
                                </Badge>
                            </div>
                            {type === 'packaging' && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Referencia</p>
                                        <p>{result.reference?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Producido</p>
                                        <p>{result.total_units_produced}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Genealogy */}
                    {type === 'packaging' && result.barrel_usage && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Barriles Consumidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {result.barrel_usage.map((u: any) => (
                                        <li key={u.barrel.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between font-bold">
                                                <span>{u.barrel.barrel_code}</span>
                                                <span>{u.barrel.net_weight_kg} kg</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-2">
                                                Origen: {u.barrel.purchase_lot?.lot_code} ({u.barrel.purchase_lot?.provider})
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
