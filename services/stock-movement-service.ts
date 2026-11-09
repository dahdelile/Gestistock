import api from "@/lib/api";
import { StockMovement, StockMovementInput } from "@/types/stock-movement";
import { PaginationMeta } from "@/hooks/use-api-data"; // Import PaginationMeta

// Define a type for paginated responses
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// Helper function to parse response data
const parseApiResponse = <T>(data: any): T => {
  let parsedData: any;
  if (typeof data === 'string' && data.startsWith('+')) {
    try {
      parsedData = JSON.parse(data.substring(1));
    } catch (error) {
      console.error("Failed to parse API response:", error);
      throw new Error("Invalid JSON response from API after removing '+': " + (error as Error).message);
    }
  } else {
    parsedData = data;
  }

  // Recursively parse date strings into Date objects
  const parseDates = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value)) {
          obj[key] = new Date(value);
        } else if (typeof value === 'object') {
          obj[key] = parseDates(value);
        }
      }
    }
    return obj;
  };

  return parseDates(parsedData) as T;
};


export const stockMovementService = {
  getAll: async (): Promise<PaginatedResponse<StockMovement>> => {
    let allMovements: StockMovement[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    let lastMeta: PaginationMeta | undefined;

    while (hasMorePages) {
      const response = await api.get<any>("/stock-movements", { params: { page: currentPage } });
      console.log(`Stock movements raw response (page ${currentPage}):`, response.data);

      const parsedData = parseApiResponse<PaginatedResponse<StockMovement>>(response.data);
      console.log(`Stock movements parsed data (page ${currentPage}):`, parsedData);

      if (!parsedData || !Array.isArray(parsedData.data) || !parsedData.meta) {
        console.error("Invalid paginated response structure:", parsedData);
        throw new Error("Invalid paginated response structure from stock movements API.");
      }

      allMovements = allMovements.concat(parsedData.data);
      lastMeta = parsedData.meta;

      if (parsedData.links && parsedData.links.next) {
        currentPage++;
      } else {
        hasMorePages = false;
      }
    }
    
    // Return all movements and the meta from the last page
    return { data: allMovements, meta: lastMeta! };
  },
  
  create: async (movement: StockMovementInput): Promise<StockMovement> => {
    const { productId, ...rest } = movement;
    const payload = {
      ...rest,
      product_id: productId, // Map to snake_case for the API
    };
    const response = await api.post<StockMovement>("/stock-movements", payload);
    // Assuming create might also be prefixed, adjust if necessary
    return parseApiResponse<StockMovement>(response.data);
  },
    getByProductId: async (productId: string): Promise<StockMovement[]> => {
    const response = await api.get<any>(`/stock-movements/product/${productId}`);
    console.log("Stock movements by product raw response:", response.data);
    
    const parsedData = parseApiResponse<any>(response.data);
    console.log("Stock movements by product parsed data:", parsedData);
    
    // Handle nested response structure like products
    const movements = parsedData?.data || parsedData;
    console.log("Stock movements by product final data:", movements);
    
    return Array.isArray(movements) ? movements : [];
  }
};
