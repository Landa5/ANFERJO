'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserForm } from "./user-form"

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Empleado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Empleado</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para dar de alta un nuevo usuario en el sistema.
                    </DialogDescription>
                </DialogHeader>
                <UserForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
