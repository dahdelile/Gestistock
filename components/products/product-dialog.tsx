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
import { Textarea } from "@/components/ui/textarea"
import type { Category } from "@/types/category"
import type { Product } from "@/types/product"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { useEffect } from "react"

const productSchema = z.object({
  id: z.string().optional(),
  reference: z.string().min(1, "La référence est requise"),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  category_id: z.coerce.number().min(1, "La catégorie est requise"),
  price: z.coerce.number().positive("Le prix doit être positif"),
  quantity: z.coerce.number().int("La quantité doit être un nombre entier"),
  min_stock: z.coerce.number().int("Le stock minimum doit être un nombre entier"),
})

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  onSave: (product: Product) => void
}

export function ProductDialog({ open, onOpenChange, product, categories, onSave }: ProductDialogProps) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: undefined, // Use undefined for optional string
      reference: "",
      name: "",
      description: "",
      category_id: 0,
      price: 0,
      quantity: 0,
      min_stock: 0,
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        id: String(product.id), // Ensure id is a string
        reference: product.reference,
        name: product.name,
        description: product.description || "",
        category_id: product.category?.id || 0,
        price: product.price,
        quantity: product.quantity,
        min_stock: product.min_stock,
      })
    } else {
      form.reset({
        id: undefined, // Use undefined for optional string
        reference: "",
        name: "",
        description: "",
        category_id: 0,
        price: 0,
        quantity: 0,
        min_stock: 0,
      })
    }
  }, [product, form])

  function onSubmit(values: z.infer<typeof productSchema>) {
    console.log("[ProductDialog] onSubmit triggered with values:", values);
    // The console.log for form.formState.errors here is generally not needed if zodResolver is working,
    // as it should prevent onSubmit from being called if there are validation errors.
    // console.log("[ProductDialog] Form errors at onSubmit:", form.formState.errors); 

    const selectedCategory = categories.find(cat => cat.id === values.category_id);

    // The productSchema ensures that values.category_id is a number and >= 1 if validation has passed.
    // If selectedCategory is not found at this point, it implies an inconsistency:
    // - The 'categories' prop might be stale or incomplete.
    // - The category ID associated with the product (if editing) might point to a category
    //   that no longer exists in the 'categories' list.
    if (!selectedCategory) {
      console.error(`[ProductDialog] Critical: Category with ID ${values.category_id} not found in the provided 'categories' list. ` +
                    `This could be due to a stale category list or an invalid category ID. Product cannot be saved without a valid category reference.`);
      form.setError("category_id", {
        type: "manual",
        message: "La catégorie sélectionnée est introuvable ou invalide. Veuillez actualiser la liste des catégories ou en choisir une autre.",
      });
      return; // Prevent saving with an invalid or missing category reference
    }

    const productData: Product = {
      // If values.id is present (editing an existing product), it's used.
      // If values.id is undefined (creating a new product), a new uuid is generated.
      id: values.id || uuidv4(),
      reference: values.reference,
      name: values.name,
      description: values.description || "",
      category: selectedCategory, // Assign the full, validated category object
      price: values.price,
      quantity: values.quantity,
      min_stock: values.min_stock,
    };
    onSave(productData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Modifiez les informations du produit ci-dessous."
              : "Remplissez les informations pour créer un nouveau produit."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence</FormLabel>
                    <FormControl>
                      <Input placeholder="REF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du produit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description du produit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité en stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="min_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock minimum</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">{product ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
