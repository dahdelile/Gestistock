"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Box, ClipboardList, Home, LogOut, Package, ShoppingCart, Tag, Truck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GestistockLogo } from "@/components/gestistock-logo"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive?: boolean
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-primary/10",
        isActive ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:text-primary dark:text-gray-300",
      )}
    >
      {icon}
      {title}
    </Link>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const isAdmin = user?.role === "admin"
  const isManager = user?.role === "magasinier"

  return (
    <div className="hidden border-r bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center border-b px-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <GestistockLogo size={36} />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-700 bg-clip-text text-transparent">
            GESTISTOCK
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="px-3 py-6">
            <h3 className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Menu principal
            </h3>
            <nav className="grid gap-1.5 px-3">
              <SidebarItem
                href="/dashboard"
                icon={<Home className="h-4.5 w-4.5" />}
                title="Tableau de bord"
                isActive={pathname === "/dashboard"}
              />
              <SidebarItem
                href="/products"
                icon={<Package className="h-4.5 w-4.5" />}
                title="Produits"
                isActive={pathname.startsWith("/products")}
              />
              <SidebarItem
                href="/stocks"
                icon={<Box className="h-4.5 w-4.5" />}
                title="Stocks"
                isActive={pathname.startsWith("/stocks")}
              />
            </nav>
          </div>

          {/* Section Opérations - visible uniquement pour les admins */}
          {  (
            <div className="px-3 py-6">
              <h3 className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Opérations
              </h3>
              <nav className="grid gap-1.5 px-3">
                <SidebarItem
                  href="/entries"
                  icon={<ShoppingCart className="h-4.5 w-4.5" />}
                  title="Bons d'entrée"
                  isActive={pathname.startsWith("/entries")}
                />
                <SidebarItem
                  href="/exits"
                  icon={<ClipboardList className="h-4.5 w-4.5" />}
                  title="Bons de sortie"
                  isActive={pathname.startsWith("/exits")}
                />
                {isAdmin && (
                  <SidebarItem
                  href="/suppliers"
                  icon={<Truck className="h-4.5 w-4.5" />}
                  title="Fournisseurs"
                  isActive={pathname.startsWith("/suppliers")}
                />
                )}
                
              
              </nav>
            </div>
          )}

          {/* Section Administration - visible uniquement pour les admins */}
          {isAdmin && (
            <div className="px-3 py-6">
              <h3 className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Administration
              </h3>
              <nav className="grid gap-1.5 px-3">
                <SidebarItem
                  href="/categories"
                  icon={<Tag className="h-4.5 w-4.5" />}
                  title="Catégories"
                  isActive={pathname.startsWith("/categories")}
                />
                <SidebarItem
                  href="/users"
                  icon={<Users className="h-4.5 w-4.5" />}
                  title="Utilisateurs"
                  isActive={pathname.startsWith("/users")}
                />
              </nav>
            </div>
          )}

        </ScrollArea>
        <div className="border-t p-4 dark:border-gray-800">
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-medium">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium dark:text-white">{user?.name}</span>
              <span className="text-xs text-gray-500 capitalize dark:text-gray-400">{user?.role}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-2 w-full justify-start rounded-lg border-gray-200 hover:bg-gray-100 hover:text-primary dark:border-gray-700 dark:hover:bg-gray-800"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}
