"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Edit, MoreHorizontal, Package, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useApiData } from "@/hooks/use-api-data"
import type { Supplier } from "@/types/supplier"
import { Pagination } from "@/components/ui/pagination"
import { SupplierDialog } from "./supplier-dialog"
import { SupplierProductsDialog } from "./supplier-products-dialog"

export function SuppliersContent() {
  const { suppliers, deleteSupplier, isLoadingSuppliers } = useApiData()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [productsDialogOpen, setProductsDialogOpen] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null)
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])

  const itemsPerPage = 10

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let result = [...suppliers]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone.includes(searchTerm),
      )
    }

    setFilteredSuppliers(result)
    setCurrentPage(1)
  }, [suppliers, searchTerm])

  const pageCount = Math.ceil(filteredSuppliers.length / itemsPerPage)
  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAddSupplier = () => {
    setCurrentSupplier(null)
    setDialogOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setDialogOpen(true)
  }

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      deleteSupplier(supplierId)
    }
  }

  const handleViewProducts = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setProductsDialogOpen(true)
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
          <h2 className="text-2xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">Gérez vos fournisseurs et leurs produits associés</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleAddSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un fournisseur
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des fournisseurs</CardTitle>
          <CardDescription>{filteredSuppliers.length} fournisseurs trouvés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher un fournisseur..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun fournisseur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell className="truncate max-w-xs">{supplier.address}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewProducts(supplier)}>
                              <Package className="mr-2 h-4 w-4" />
                              Voir produits
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={currentSupplier} />

      <SupplierProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        supplier={currentSupplier}
      />
    </div>
  )
}
