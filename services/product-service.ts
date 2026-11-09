import api from "@/lib/api";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

// Helper function to parse response data
const parseApiResponse = <T>(data: any): T => {
  if (typeof data === 'string' && data.startsWith('+')) {
    try {
      return JSON.parse(data.substring(1)) as T;
    } catch (error) {
      console.error("Failed to parse API response:", error);
      // Depending on T, you might want to return a default value like [] or {}
      // For now, rethrow or return as is if T could be something else
      throw new Error("Invalid JSON response from API after removing '+': " + (error as Error).message);
    }
  }
  return data as T;
};

// Transform product data to match our interface
const transformProduct = (product: any): Product => {
  return {
    ...product,
    id: String(product.id), // Ensure id is a string
    price: Number(product.price),
    quantity: Number(product.quantity),
    min_stock: Number(product.min_stock),
    // category handling might need to be more robust if it's an object
    // and Category type expects a simpler structure or just an ID.
    // For now, assuming product.category is compatible or will be handled by component.
    category: product.category,
  };
};

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<any>("/products");
    console.log("[PRODUCT SERVICE] Raw response data:", response.data);
    
    // Ensure response.data is parsed correctly
    const parsedData = parseApiResponse<any>(response.data);
    console.log("[PRODUCT SERVICE] Parsed data:", parsedData);
    
    // Extract products from the nested data structure
    const products = parsedData?.data || parsedData;
    console.log("[PRODUCT SERVICE] Extracted products:", products);
    
    // Transform products to ensure category is a string
    const transformedProducts = Array.isArray(products) ? products.map(transformProduct) : [];
    console.log("[PRODUCT SERVICE] Transformed products:", transformedProducts);
    
    return transformedProducts;
  },
    getById: async (id: string): Promise<Product> => {
    const response = await api.get<any>(`/products/${id}`);
    // Assuming single product response might also be prefixed
    const productData = parseApiResponse<any>(response.data);
    return transformProduct(productData);
  },
  
  create: async (product: Omit<Product, "id">): Promise<Product> => {
    const dataToSend = {
      ...product,
      category_id: product.category?.id, // Extract category_id from the category object
    };
    // The backend expects category_id, not the full category object for creation.
    // Remove the category object from the payload to prevent validation errors.
    delete (dataToSend as Partial<Product>).category; 

    const response = await api.post<Product>("/products", dataToSend);
    return parseApiResponse<Product>(response.data);
  },
  
  update: async (product: Product): Promise<Product> => {
    const dataToSend = {
      ...product,
      category_id: product.category?.id, // Ensure category_id is sent, not the full category object
    };
    // Remove the category object if it exists, as the backend expects category_id
    delete (dataToSend as any).category;
    
    const response = await api.put<Product>(`/products/${product.id}`, dataToSend);
    return parseApiResponse<Product>(response.data);
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
  getCategories: async (): Promise<Category[]> => {
    console.log("[PRODUCT SERVICE] Get categories request");
    try {
      const response = await api.get<any>("/products/categories");
      console.log("[PRODUCT SERVICE] Raw categories response:", response.data);

      let parsedData: any;
      if (typeof response.data === 'string') {
        const cleanData = response.data.startsWith('+') ? response.data.substring(1) : response.data;
        parsedData = JSON.parse(cleanData);
      } else {
        parsedData = response.data;
      }
      console.log("[PRODUCT SERVICE] Parsed categories data:", parsedData);

      if (parsedData.success && parsedData.data) {
        return parsedData.data as Category[];
      } else {
        console.error("[PRODUCT SERVICE] Error fetching categories:", parsedData.message);
        return [];
      }
    } catch (error) {
      console.error("[PRODUCT SERVICE] Error fetching categories:", error);
      return [];
    }
  },

  createCategory: async (name: string, description: string | null): Promise<Category> => {
    const response = await api.post<Category>("/categories", { name, description });
    return parseApiResponse<Category>(response.data);
  },

  updateCategory: async (id: number, name: string, description: string | null): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, { name, description });
    return parseApiResponse<Category>(response.data);
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
