"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ArrowDown, ArrowUp, Download, History, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/hooks/use-auth"
import { StockMovementDialog } from "./stock-movement-dialog"
import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { StockHistoryDialog } from "./stock-history-dialog"
import { Progress } from "@/components/ui/progress"

export function StocksContent() {
  const { products, categories, addStockMovement, isLoadingProducts, isLoadingCategories } = useApiData()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  const itemsPerPage = 10

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let result = [...products]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.reference.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      // Ensure product.category exists and has an id before filtering
      result = result.filter((product) => product.category && String(product.category.id) === categoryFilter)
    }

    setFilteredProducts(result)
    setCurrentPage(1)
  }, [products, searchTerm, categoryFilter])

  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEntryClick = (product: Product) => {
    setSelectedProduct(product)
    setEntryDialogOpen(true)
  }

  const handleExitClick = (product: Product) => {
    setSelectedProduct(product)
    setExitDialogOpen(true)
  }

  const handleHistoryClick = (product: Product) => {
    setSelectedProduct(product)
    setHistoryDialogOpen(true)
  }

  const handleMovementSave = (productId: string, quantity: number, type: "entry" | "exit", reason: string) => {
    if (!user) {
      // Handle case where user is not available, perhaps show an error or redirect to login
      console.error("User not authenticated")
      return
    }
    addStockMovement({
      productId,
      quantity,
      type,
      reason,
      date: new Date().toISOString(),
      user_id: user.id,
    })
    setEntryDialogOpen(false)
    setExitDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des stocks</h2>
          <p className="text-muted-foreground">Suivez et gérez les niveaux de stock</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>État des stocks</CardTitle>
          <CardDescription>{filteredProducts.length} produits trouvés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  // Use category.id as the value and category.name for display
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Niveau de stock</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.reference}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {/* Display category.name; ensure category object and name exist */}
                        <Badge variant="outline">{product.category?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Progress
                            value={(product.quantity / (product.min_stock * 3)) * 100} // Use min_stock
                            className="h-2"
                            indicatorClassName={
                              product.quantity < product.min_stock // Use min_stock
                                ? "bg-destructive"
                                : product.quantity < product.min_stock * 2 // Use min_stock
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span>Min: {product.min_stock}</span> {/* Use min_stock */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.quantity < product.min_stock && ( // Use min_stock
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span className={product.quantity < product.min_stock ? "text-destructive" : ""}> {/* Use min_stock */}
                            {product.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEntryClick(product)}>
                            <ArrowDown className="mr-1 h-4 w-4 text-green-500" />
                            Entrée
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExitClick(product)}>
                            <ArrowUp className="mr-1 h-4 w-4 text-red-500" />
                            Sortie
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleHistoryClick(product)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination pageCount={pageCount} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <StockMovementDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        product={selectedProduct}
        type="entry"
        onSave={handleMovementSave}
      />

      <StockMovementDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        product={selectedProduct}
        type="exit"
        onSave={handleMovementSave}
      />

      <StockHistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} product={selectedProduct} />
    </div>
  )
}
