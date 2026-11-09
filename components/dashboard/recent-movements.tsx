"use client"

import { useApiData } from "@/hooks/use-api-data"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

interface Movement {
  id: string
  productName: string
  type: "entry" | "exit"
  quantity: number
  date: Date // Keep as Date, but parse it
  createdAt: Date // Keep as Date, but parse it
}

export function RecentMovements() {
  const { stockMovements, isLoadingStockMovements } = useApiData() // Removed products and isLoadingProducts
  const [recentMovements, setRecentMovements] = useState<Movement[]>([])

  useEffect(() => {
    const movements = stockMovements
      .map((movement) => ({
        id: movement.id,
        productName: movement.product?.name || "Produit inconnu",
        type: movement.type,
        quantity: movement.quantity,
        date: new Date(movement.date), // Convert string to Date object
        createdAt: new Date(movement.created_at), // Convert string to Date object
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by movement date (most recent first)
      .slice(0, 5); // Take the top 5 most recent movements from today

    setRecentMovements(movements);
  }, [stockMovements]);

  return (
    <div className="space-y-4">
      {recentMovements.map((movement) => (
        <div
          key={movement.id}
          className="flex items-center justify-between space-x-4 rounded-lg p-3 transition-colors hover:bg-muted/50 dark:hover:bg-gray-800/50"
        >
          <div className="flex items-center space-x-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                movement.type === "entry"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {movement.type === "entry" ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium dark:text-gray-200">{movement.productName}</p>
              <p className="text-xs text-muted-foreground">
                {movement.date.toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div
            className={`text-sm font-medium ${
              movement.type === "entry" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {movement.type === "entry" ? "+" : "-"}
            {movement.quantity}
          </div>
        </div>
      ))}
    </div>
  )
}
