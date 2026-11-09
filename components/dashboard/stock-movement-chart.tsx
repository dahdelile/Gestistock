"use client"

import { useApiData } from "@/hooks/use-api-data"
import { useEffect, useState } from "react"
import { Chart } from "@/components/ui/chart"

export function StockMovementChart() {
  const { stockMovements, isLoadingStockMovements } = useApiData()
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Get last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    // Process data for chart
    const data = dates.map((date) => {
      const entriesForDay = stockMovements.filter((m) => m.date.startsWith(date) && m.type === "entry")
      const exitsForDay = stockMovements.filter((m) => m.date.startsWith(date) && m.type === "exit")

      const entriesTotal = entriesForDay.reduce((sum, m) => sum + m.quantity, 0)
      const exitsTotal = exitsForDay.reduce((sum, m) => sum + m.quantity, 0)

      return {
        date: new Date(date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
        entrées: entriesTotal,
        sorties: exitsTotal,
      }
    })

    setChartData(data)
  }, [stockMovements])

  return (
    <div className="h-[300px]">
      <Chart
        type="bar"
        data={chartData}
        index="date"
        categories={["entrées", "sorties"]}
        colors={["#8b5cf6", "#ef4444"]}
        valueFormatter={(value) => `${value} unités`}
        className="h-full"
        useCustomColors={true}
      />
    </div>
  )
}
