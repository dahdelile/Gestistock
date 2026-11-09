"use client"

import { useApiData } from "@/hooks/use-api-data"
import { useEffect, useState } from "react"
import { Chart } from "@/components/ui/chart"
import { useTheme } from "next-themes"

// Palette de couleurs pour les catégories
const categoryColors = [
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#8b5cf6", // violet-500 (répété si besoin)
]

export function ProductCategoryChart() {
  const { products, isLoadingProducts } = useApiData()
  const [chartData, setChartData] = useState<any[]>([])
  const { theme } = useTheme()
  const [colors, setColors] = useState<string[]>(categoryColors)

  useEffect(() => {
    // Process data for chart
    const categories = products.reduce((acc: Record<string, number>, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += 1
      return acc
    }, {})

    const data = Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      fill: categoryColors[index % categoryColors.length],
    }))

    setChartData(data)
  }, [products])

  // Mettre à jour les couleurs si le thème change
  useEffect(() => {
    if (theme === "dark") {
      // Ajuster les couleurs pour le mode sombre si nécessaire
      setColors(categoryColors.map((color) => color))
    } else {
      setColors(categoryColors)
    }
  }, [theme])

  return (
    <div className="h-[300px]">
      <Chart
        type="pie"
        data={chartData}
        index="name"
        categories={["value"]}
        colors={colors}
        valueFormatter={(value) => `${value} produits`}
        className="h-full"
        useCustomColors={true}
      />
    </div>
  )
}
