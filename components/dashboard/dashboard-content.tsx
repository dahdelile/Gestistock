"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, DollarSign, Package, FolderOpen } from "lucide-react"
import { RecentMovements } from "./recent-movements"
import { useEffect, useState } from "react"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/hooks/use-auth"

export function DashboardContent() {
  const { products, categories, stockMovements, isLoadingProducts, isLoadingCategories, isLoadingStockMovements } = useApiData()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockAlerts: 0,
    totalValue: 0,
    movementsToday: 0,
    entriesValue: 0,
    exitsValue: 0,
    totalCategories: 0,
  })

  const isAdmin = user?.role === "admin"
  const isManager = user?.role === "magasinier"
  
  console.log("[DASHBOARD CONTENT] Products data:", products);
  console.log("[DASHBOARD CONTENT] Products length:", products.length);
  console.log("[DASHBOARD CONTENT] isLoadingProducts:", isLoadingProducts);
  console.log("[DASHBOARD CONTENT] Categories data:", categories);
  console.log("[DASHBOARD CONTENT] Categories length:", categories.length);
  console.log("[DASHBOARD CONTENT] isLoadingCategories:", isLoadingCategories);
  console.log("[DASHBOARD CONTENT] Stock movements:", stockMovements);
  console.log("[DASHBOARD CONTENT] isLoadingStockMovements:", isLoadingStockMovements);

    useEffect(() => {
    if (!isLoadingProducts && !isLoadingStockMovements && !isLoadingCategories) {
      // Calculate dashboard stats
      const totalProducts = products.length
      const lowStockAlerts = products.filter((p) => p.quantity < p.min_stock).length
      const totalValue = products.reduce((sum, product) => sum + product.price * product.quantity, 0)
      const totalCategories = categories.length

      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to start of today in local timezone
      const movementsToday = stockMovements.filter((m) => {
        const movementDate = new Date(m.date)
        return movementDate >= today && movementDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }).length

      // Calculate entries and exits values for the last 7 days
      const last7Days = new Date()
      last7Days.setDate(last7Days.getDate() - 7)
      const last7DaysIso = last7Days.toISOString()

      const recentEntries = stockMovements.filter((m) => new Date(m.date) > last7Days && m.type === "entry")
      const recentExits = stockMovements.filter((m) => new Date(m.date) > last7Days && m.type === "exit")

      const entriesValue = recentEntries.reduce((sum, movement) => {
        const product = products.find((p) => p.id === movement.product.id)
        return sum + (product ? product.price * movement.quantity : 0)
            }, 0)

      const exitsValue = recentExits.reduce((sum, movement) => {
        const product = products.find((p) => p.id === movement.product.id)
        return sum + (product ? product.price * movement.quantity : 0)
      }, 0)

      setStats({
        totalProducts,
        lowStockAlerts,
        totalValue,
        movementsToday,
        entriesValue,
        exitsValue,
        totalCategories,
      })
    }
  }, [products, categories, stockMovements, isLoadingProducts, isLoadingCategories, isLoadingStockMovements])

  if (isLoadingProducts || isLoadingStockMovements || isLoadingCategories) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }
  

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits en stock</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits sous le seuil minimum</p>
          </CardContent>
        </Card>
  
    {isAdmin && (                
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalValue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valeur du stock actuel</p>
          </CardContent>
        </Card>         )}
        
        {isManager && (
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900/20">
              <FolderOpen className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">Catégories disponibles</p>
          </CardContent>
        </Card>
         )}
        
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouvements Aujourd'hui</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/20">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.movementsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Entrées et sorties du jour</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          

          <Card className="dashboard-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Mouvements Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentMovements />
            </CardContent>
          </Card>
        </div>

        
      </div>
    </div>
  )
}
