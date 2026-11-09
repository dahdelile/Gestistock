import { Product } from "./product";

export interface EntryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EntryForm {
  id: string;
  reference: string
  date: string
  supplierId: string
  supplierName: string
  notes: string
  status: "draft" | "pending" | "completed"
  items: EntryItem[]
  total: number
}
