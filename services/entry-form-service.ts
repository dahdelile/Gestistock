import api from "@/lib/api";
import { Product } from '../types/product';
import { EntryForm, EntryItem } from "@/types/entry-form";
import { Category } from "@/types/category"; // Import Category type

const ensureNumericEntryFormFields = (entry: any): EntryForm => {
  if (!entry || typeof entry !== 'object') {
    console.error('[ensureNumericEntryFormFields] Invalid entry received:', entry);
    // Return a default/error structure matching EntryForm
    return {
      id: entry?.id || 'unknown_id_error',
      reference: entry?.reference || 'error_ref',
      date: entry?.date || new Date().toISOString(),
      supplierId: entry?.supplierId || '',
      supplierName: entry?.supplierName || 'Error Supplier',
      notes: entry?.notes || '',
      status: entry?.status || 'draft',
      items: [],
      total: 0,
      // Ensure all fields from EntryForm type are present
      supplier: entry?.supplier || { id: '', name: 'Error Supplier' },
      user: entry?.user || { id: 0, name: 'Error User' },
      created_at: entry?.created_at || new Date().toISOString(),
      updated_at: entry?.updated_at || new Date().toISOString(),
    } as EntryForm;
  }

  const parsedTotal = parseFloat(String(entry.total));
  const newTotal = isNaN(parsedTotal) ? 0 : parsedTotal;

  let newItems: EntryItem[] = [];
  if (Array.isArray(entry.items)) {
    newItems = entry.items.map((item: any): EntryItem => {
      if (!item || typeof item !== 'object') {
        console.error('[ensureNumericEntryFormFields] Invalid item in entry:', item, 'for entry ID:', entry.id);
        const defaultProductCategory: Category = { id: 'cat_err', name: 'Cat Error', description: '', products_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        return {
          id: item?.id || 'unknown_item_id_error',
          productId: 'prod_err',
          productName: 'Error Product',
          quantity: 0,
          unitPrice: 0,
          total: 0,
        } as EntryItem;
      }
      const parsedQuantity = parseInt(String(item.quantity), 10); // This is EntryItem quantity
      const parsedUnitPrice = parseFloat(String(item.unitPrice || item.unit_price));
      const parsedItemTotal = parseFloat(String(item.totalPrice || item.total_price || item.total));

      const productFromApi = item.product || {}; // Safely access item.product from API

      // Default category structure if not present or incomplete in API product
      const defaultCategory: Category = {
        id: 'unknown_category_id',
        name: 'Unknown Category',
        description: '',
        products_count: 0,
        created_at: new Date().toISOString(), // Add missing properties
        updated_at: new Date().toISOString(), // Add missing properties
      };

      const transformedProduct: Product = {
        id: String(productFromApi.id || item.productId || `unknown_product_id_at_item_${item.id}`),
        name: String(productFromApi.name || item.productName || 'Product Name Missing'),
        reference: String(productFromApi.reference || item.product_reference || ''),
        description: String(productFromApi.description || ''),
        price: parseFloat(String(productFromApi.price)) || 0,
        // productFromApi.quantity is the general stock level, not specific to this entry item
        quantity: parseInt(String(productFromApi.quantity), 10) || 0,
        min_stock: parseInt(String(productFromApi.min_stock), 10) || 0,
        category: {
          id: String(productFromApi.category?.id || defaultCategory.id),
          name: String(productFromApi.category?.name || defaultCategory.name),
          description: String(productFromApi.category?.description || defaultCategory.description),
          products_count: parseInt(String(productFromApi.category?.products_count), 10) || defaultCategory.products_count,
        } as Category,
      };

      return {
        id: item.id,
        product: transformedProduct,
        quantity: isNaN(parsedQuantity) ? 0 : parsedQuantity, // EntryItem quantity
        unitPrice: isNaN(parsedUnitPrice) ? 0 : parsedUnitPrice,
        total: isNaN(parsedItemTotal) ? 0 : parsedItemTotal,
        ...(item.entry_form_id && { entry_form_id: item.entry_form_id }),
        ...(item.created_at && { created_at: item.created_at }),
        ...(item.updated_at && { updated_at: item.updated_at }),
      } as EntryItem;
    });
  } else if (entry.items !== undefined && entry.items !== null) {
    console.warn('[ensureNumericEntryFormFields] entry.items was present but not an array for entry ID:', entry.id, 'items:', entry.items);
  }

  const supplierName = entry.supplier && entry.supplier.name ? entry.supplier.name : entry.supplierName;

  return {
    ...entry,
    supplierName,
    total: newTotal,
    items: newItems,
  } as EntryForm;
};

// Interface for the data structure expected by the API
interface EntryFormApiPayload {
  reference: string;
  date: string; // Assuming date is already in 'YYYY-MM-DD' string format
  supplier_id: string;
  notes?: string;
  status: string;
  user_id: string; // Changed from number to string to match typical ID formats from auth
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number; // API expects unit_price
  }>;
}

