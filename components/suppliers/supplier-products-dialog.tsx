"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Supplier } from "@/types/supplier"
import { useApiData } from "@/hooks/use-api-data"
import { useEffect, useState } from "react"
import type { Product } from "@/types/product"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SupplierProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function SupplierProductsDialog({ open, onOpenChange, supplier }: SupplierProductsDialogProps) {
  const { products, isLoadingProducts } = useApiData()
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([])

  useEffect(() => {
    if (supplier) {
      // In a real app, we would fetch products by supplier ID
      // For this mock, we'll just filter randomly based on supplier ID
      const filteredProducts = products.filter(
        (product) => Number.parseInt(String(product.id).charAt(0), 16) % 3 === Number.parseInt(String(supplier.id).charAt(0), 16) % 3,
      )
      setSupplierProducts(filteredProducts)
    }
  }, [supplier, products])

  const filteredProducts = supplierProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Produits du fournisseur</DialogTitle>
          <DialogDescription>{supplier.name} - Liste des produits associés</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher un produit..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun produit trouvé pour ce fournisseur.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.reference}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category?.name || 'No Category'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
