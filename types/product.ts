import { Category } from './category';
export interface Product {
  id: string
  reference: string
  name: string
  description: string
  category: Category;
  price: number
  quantity: number
  min_stock: number
}