export const entryFormService = {
  getAll: async (): Promise<EntryForm[]> => {
    let allEntryForms: EntryForm[] = [];
    let nextPageUrl: string | null = `/entry-forms?_cb=${new Date().getTime()}`;

    while (nextPageUrl) {
      console.log(`[entryFormService.getAll] Fetching: ${nextPageUrl}`);
      const response: any = await api.get<any>(nextPageUrl);
      console.log('[entryFormService.getAll] Raw API Response object:', JSON.stringify(response));

      let responseData: any = response.data;

      if (typeof responseData === 'string' && responseData.startsWith('+')) {
        console.warn('[entryFormService.getAll] Detected response string starting with "+". Attempting to strip and parse.');
        try {
          responseData = JSON.parse(responseData.substring(1));
          console.log('[entryFormService.getAll] Successfully parsed after stripping "+". New type:', typeof responseData);
        } catch (e) {
          console.error('[entryFormService.getAll] Failed to parse response string after stripping "+":', e);
          throw new Error('Failed to parse API response.');
        }
      }

      if (responseData && typeof responseData === 'object' && responseData.data) {
        const currentPageData = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        console.log(`[entryFormService.getAll] Detected PAGINATED structure. Transforming current page data (length: ${currentPageData.length})`);
        const transformedData: EntryForm[] = currentPageData.map(ensureNumericEntryFormFields);
        allEntryForms = allEntryForms.concat(transformedData);
        nextPageUrl = responseData.links?.next || null; // Get the next page URL
      } else if (Array.isArray(responseData)) {
        console.log(`[entryFormService.getAll] Detected FLAT ARRAY structure. Length: ${responseData.length}. Transforming.`);
        const transformedData: EntryForm[] = responseData.map(ensureNumericEntryFormFields);
        allEntryForms = allEntryForms.concat(transformedData);
        nextPageUrl = null; // No pagination links, so it's the only page
      } else {
        console.error('[entryFormService.getAll] UNEXPECTED responseData structure (after potential parse):', responseData);
        throw new Error('Unexpected data structure received from entry-forms API.');
      }
    }
    console.log(`[entryFormService.getAll] Fetched total ${allEntryForms.length} entry forms across all pages.`);
    return allEntryForms;
  },
  
  getById: async (id: string): Promise<EntryForm> => {
    const response = await api.get<any>(`/entry-forms/${id}`); // Use any for raw response
    // Ensure the single entry form also has its product data structured correctly
    // This is a simplified version of ensureNumericEntryFormFields for a single object
    console.log(`[entryFormService.getById] Raw API Response for ID ${id}:`, JSON.stringify(response.data, null, 2));
    const entry = response.data.data; // Assuming API wraps single resource in 'data'
    console.log(`[entryFormService.getById] Extracted entry data for ID ${id}:`, JSON.stringify(entry, null, 2));


    if (!entry || typeof entry !== 'object') {
      console.error('[entryFormService.getById] Invalid entry received:', entry);
      throw new Error('Invalid data structure for entry form received from API.');
    }

    const parsedTotal = parseFloat(String(entry.total));
    const newTotal = isNaN(parsedTotal) ? 0 : parsedTotal;

    let newItems: EntryItem[] = [];
    if (Array.isArray(entry.items)) {
      console.log(`[entryFormService.getById] Processing ${entry.items.length} items for entry ID ${id}. Raw items:`, JSON.stringify(entry.items, null, 2));
      newItems = entry.items.map((item: any, index: number): EntryItem => {
        console.log(`[entryFormService.getById] Processing item ${index} for entry ID ${id}. Raw item:`, JSON.stringify(item, null, 2));
        if (!item || typeof item !== 'object') {
          console.error('[entryFormService.getById] Invalid item in entry:', item, 'for entry ID:', entry.id);
          // Return a default/error structure matching EntryItem
          return {
            id: item?.id || `unknown_item_id_error_getbyid_${index}`,
            productId: 'error_product_id',
            productName: 'Error Product Name',
            quantity: 0,
            unitPrice: 0,
            total: 0,
          } as EntryItem;
        }
        const parsedQuantity = parseInt(String(item.quantity), 10);
        const parsedUnitPrice = parseFloat(String(item.unitPrice || item.unit_price));
        const parsedItemTotal = parseFloat(String(item.totalPrice || item.total_price || item.total));

        // Prefer item.product.name if available (from direct API structure),
        // then item.productName (if service transformed it differently before),
        // then a fallback.
        // Log the source of product name
        let productNameSource = "fallback 'Product Name Missing'";
        if (item.product?.name) {
          productNameSource = "item.product.name";
        } else if (item.productName) {
          productNameSource = "item.productName";
        }
        console.log(`[entryFormService.getById] Item ${index} (ID: ${item.id}): Product details before mapping: product object: ${JSON.stringify(item.product)}, productName: ${item.productName}. Name will be sourced from: ${productNameSource}`);

        const productName = item.product?.name || item.productName || 'Product Name Missing';
        const productId = item.product?.id || item.productId || `error_product_id_item_${index}`;
        const productReference = item.product?.reference || item.product_reference || '';
        
        const transformedItem = {
          id: item.id,
          product: {
            id: productId,
            name: productName,
            reference: productReference,
            // Ensure other Product fields are present if needed, or rely on Product type defaults
          } as Product,
          quantity: isNaN(parsedQuantity) ? 0 : parsedQuantity,
          unitPrice: isNaN(parsedUnitPrice) ? 0 : parsedUnitPrice,
          total: isNaN(parsedItemTotal) ? 0 : parsedItemTotal,
          ...(item.entry_form_id && { entry_form_id: item.entry_form_id }),
          ...(item.created_at && { created_at: item.created_at }),
          ...(item.updated_at && { updated_at: item.updated_at }),
        } as EntryItem;
        console.log(`[entryFormService.getById] Item ${index} (ID: ${item.id}) after transformation:`, JSON.stringify(transformedItem, null, 2));
        return transformedItem;
      });
    } else if (entry.items !== undefined && entry.items !== null) {
      console.warn('[entryFormService.getById] entry.items was present but not an array for entry ID:', entry.id, 'items:', entry.items);
    }
    
    const supplierName = entry.supplier && entry.supplier.name ? entry.supplier.name : entry.supplierName;

    const finalTransformedEntry = {
      ...entry,
      supplierName,
      total: newTotal,
      items: newItems,
    } as EntryForm;
    console.log(`[entryFormService.getById] Final transformed entry for ID ${id}:`, JSON.stringify(finalTransformedEntry, null, 2));
    return finalTransformedEntry;
  },
  
  create: async (entryFormData: Omit<EntryForm, "id" | "user" | "supplier" | "created_at" | "updated_at"> & { supplierId: string; items: EntryItem[]; user_id: string }): Promise<EntryForm> => {
    const payload: EntryFormApiPayload = {
      reference: entryFormData.reference,
      date: entryFormData.date, // Ensure this is in 'YYYY-MM-DD' format if required by API
      supplier_id: entryFormData.supplierId,
      notes: entryFormData.notes,
      status: entryFormData.status,
      user_id: String(entryFormData.user_id), // Ensure user_id is a string
      items: entryFormData.items.map(item => ({
        product_id: String(item.productId), // Access productId from EntryItem
        quantity: Number(item.quantity),
        unit_price: Number(item.unitPrice),
      })),
    };
    console.log("Sending payload to /entry-forms:", JSON.stringify(payload, null, 2));
    const response = await api.post<{ data: EntryForm }>("/entry-forms", payload); // Assuming API wraps response in { data: ... }
    return response.data.data; // Adjust if API response structure is different
  },
  
  completeEntryForm: async (id: string): Promise<EntryForm> => {
    console.log(`[entryFormService.completeEntryForm] Attempting to complete entry form with ID: ${id}`);
    const response = await api.post<any>(`/entry-forms/${id}/validate`, { validation_note: 'Completed by user action' });
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.startsWith('+')) {
      try {
        responseData = JSON.parse(responseData.substring(1));
      } catch (e) {
        console.error('[entryFormService.completeEntryForm] Failed to parse response string after stripping "+":', e);
        throw new Error('Failed to parse API response for completeEntryForm.');
      }
    }
    console.log(`[entryFormService.completeEntryForm] API response for ID ${id}:`, JSON.stringify(responseData, null, 2));
    return ensureNumericEntryFormFields(responseData.data);
  },

  cancelEntryForm: async (id: string): Promise<EntryForm> => {
    console.log(`[entryFormService.cancelEntryForm] Attempting to cancel entry form with ID: ${id}`);
    const response = await api.post<any>(`/entry-forms/${id}/cancel`, { cancel_reason: 'Cancelled by user action' });
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.startsWith('+')) {
      try {
        responseData = JSON.parse(responseData.substring(1));
      } catch (e) {
        console.error('[entryFormService.cancelEntryForm] Failed to parse response string after stripping "+":', e);
        throw new Error('Failed to parse API response for cancelEntryForm.');
      }
    }
    console.log(`[entryFormService.cancelEntryForm] API response for ID ${id}:`, JSON.stringify(responseData, null, 2));
    return ensureNumericEntryFormFields(responseData.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/entry-forms/${id}`);
  }
};
