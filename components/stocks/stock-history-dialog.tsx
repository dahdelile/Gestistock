"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Product } from "@/types/product"
import { stockMovementService } from "@/services/stock-movement-service" // Added
import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { StockMovement } from "@/types/stock-movement"
import { toast } from "sonner" // Added for error notifications
import { LoadingSpinner } from "@/components/ui/loading-spinner" // Added for loading state

interface StockHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function StockHistoryDialog({ open, onOpenChange, product }: StockHistoryDialogProps) {
  const [productMovements, setProductMovements] = useState<StockMovement[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false) // Added

  useEffect(() => {
    if (open && product) {
      const fetchMovements = async () => {
        setIsLoadingHistory(true)
        try {
          console.log(`Fetching stock movements for product ID: ${product.id}`)
          const movements = await stockMovementService.getByProductId(String(product.id))
          console.log(`Fetched movements for product ${product.id}:`, movements)
          setProductMovements(
            movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          )
        } catch (error) {
          console.error("Error fetching stock history:", error)
          toast.error("Erreur lors de la récupération de l'historique des mouvements.")
          setProductMovements([]) // Clear movements on error
        } finally {
          setIsLoadingHistory(false)
        }
      }
      fetchMovements()
    } else if (!open) {
      setProductMovements([]) // Clear movements when dialog is closed
      setIsLoadingHistory(false) // Reset loading state
    }
  }, [product, open, onOpenChange]) // Added onOpenChange to dependencies, though it's not directly used in the effect logic, it's good practice if it influences the dialog's lifecycle.

  if (!product && open) { // Keep dialog open if product becomes null while open (e.g. during a data refresh elsewhere)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Historique des mouvements</DialogTitle>
            <DialogDescription>Chargement des informations du produit...</DialogDescription>
          </DialogHeader>
          <div className="flex h-[400px] items-center justify-center">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  if (!product) return null // Don't render if no product and not open

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Historique des mouvements</DialogTitle>
          <DialogDescription>
            {product.name} (Ref: {product.reference})
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] min-h-[100px] overflow-y-auto"> {/* Added min-h for better loading state visibility */}
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : productMovements.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Aucun mouvement enregistré pour ce produit.</div>
          ) : (
            <div className="space-y-4">
              {productMovements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      movement.type === "entry" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {movement.type === "entry" ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {movement.type === "entry" ? "Entrée" : "Sortie"} de {movement.quantity} unité(s)
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {new Date(movement.date).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
