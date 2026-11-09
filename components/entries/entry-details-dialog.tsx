"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { EntryForm } from "@/types/entry-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"
import jsPDF from "jspdf"
import autoTable, { ColumnInput } from 'jspdf-autotable' // Import ColumnInput
import { entryFormService } from "@/services/entry-form-service"
import { useToast } from "@/components/ui/use-toast"

interface EntryDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: EntryForm | null
  onEntryFormUpdated: () => void // Callback to refresh parent data
}

export function EntryDetailsDialog({ open, onOpenChange, entry, onEntryFormUpdated }: EntryDetailsDialogProps) {
  const { toast } = useToast()

  if (!entry) return null


  const handlePrint = () => {
    console.log("[EntryDetailsDialog] Starting NATIVE PDF generation for:", entry.reference)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const pageMargin = 40
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = pageMargin

    // Title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(`Bon d'entrée: ${entry.reference}`, pageWidth / 2, currentY, { align: "center" })
    currentY += 30

    // Details section
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Détails du bon d'entrée", pageMargin, currentY)
    currentY += 15

    doc.setFontSize(10)
    doc.text("Fournisseur:", pageMargin, currentY)
    doc.setFont("helvetica", "bold")
    doc.text(entry.supplierName, pageMargin + 70, currentY)

    const dateText = `Date: ${new Date(entry.date).toLocaleDateString("fr-FR")}`
    const dateTextWidth = doc.getTextWidth(dateText)
    doc.setFont("helvetica", "normal")
    doc.text("Date:", pageWidth - pageMargin - dateTextWidth - 35, currentY) // Adjust positioning
    doc.setFont("helvetica", "bold")
    doc.text(new Date(entry.date).toLocaleDateString("fr-FR"), pageWidth - pageMargin - doc.getTextWidth(new Date(entry.date).toLocaleDateString("fr-FR")), currentY)
    currentY += 25


    // Products Table
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Produits", pageMargin, currentY)
    currentY += 5 // Small gap before table

    const tableColumnStyles = {
      0: { cellWidth: 'auto' as const }, // Product name
      1: { cellWidth: 50, halign: 'right' as const }, // Quantity
      2: { cellWidth: 70, halign: 'right' as const }, // Unit Price
      3: { cellWidth: 70, halign: 'right' as const }, // Total
    } as any; // Type assertion to bypass strict type checking for this specific object

    const head = [["Produit", "Quantité", "Prix unitaire", "Total"]]
    const body = entry.items.map(item => [
      item.product.name || "Nom du produit non trouvé", // Access the nested product name
      item.quantity.toString(),
      item.unitPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      item.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
    ])

    autoTable(doc, {
      startY: currentY,
      head: head,
      body: body,
      theme: 'grid', // 'striped', 'grid', 'plain'
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold', halign: 'center' },
      columnStyles: tableColumnStyles,
      margin: { left: pageMargin, right: pageMargin },
      didDrawPage: (data) => { // Update currentY after table is drawn
        currentY = data.cursor?.y || currentY;
      }
    })
    // currentY is updated by didDrawPage hook

    // Grand Total
    currentY += 10 // Add some space after the table
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    const totalText = `Total Général: ${entry.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`
    const totalTextWidth = doc.getTextWidth(totalText)
    doc.text(totalText, pageWidth - pageMargin - totalTextWidth, currentY)
    currentY += 20

    // Notes
    if (entry.notes) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Notes:", pageMargin, currentY)
      currentY += 15
      doc.setFont("helvetica", "normal")
      // Use splitTextToSize for multi-line notes
      const notesLines = doc.splitTextToSize(entry.notes, pageWidth - (2 * pageMargin))
      doc.text(notesLines, pageMargin, currentY)
      currentY += (notesLines.length * 12) + 10 // Adjust based on line height
    }

    doc.save(`bon-entree-${entry.reference}.pdf`)
    console.log("[EntryDetailsDialog] Native PDF generated and download initiated.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]"> {/* Removed ref */}
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bon d'entrée: {entry.reference}</span>
            <Badge
              variant={entry.status === "completed" ? "success" : entry.status === "pending" ? "warning" : "default"}
            >
              {entry.status === "completed" ? "Complété" : entry.status === "pending" ? "En attente" : "Brouillon"}
            </Badge>
          </DialogTitle>
          <DialogDescription>Détails du bon d'entrée</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fournisseur</h3>
              <p className="mt-1">{entry.supplierName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
              <p className="mt-1">{new Date(entry.date).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Produits</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.items.map((item) => {
                    // Access the nested product name
                    const productName = item.product.name;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{productName || "Product name not found"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.unitPrice.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.total.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {entry.total.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {entry.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="mt-1 whitespace-pre-line">{entry.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
