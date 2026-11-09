import api from "@/lib/api";
import { Supplier } from "@/types/supplier";

export const supplierService = {
  getAll: async (): Promise<Supplier[]> => {
    try { // Add try-catch for robustness
      const response = await api.get<any>("/suppliers"); // Fetch as `any` to inspect structure
      const responseData = response.data;
  
      // Handle potential '+' prefix if it's a common issue across services
      let dataToParse = responseData;
      if (typeof responseData === 'string' && responseData.startsWith('+')) {
        console.warn('[supplierService.getAll] Detected response string starting with "+". Attempting to strip and parse.');
        try {
          dataToParse = JSON.parse(responseData.substring(1));
        } catch (e) {
          console.error('[supplierService.getAll] Failed to parse response string after stripping "+":', e);
          dataToParse = null; // Set to null to fall into error handling
        }
      }
  
      if (Array.isArray(dataToParse)) {
        return dataToParse as Supplier[];
      }
      if (dataToParse && Array.isArray(dataToParse.data)) {
        return dataToParse.data as Supplier[];
      }
      if (dataToParse && Array.isArray(dataToParse.suppliers)) {
        return dataToParse.suppliers as Supplier[];
      }
      console.warn(
        "[supplierService.getAll] Unexpected data structure from /suppliers endpoint. Expected an array or an object with a 'data' or 'suppliers' array property. Received:",
        dataToParse
      );
      return []; // Default to empty array
    } catch (error) {
      console.error("[supplierService.getAll] Error fetching suppliers:", error);
      return []; // Default to empty array on any fetching/parsing error
    }
  },
  
  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },
  
  create: async (supplier: Omit<Supplier, "id">): Promise<Supplier> => {
    const response = await api.post<Supplier>("/suppliers", supplier);
    return response.data;
  },
  
  update: async (supplier: Supplier): Promise<Supplier> => {
    console.log('[SupplierService] update called with ID:', supplier.id, 'data:', supplier);
    const endpoint = `/suppliers/${supplier.id}`;
    console.log('[SupplierService] API endpoint:', endpoint);
    try {
      const response = await api.put<Supplier>(endpoint, supplier);
      console.log('[SupplierService] API update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[SupplierService] API update error:', error);
      throw error; // Re-throw the error to be caught by the calling function
    }
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  }
};
