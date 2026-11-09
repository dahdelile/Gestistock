"use client"

import { FormDescription } from "@/components/ui/form"

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
import type { User } from "@/types/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useApiData } from "@/hooks/use-api-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "magasinier"]),
  active: z.boolean(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional().or(z.literal("")),
})

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { addUser, updateUser } = useApiData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: undefined,
      name: "",
      email: "",
      role: "magasinier",
      active: true,
      password: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        id: user.id === null ? undefined : user.id, // Coerce null to undefined for the form state
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        password: "",
      })
    } else {
      form.reset({
        id: undefined,
        name: "",
        email: "",
        role: "magasinier",
        active: true,
        password: "",
      })
    }
  }, [user, form, open])

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    console.log("[UserDialog] onSubmit - form values:", values);
    setIsSubmitting(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const userData: Partial<User> = {
        name: values.name,
        email: values.email,
        role: values.role,
        active: values.active,
      };

      if (values.password) {
        userData.password = values.password;
      }

      console.log("[UserDialog] onSubmit - current user prop:", user);
      if (user) {
        // For updateUser, the password field in User type is optional.
        // If values.password is empty, it won't be sent, which is fine for updates.
        // The updateUser function expects a single User object.
        const updatedUserData: User = {
          id: user.id, // Include the user's ID
          name: userData.name!,
          email: userData.email!,
          role: userData.role!,
          active: userData.active!,
        };
        if (userData.password) { // Only include password if it's being changed
          updatedUserData.password = userData.password;
        }
        console.log("[UserDialog] onSubmit - userData for update:", updatedUserData);
        await updateUser(updatedUserData);
      } else {
        // For addUser, ensure password is included if provided.
        // The API expects it for new users.
        // The addUser function expects Omit<User, "id">
        const newUserData: Omit<User, "id"> = {
          name: values.name,
          email: values.email,
          role: values.role,
          active: values.active,
        };
        if (values.password) {
          newUserData.password = values.password;
        }
        await addUser(newUserData);
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Modifiez les informations de l'utilisateur ci-dessous."
              : "Remplissez les informations pour créer un nouvel utilisateur."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => { console.error("[UserDialog] Form Validation Errors:", errors); })} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom complet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={user ? "Laisser vide pour ne pas changer" : "Mot de passe"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="magasinier">Magasinier</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Actif</FormLabel>
                    <FormDescription>L'utilisateur peut-il se connecter à l'application ?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : user ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
