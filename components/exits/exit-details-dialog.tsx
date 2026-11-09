"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ExitForm } from "@/types/exit-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'

interface ExitDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exit: ExitForm | null
}

export function ExitDetailsDialog({ open, onOpenChange, exit }: ExitDetailsDialogProps) {
  if (!exit) return null

  const handlePrint = () => {
    if (!exit) return;

    console.log("[ExitDetailsDialog] Starting NATIVE PDF generation for:", exit.reference);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageMargin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = pageMargin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Bon de sortie: ${exit.reference}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 30;

    // Details section
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Détails du bon de sortie", pageMargin, currentY);
    currentY += 15;

    // Destination & Date
    doc.text("Destination:", pageMargin, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(exit.destination, pageMargin + 70, currentY); // Adjust X offset as needed

    const dateText = `Date: ${new Date(exit.date).toLocaleDateString("fr-FR")}`;
    const dateTextWidth = doc.getTextWidth(dateText);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", pageWidth - pageMargin - dateTextWidth - 35, currentY); // Adjust positioning
    doc.setFont("helvetica", "bold");
    doc.text(new Date(exit.date).toLocaleDateString("fr-FR"), pageWidth - pageMargin - doc.getTextWidth(new Date(exit.date).toLocaleDateString("fr-FR")), currentY);
    currentY += 15;
    
    // Reason
    doc.setFont("helvetica", "normal");
    doc.text("Raison:", pageMargin, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(exit.reason, pageMargin + 70, currentY); // Adjust X offset
    currentY += 25;


    // Products Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Produits", pageMargin, currentY);
    currentY += 5; // Small gap before table

    const tableColumnStyles = {
      0: { cellWidth: 'auto' as const }, // Product name
      1: { cellWidth: 60, halign: 'right' as const }, // Quantity
      2: { cellWidth: 70, halign: 'right' as const }, // Unit Price
      3: { cellWidth: 70, halign: 'right' as const }, // Total
    } as any;

    const head = [["Produit", "Quantité", "Prix Unitaire", "Total"]];
    let grandTotal = 0;
    const body = exit.items.map(item => {
      const unitPrice = item.product?.price || 0;
      const itemTotal = unitPrice * item.quantity;
      grandTotal += itemTotal;
      return [
        item.product?.name || "N/A",
        item.quantity.toString(),
        unitPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
        itemTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold', halign: 'center' },
      columnStyles: tableColumnStyles,
      margin: { left: pageMargin, right: pageMargin },
      didDrawPage: (data) => {
        currentY = data.cursor?.y || currentY;
      }
    });
    // currentY is updated by didDrawPage hook

    // Grand Total
    currentY += 10; // Add some space after the table
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const totalText = `Total Général: ${grandTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`;
    const totalTextWidth = doc.getTextWidth(totalText);
    doc.text(totalText, pageWidth - pageMargin - totalTextWidth, currentY);
    currentY += 20;

    // Notes
    if (exit.notes) {
      // currentY += 20; // Space after table (already added for grand total or use this if no grand total)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", pageMargin, currentY);
      currentY += 15;
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(exit.notes, pageWidth - (2 * pageMargin));
      doc.text(notesLines, pageMargin, currentY);
      // currentY += (notesLines.length * 12) + 10;
    }

    doc.save(`bon-sortie-${exit.reference}.pdf`);
    console.log("[ExitDetailsDialog] Native PDF generated and download initiated.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bon de sortie: {exit.reference}</span>
            <Badge
              variant={exit.status === "completed" ? "success" : exit.status === "pending" ? "warning" : "default"}
            >
              {exit.status === "completed" ? "Complété" : exit.status === "pending" ? "En attente" : "Brouillon"}
            </Badge>
          </DialogTitle>
          <DialogDescription>Détails du bon de sortie</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Destination</h3>
              <p className="mt-1">{exit.destination}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
              <p className="mt-1">{new Date(exit.date).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Raison</h3>
            <p className="mt-1">{exit.reason}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Produits</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exit.items.map((item) => {
                    const unitPrice = item.product?.price || 0;
                    const itemTotal = unitPrice * item.quantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || "Nom du produit non disponible"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {unitPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {itemTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total Général
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(exit.items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0)).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {exit.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="mt-1 whitespace-pre-line">{exit.notes}</p>
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
