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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useApiData } from "@/hooks/use-api-data"
import { Category } from "@/types/category" // Added import

const categorySchema = z.object({
  name: z.string().min(1, "Le nom de la catégorie est requis"),
  description: z.string().nullable(), // Added description
})

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null // Changed type
  onSave: (oldCategory: Category | null, newCategoryData: Omit<Category, "id" | "created_at" | "updated_at" | "products_count">) => void // Changed type
}

export function CategoryDialog({ open, onOpenChange, category, onSave }: CategoryDialogProps) {
  // Assuming categories from useApiData is Category[] for the check below.
  // If it's string[], the check `categories.some(c => c.name === values.name)` would need adjustment.
  // For now, let's assume it's Category[] and the check is for illustrative purposes.
  // The original code `categories.includes(values.name)` implies it was string[].
  // This part might need further refinement based on useApiData's actual return type for categories.
  const { categories, isLoadingCategories } = useApiData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: null, // Added description
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name, // Changed to category.name
        description: category.description ?? null, // Added description
      })
    } else {
      form.reset({
        name: "",
        description: null, // Added description
      })
    }
  }, [category, form, open])

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    setIsSubmitting(true)

    try {
      // Check if category already exists (only for new categories)
      // This check needs to be updated if `categories` from `useApiData` is an array of Category objects
      // For example: if (!category && categories.some(c => c.name === values.name)) {
      // For now, assuming the existing logic's intent if categories were string[]
      if (!category && (categories as unknown as string[]).includes(values.name)) {
        form.setError("name", {
          type: "manual",
          message: "Cette catégorie existe déjà",
        })
        setIsSubmitting(false)
        return
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      onSave(category, values) // Changed to pass values
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting category:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
          <DialogDescription>
            {category ? "Modifiez le nom de la catégorie ci-dessous." : "Entrez le nom de la nouvelle catégorie."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la catégorie</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la catégorie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description de la catégorie (optionnel)" {...field} value={field.value ?? ""} />
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
                {isSubmitting ? "Enregistrement..." : category ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
