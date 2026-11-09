"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Menu, Bell, Search, Sun, Moon } from "lucide-react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { GestistockLogo } from "@/components/gestistock-logo"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { MobileSidebar } from "./mobile-sidebar"

export function Header() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Après le montage du composant, on peut accéder au thème
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get page title based on current path
  const getPageTitle = () => {
    const path = pathname.split("/")[1]
    switch (path) {
      case "dashboard":
        return "Tableau de bord"
      case "products":
        return "Gestion des produits"
      case "stocks":
        return "Gestion des stocks"
      case "entries":
        return "Bons d'entrée"
      case "exits":
        return "Bons de sortie"
      case "suppliers":
        return "Fournisseurs"
      case "users":
        return "Utilisateurs"
      case "categories":
        return "Gestion des catégories"
      default:
        return "GESTISTOCK"
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800 md:px-6">
      <div className="flex items-center gap-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-lg">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <SheetDescription className="sr-only">Menu de navigation principal pour mobile</SheetDescription>
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <GestistockLogo size={32} />
          <span className="font-bold bg-gradient-to-r from-primary to-purple-700 bg-clip-text text-transparent">
            GESTISTOCK
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-xl font-semibold md:text-2xl bg-gradient-to-r from-primary to-purple-700 bg-clip-text text-transparent">
          {getPageTitle()}
        </h1>
        <div className="flex items-center gap-4">
      
          <Button
            variant="outline"
            size="icon"
            className="rounded-lg border-gray-200 hover:bg-gray-100 hover:text-primary dark:border-gray-700 dark:hover:bg-gray-800"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

         

          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-medium">{user?.name?.charAt(0) || "U"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
