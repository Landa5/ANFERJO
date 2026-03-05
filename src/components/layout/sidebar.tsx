'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Package,
    Fish,
    Factory,
    ClipboardList,
    FileText,
    Settings
} from 'lucide-react'

interface SidebarProps {
    role: 'admin' | 'manager' | 'operator'
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            roles: ['admin', 'manager'],
        },
        {
            href: '/dashboard/production',
            label: 'Producción',
            icon: Factory,
            roles: ['operator', 'manager', 'admin'],
        },
        {
            href: '/dashboard/purchase-lots',
            label: 'Compras',
            icon: Fish,
            roles: ['manager', 'admin'],
        },
        {
            href: '/dashboard/barrels',
            label: 'Barriles (Curado)',
            icon: Package,
            roles: ['manager', 'admin'],
        },
        {
            href: '/dashboard/packaging',
            label: 'Envasado',
            icon: ClipboardList,
            roles: ['manager', 'admin'],
        },
        {
            href: '/dashboard/users',
            label: 'Empleados',
            icon: Users,
            roles: ['admin'],
        },
        {
            href: '/dashboard/references',
            label: 'Referencias',
            icon: FileText,
            roles: ['admin', 'manager'],
        },
        {
            href: '/dashboard/audit',
            label: 'Auditoría',
            icon: Settings,
            roles: ['admin'],
        },
        {
            href: '/dashboard/reports/productivity',
            label: 'Productividad',
            icon: ClipboardList,
            roles: ['admin', 'manager', 'operator'],
        },
        {
            href: '/dashboard/traceability',
            label: 'Trazabilidad',
            icon: Settings,
            roles: ['admin', 'manager'],
        },
        {
            href: '/dashboard/analisis',
            label: 'Análisis (Incentivos)',
            icon: ClipboardList,
            roles: ['admin', 'manager'],
        },
        {
            href: '/produccion',
            label: '← Volver a Producción',
            icon: Factory,
            roles: ['admin', 'manager', 'operator'],
        },
        {
            href: '/produccion',
            label: '← Volver a Producción',
            icon: Factory,
            roles: ['admin', 'manager', 'operator'],
        },
    ]

    const filteredLinks = links.filter((link) => link.roles.includes(role))

    return (
        <div className="flex flex-col w-64 bg-slate-900 text-white h-full">
            <div className="flex items-center justify-center h-16 bg-white shadow-md">
                <div className="relative w-40 h-12">
                    <img src="/logo.png" alt="Anferjo Logo" className="object-contain w-full h-full" />
                </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {filteredLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center">
                    <div className="relative w-8 h-8 mr-3 rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-xs font-bold">{role.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium">Rol: {role}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
