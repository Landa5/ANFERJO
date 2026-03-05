import KioskPanel from '@/components/produccion/kiosk-panel'
import { getKioskData } from '@/actions/kiosk'

export default async function ProduccionPage() {
    const { users, references } = await getKioskData()

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
            <header className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Anferjo" className="h-10 object-contain bg-white rounded p-1" />
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Kiosco de Producción</h1>
                        <p className="text-slate-400 text-sm">Registro rápido en planta</p>
                    </div>
                </div>
                <a href="/login" className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
                    Administración
                </a>
            </header>

            <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
                <KioskPanel users={users} references={references} />
            </main>
        </div>
    )
}
