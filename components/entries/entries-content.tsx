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
import { EntryDialog } from "./entry-dialog"
import { EntryDetailsDialog } from "./entry-details-dialog"
import type { EntryForm } from "@/types/entry-form"
import { entryFormService } from "@/services/entry-form-service"
import { useToast } from "@/components/ui/use-toast"


export function EntriesContent() {
  const { entryForms, suppliers, deleteEntryForm, isLoadingEntryForms, isLoadingSuppliers, refreshEntryForms } = useApiData()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<EntryForm | null>(null)
  const [filteredEntries, setFilteredEntries] = useState<EntryForm[]>([])
  const [isProcessing, setIsProcessing] = useState<string | null>(null) // To track which entry is being processed

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
    let result = [...entryForms]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (entry) =>
          entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
console.log("[EntriesContent] entryForms length:", entryForms.length);
console.log("[EntriesContent] searchTerm:", searchTerm);
console.log("[EntriesContent] filteredEntries after search/sort:", result.length);
setFilteredEntries(result)
setCurrentPage(1)
}, [entryForms, searchTerm])

const pageCount = Math.ceil(filteredEntries.length / itemsPerPage)
console.log("[EntriesContent] itemsPerPage:", itemsPerPage);
console.log("[EntriesContent] calculated pageCount:", pageCount);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAddEntry = () => {
    setSelectedEntry(null)
    setDialogOpen(true)
  }

  const handleViewEntry = (entry: EntryForm) => {
    setSelectedEntry(entry)
    setDetailsDialogOpen(true)
  }

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon d'entrée ?")) {
      deleteEntryForm(entryId)
    }
  }

  const handlePrintEntry = (entry: EntryForm) => {
    // Mock print functionality
    alert(`Impression du bon d'entrée ${entry.reference}`)
  }
   const handleValidate = async (entry: EntryForm) => {
    if (!entry || !entry.id) return
 
    setIsProcessing(entry.id)
    try {
      await entryFormService.completeEntryForm(entry.id)
      toast({
        title: "Bon d'entrée validé",
        description: `Le bon d'entrée ${entry.reference} a été validé avec succès.`,
        variant: "default",
      })
      refreshEntryForms() // Refresh entry forms data only (no stock changes during validation)
    } catch (error) {
      console.error("[EntriesContent] Error validating entry form:", error)
      toast({
        title: "Erreur de validation",
        description: `Échec de la validation du bon d'entrée ${entry.reference}.`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
  }
   const handleCancel = async (entry: EntryForm) => {
    if (!entry || !entry.id) return
 
    setIsProcessing(entry.id)
    try {
      await entryFormService.cancelEntryForm(entry.id)
      toast({
        title: "Bon d'entrée annulé",
        description: `Le bon d'entrée ${entry.reference} a été annulé avec succès.`,
        variant: "default",
      })
      refreshEntryForms() // Refresh entry forms data only (no stock changes during cancellation)
    } catch (error) {
      console.error("[EntriesContent] Error cancelling entry form:", error)
      toast({
        title: "Erreur d'annulation",
        description: `Échec de l'annulation du bon d'entrée ${entry.reference}.`,
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
          <h2 className="text-2xl font-bold tracking-tight">Bons d'entrée</h2>
          <p className="text-muted-foreground">Gérez les entrées de stock et les livraisons</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleAddEntry}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau bon d'entrée
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des bons d'entrée</CardTitle>
          <CardDescription>{filteredEntries.length} bons d'entrée trouvés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher par référence ou fournisseur..."
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
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>      
                  {isAdmin && 
                  <TableHead className="text-right">Validation</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.length === 0 ? (
                  <TableRow key="empty-entries-row">
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                      Aucun bon d'entrée trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.reference}</TableCell>
                      <TableCell>{new Date(entry.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{entry.supplierName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "completed"
                                ? "success"
                                : entry.status === "pending"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {entry.status === "completed"
                            ? "Complété"
                            : entry.status === "pending"
                                ? "En attente"
                                : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof entry.total === 'number'
                          ? entry.total.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              })
                          : "0,00 €"}
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
                            <DropdownMenuItem onClick={() => handleViewEntry(entry)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => handleDeleteEntry(entry.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer                            
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {(entry.status === "draft" || entry.status === "pending") && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(entry)}
                                disabled={isProcessing === entry.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleValidate(entry)}
                                disabled={isProcessing === entry.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Valider
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
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

      <EntryDialog open={dialogOpen} onOpenChange={setDialogOpen} suppliers={suppliers} />

      <EntryDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        entry={selectedEntry}
        onEntryFormUpdated={() => {
          // This will trigger a re-fetch of entry forms in useApiData
          // which will then update the filteredEntries and re-render the table.
          // No explicit action needed here other than closing the dialog.
        }}
      />
    </div>
  )
}
