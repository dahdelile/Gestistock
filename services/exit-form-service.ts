import api from "@/lib/api";
import { ExitForm } from "@/types/exit-form";

export const exitFormService = {
  getAll: async (): Promise<ExitForm[]> => {
    const response = await api.get<any>("/exit-forms"); // Get as any to inspect raw data
    let responseData = response.data;

    // Check if responseData is a string and starts with '+'
    if (typeof responseData === 'string' && responseData.startsWith('+')) {
      console.log("[exitFormService.getAll] Detected response string starting with '+'. Attempting to strip and parse.");
      try {
        responseData = JSON.parse(responseData.substring(1));
        console.log("[exitFormService.getAll] Successfully parsed after stripping '+'. New type:", typeof responseData);
      } catch (e) {
        console.error("[exitFormService.getAll] Failed to parse JSON after stripping '+':", e);
        throw new Error("Failed to parse exit forms response after stripping '+'.");
      }
    }

    // Assuming the actual array of exit forms is nested under a 'data' property,
    // similar to other services and the logged API responses.
    if (responseData && typeof responseData === 'object' && Array.isArray(responseData.data)) {
      console.log("[exitFormService.getAll] Detected PAGINATED structure. Transforming responseData.data (length: " + responseData.data.length + ")");
      return responseData.data as ExitForm[];
    } else if (Array.isArray(responseData)) {
      // If it's directly an array (less likely given other logs, but a fallback)
      console.log("[exitFormService.getAll] Detected DIRECT ARRAY structure. Length: " + responseData.length);
      return responseData as ExitForm[];
    } else {
      console.error("[exitFormService.getAll] Unexpected response structure:", responseData);
      throw new Error("Unexpected response structure for exit forms.");
    }
  },
  
  getById: async (id: string): Promise<ExitForm> => {
    const response = await api.get<ExitForm>(`/exit-forms/${id}`);
    return response.data;
  },
  
  create: async (exitForm: Omit<ExitForm, "id">): Promise<ExitForm> => {
    console.log("[exitFormService.create] Payload to be sent:", JSON.stringify(exitForm, null, 2));
    const response = await api.post<ExitForm>("/exit-forms", exitForm);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exit-forms/${id}`);
  },

  completeExitForm: async (id: string): Promise<ExitForm> => {
    console.log(`[exitFormService.completeExitForm] Attempting to complete exit form with ID: ${id}`);
    const response = await api.post<any>(`/exit-forms/${id}/validate`, { validation_note: 'Completed by user action' });
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.startsWith('+')) {
      try {
        responseData = JSON.parse(responseData.substring(1));
      } catch (e) {
        console.error('[exitFormService.completeExitForm] Failed to parse response string after stripping "+":', e);
        throw new Error('Failed to parse API response for completeExitForm.');
      }
    }
    console.log(`[exitFormService.completeExitForm] API response for ID ${id}:`, JSON.stringify(responseData, null, 2));
    return responseData.data;
  },

  cancelExitForm: async (id: string): Promise<ExitForm> => {
    console.log(`[exitFormService.cancelExitForm] Attempting to cancel exit form with ID: ${id}`);
    const response = await api.post<any>(`/exit-forms/${id}/cancel`, { reason: 'Cancelled by user action' });
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.startsWith('+')) {
      try {
        responseData = JSON.parse(responseData.substring(1));
      } catch (e) {
        console.error('[exitFormService.cancelExitForm] Failed to parse response string after stripping "+":', e);
        throw new Error('Failed to parse API response for cancelExitForm.');
      }
    }
    console.log(`[exitFormService.cancelExitForm] API response for ID ${id}:`, JSON.stringify(responseData, null, 2));
    return responseData.data;
  }
};
