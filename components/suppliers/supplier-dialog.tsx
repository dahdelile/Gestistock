"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Supplier } from "@/types/supplier"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FieldErrors } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useApiData } from "@/hooks/use-api-data"

const supplierSchema = z.object({
  id: z.coerce.string().optional(), // Coerce ID to string to handle numeric input
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  notes: z.string().optional(),
})

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const { addSupplier, updateSupplier } = useApiData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      id: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (supplier) {
      form.reset({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes || "",
      })
    } else {
      form.reset({
        id: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      })
    }
  }, [supplier, form, open])

  const onSubmit = async (values: z.infer<typeof supplierSchema>) => {
    console.log('[SupplierDialog] Update handler triggered', values);
    setIsSubmitting(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const supplierData: Supplier = {
        id: values.id || uuidv4(),
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        notes: values.notes || "",
      }

      if (supplier) {
        console.log('[SupplierDialog] Calling updateSupplier with:', supplier.id, supplierData);
        await updateSupplier(supplierData)
      } else {
        await addSupplier(supplierData)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting supplier:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (errors: FieldErrors<z.infer<typeof supplierSchema>>) => {
    console.log('[SupplierDialog] Form validation failed:', errors);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{supplier ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle>
          <DialogDescription>
            {supplier
              ? "Modifiez les informations du fournisseur ci-dessous."
              : "Remplissez les informations pour créer un nouveau fournisseur."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du fournisseur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 1 23 45 67 89" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes ou commentaires sur ce fournisseur..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : supplier ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
