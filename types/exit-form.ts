import { Product } from "./product"; // Import the Product type

export interface ExitItem {
  id: string;
  product: Product; // Changed from productId and productName
  quantity: number;
}

export interface ExitForm {
  id: string
  reference: string
  date: string
  destination: string
  reason: string;
  notes: string;
  status: "draft" | "pending" | "completed";
  items: ExitItem[];
  total?: number; // Add total, make it optional if not always provided by API
}
