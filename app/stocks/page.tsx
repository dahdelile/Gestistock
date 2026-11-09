import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StocksContent } from "@/components/stocks/stocks-content"

export default function StocksPage() {
  return (
    <DashboardLayout>
      <StocksContent />
    </DashboardLayout>
  )
}
