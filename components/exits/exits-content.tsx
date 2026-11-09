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
import { CheckCircle, Download, Eye, MoreHorizontal, Plus, Printer, Search, Trash2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useApiData } from "@/hooks/use-api-data"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { ExitDialog } from "./exit-dialog"
import { ExitDetailsDialog } from "./exit-details-dialog"
import type { ExitForm } from "@/types/exit-form"
import { exitFormService } from "@/services/exit-form-service"
import { useToast } from "@/components/ui/use-toast"

export function ExitsContent() {
  const { exitForms, deleteExitForm, isLoadingExitForms, refreshExitForms } = useApiData()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedExit, setSelectedExit] = useState<ExitForm | null>(null)
  const [filteredExits, setFilteredExits] = useState<ExitForm[]>([])
  const [isProcessing, setIsProcessing] = useState<string | null>(null) // To track which exit is being processed

  const isAdmin = user?.role === "admin"

  const itemsPerPage = 10

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let result = [...exitForms]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (exit) =>
          exit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exit.destination.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredExits(result)
    setCurrentPage(1)
  }, [exitForms, searchTerm])

  const pageCount = Math.ceil(filteredExits.length / itemsPerPage)
  const paginatedExits = filteredExits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAddExit = () => {
    setSelectedExit(null)
    setDialogOpen(true)
  }

  const handleViewExit = (exit: ExitForm) => {
    setSelectedExit(exit)
    setDetailsDialogOpen(true)
  }

  const handleDeleteExit = (exitId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de sortie ?")) {
      deleteExitForm(exitId)
    }
  }

  const handlePrintExit = (exit: ExitForm) => {
    // Mock print functionality
    alert(`Impression du bon de sortie ${exit.reference}`)
  }

  const handleValidate = async (exit: ExitForm) => {
    if (!exit || !exit.id) return

    setIsProcessing(exit.id)
    try {
      await exitFormService.completeExitForm(exit.id)
      toast({
        title: "Bon de sortie validé",
        description: `Le bon de sortie ${exit.reference} a été validé avec succès.`,
        variant: "default",
      })
      refreshExitForms() // Refresh exit forms data only (no stock changes during validation)
    } catch (error) {
      console.error("[ExitsContent] Error validating exit form:", error)
      toast({
        title: "Erreur de validation",
        description: `Échec de la validation du bon de sortie ${exit.reference}.`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
  }

  const handleCancel = async (exit: ExitForm) => {
    if (!exit || !exit.id) return

    setIsProcessing(exit.id)
    try {
      await exitFormService.cancelExitForm(exit.id)
      toast({
        title: "Bon de sortie annulé",
        description: `Le bon de sortie ${exit.reference} a été annulé avec succès.`,
        variant: "default",
      })
      refreshExitForms() // Refresh exit forms data only (no stock changes during cancellation)
    } catch (error) {
      console.error("[ExitsContent] Error cancelling exit form:", error)
      toast({
        title: "Erreur d'annulation",
        description: `Échec de l'annulation du bon de sortie ${exit.reference}.`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Bons de sortie</h2>
          <p className="text-muted-foreground">Gérez les sorties de stock</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleAddExit}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau bon de sortie
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des bons de sortie</CardTitle>
          <CardDescription>{filteredExits.length} bons de sortie trouvés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher par référence ou destination..."
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
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  {isAdmin && <TableHead className="text-right">Validation</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExits.length === 0 ? (
                  <TableRow key="no-exits-row">
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                      Aucun bon de sortie trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExits.map((exit, index) => {
                    // Calculate total for the current exit form
                    const currentExitTotal = exit.items.reduce((acc, item) => {
                      const price = item.product?.price || 0;
                      return acc + (price * item.quantity);
                    }, 0);

                    return (
                      <TableRow key={`${exit.id}-${index}`}>
                        <TableCell className="font-medium">{exit.reference}</TableCell>
                        <TableCell>
                          {(exit.date && !isNaN(new Date(exit.date).getTime())) 
                            ? new Date(exit.date).toLocaleDateString("fr-FR") 
                            : "N/A"}
                        </TableCell>
                        <TableCell>{exit.destination}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              exit.status === "completed" ? "success" : exit.status === "pending" ? "warning" : "default"
                            }
                          >
                            {exit.status === "completed"
                              ? "Complété"
                              : exit.status === "pending"
                                ? "En attente"
                                : "Brouillon"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {currentExitTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewExit(exit)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => handleDeleteExit(exit.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {(exit.status === "draft" || exit.status === "pending") && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(exit)}
                                  disabled={isProcessing === exit.id}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleValidate(exit)}
                                  disabled={isProcessing === exit.id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Valider
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
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

      <ExitDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <ExitDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} exit={selectedExit} />
    </div>
  )
}
