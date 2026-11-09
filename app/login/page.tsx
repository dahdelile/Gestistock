"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GestistockLogo } from "@/components/gestistock-logo"

const formSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  }),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("[LOGIN] Form submitted with values:", { email: values.email, password: "***" })
    setIsLoading(true)
    setError("")

    try {
      console.log("[LOGIN] Calling login function...")
      await login(values.email, values.password)
      console.log("[LOGIN] Login successful, redirecting to dashboard...")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[LOGIN] Login failed:", error)
      const errorMessage = error?.response?.data?.message || "Email ou mot de passe incorrect."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      console.log("[LOGIN] Login process completed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md animate-in">
        <div className="flex justify-center mb-6">
          <GestistockLogo size={80} />
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">GESTISTOCK</CardTitle>
            <CardDescription className="text-muted-foreground">
              Connectez-vous pour gérer votre inventaire
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm animate-in">
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemple.com" {...field} className="h-11 rounded-lg" />
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
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="h-11 rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11 rounded-lg mt-2 transition-all" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t pt-4">
            <div className="text-sm text-center text-muted-foreground">Comptes de démonstration</div>
            <div className="grid grid-cols-1 gap-3 w-full">
              <div className="p-3 bg-secondary/50 rounded-lg border border-secondary text-sm">
                <p className="font-medium text-primary mb-1">Admin</p>
                <p className="text-muted-foreground">admin@gestistock.com / admin123</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg border border-secondary text-sm">
                <p className="font-medium text-primary mb-1">Magasinier</p>
                <p className="text-muted-foreground">magasinier@gestistock.com / maga123</p>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>© 2023 GESTISTOCK. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}
