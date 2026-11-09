"use client"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const lightChartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
}

const darkChartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
}

type ChartProps = {
  type: "bar" | "line" | "pie"
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  className?: string
  useCustomColors?: boolean
}

export function Chart({
  type,
  data,
  index,
  categories,
  colors = ["primary"],
  valueFormatter = (value: number) => value.toString(),
  className,
  useCustomColors = false,
}: ChartProps) {
  const { theme } = useTheme()
  const [chartColors, setChartColors] = useState(lightChartColors)

  useEffect(() => {
    setChartColors(theme === "dark" ? darkChartColors : lightChartColors)
  }, [theme])

  const mappedColors = useCustomColors
    ? colors
    : colors.map((color) => chartColors[color as keyof typeof chartColors] || color)

  if (type === "bar") {
    return (
      <div className={cn("w-full h-full", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey={index}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              formatter={(value: number) => [valueFormatter(value), ""]}
              labelStyle={{ fontSize: 12, fontWeight: 500, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              itemStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
              cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }} />
            {categories.map((category, i) => (
              <Bar
                key={category}
                dataKey={category}
                fill={mappedColors[i % mappedColors.length]}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "line") {
    return (
      <div className={cn("w-full h-full", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey={index}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              formatter={(value: number) => [valueFormatter(value), ""]}
              labelStyle={{ fontSize: 12, fontWeight: 500, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              itemStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
              cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }} />
            {categories.map((category, i) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={mappedColors[i % mappedColors.length]}
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "pie") {
    const RADIAN = Math.PI / 180
    const renderCustomizedLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
    }: {
      cx: number
      cy: number
      midAngle: number
      innerRadius: number
      outerRadius: number
      percent: number
    }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5
      const x = cx + radius * Math.cos(-midAngle * RADIAN)
      const y = cy + radius * Math.sin(-midAngle * RADIAN)

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={12}
          fontWeight={500}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      )
    }

    return (
      <div className={cn("w-full h-full", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="80%"
              dataKey={categories[0]}
              nameKey={index}
            >
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    useCustomColors
                      ? entry.fill || mappedColors[i % mappedColors.length]
                      : mappedColors[i % mappedColors.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [valueFormatter(value), ""]}
              labelStyle={{ fontSize: 12, fontWeight: 500, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              itemStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: theme === "dark" ? "#f3f4f6" : "#111827" }} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
