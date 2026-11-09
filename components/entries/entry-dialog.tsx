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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Supplier } from "@/types/supplier"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useApiData } from "@/hooks/use-api-data"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"
import type { EntryForm, EntryItem } from "@/types/entry-form"
import type { Product } from "@/types/product"

const entryItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Le produit est requis"),
  quantity: z.coerce.number().positive("La quantité doit être positive").int("La quantité doit être un nombre entier"),
  unitPrice: z.coerce.number().positive("Le prix unitaire doit être positif"),
})

const entryFormSchema = z.object({
  supplierId: z.string().min(1, "Le fournisseur est requis"),
  reference: z.string().min(1, "La référence est requise"),
  date: z.string().min(1, "La date est requise"),
  notes: z.string().optional(),
  items: z.array(entryItemSchema).min(1, "Au moins un produit est requis"),
})

interface EntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suppliers: Supplier[]
}

export function EntryDialog({ open, onOpenChange, suppliers }: EntryDialogProps) {
  const { products, addEntryForm, isLoadingProducts } = useApiData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof entryFormSchema>>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      supplierId: "",
      reference: `BE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      items: [
        {
          id: uuidv4(),
          productId: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        supplierId: "",
        reference: `BE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        date: new Date().toISOString().split("T")[0],
        notes: "",
        items: [
          {
            id: uuidv4(),
            productId: "",
            quantity: 1,
            unitPrice: 0,
          },
        ],
      })
    }
  }, [open, form])

  const addItem = () => {
    const currentItems = form.getValues().items || []
    form.setValue("items", [
      ...currentItems,
      {
        id: uuidv4(),
        productId: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    const currentItems = form.getValues().items || []
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index),
      )
    }
  }

  const getProductById = (productId: string): Product | undefined => {
    // Ensure a consistent string-to-string comparison,
    // in case product.id is a number from the data source.
    return products.find(
      (product) => String(product.id) === productId
    );
  }

  const getSupplierById = (supplierId: string): Supplier | undefined => {
    // Ensure a consistent string-to-string comparison,
    // in case supplier.id is a number from the data source.
    return suppliers.find(
      (supplier) => String(supplier.id) === supplierId
    );
  }

  const calculateTotal = () => {
    const items = form.getValues().items || []
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
  }

  const onSubmit = async (values: z.infer<typeof entryFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const supplier = getSupplierById(values.supplierId)
      if (!supplier) throw new Error("Fournisseur non trouvé")
      const supplierName = supplier.name;

      const entryItems: EntryItem[] = values.items.map((item) => {
        const productDetails = getProductById(item.productId);
        if (!productDetails) throw new Error(`Produit non trouvé pour ID: ${item.productId}`);

        return {
          id: item.id || uuidv4(),
          productId: item.productId,
          productName: productDetails.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        };
      });

      // The grandTotal calculation (previously 'total') is removed as it's not part of the API payload.
      // The UI's total display is handled by the existing calculateTotal() function.

      const currentStatus: "pending" | "draft" | "completed" = "pending";
      const entryFormPayload = {
        reference: values.reference,
        date: values.date,
        supplierId: values.supplierId, // values.supplierId is already a string from the form schema
        supplierName: supplierName,
        status: currentStatus,
        notes: values.notes || "",
        total: calculateTotal(),
        // Fields are omitted here to match the expected payload type for addEntryForm:
        // No id, user, supplier (object), created_at, updated_at.
        items: entryItems, // Pass the already correctly structured entryItems
      };

      addEntryForm(entryFormPayload);
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting entry form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Nouveau bon d'entrée</DialogTitle>
          <DialogDescription>Créez un nouveau bon d'entrée pour enregistrer une livraison.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
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
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fournisseur</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Produits</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>

              <div className="space-y-4">
                {form.getValues().items.map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 rounded-md border p-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="col-span-5">
                          <FormLabel className="sr-only">Produit</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              const product = getProductById(value)
                              if (product) {
                                form.setValue(`items.${index}.unitPrice`, product.price)
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un produit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={String(product.id)}>
                                  {product.name} ({product.reference})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="sr-only">Quantité</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" placeholder="Qté" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel className="sr-only">Prix unitaire</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="Prix unitaire" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {(
                          (form.getValues().items[index]?.quantity || 0) *
                          (form.getValues().items[index]?.unitPrice || 0)
                        ).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={form.getValues().items.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.items?.message && (
                <p className="mt-2 text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes ou commentaires sur cette entrée..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">
                  Total:{" "}
                  {calculateTotal().toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <DialogFooter className="sm:justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
