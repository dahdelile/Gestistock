import api from "@/lib/api";
import { User } from "@/types/user";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

export const authService = {  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log("[AUTH SERVICE] Login request for:", credentials.email)
    const response = await api.post<any>("/auth/login", credentials); // Allow any type for response.data
    console.log("[AUTH SERVICE] Login response:", response.data)
    console.log("[AUTH SERVICE] Response data type:", typeof response.data)
    
    // Handle case where response.data is a string (not parsed JSON)
    let parsedData: any;
    if (typeof response.data === 'string') {
      console.log("[AUTH SERVICE] Response is string, parsing JSON...")
      try {
        // Remove leading '+' if it exists
        const cleanedResponseData = response.data.startsWith('+') ? response.data.substring(1) : response.data;
        parsedData = JSON.parse(cleanedResponseData);
        console.log("[AUTH SERVICE] Parsed data:", parsedData)
      } catch (error) {
        console.error("[AUTH SERVICE] Failed to parse JSON:", error)
        throw new Error("Invalid JSON response from authentication API");
      }
    } else {
      parsedData = response.data;
    }
    
    // Check if parsedData has the expected structure
    if (parsedData && parsedData.success && parsedData.data) {
      console.log("[AUTH SERVICE] Using nested data structure")
      const apiResponseData = parsedData.data;
      console.log("[AUTH SERVICE] Extracted data:", apiResponseData)
      
      if (apiResponseData && apiResponseData.user && apiResponseData.access_token) {
        return {
          user: apiResponseData.user,
          token: apiResponseData.access_token
        };
      }
    }
    
    // Fallback: check if parsedData directly contains the token and user
    if (parsedData && parsedData.access_token && parsedData.user) {
      console.log("[AUTH SERVICE] Using direct data structure")
      return {
        user: parsedData.user,
        token: parsedData.access_token
      };
    }
    
    console.error("[AUTH SERVICE] Unexpected response structure:", parsedData)
    throw new Error("Invalid response structure from authentication API");
  },
  
  logout: async (): Promise<void> => {
    console.log("[AUTH SERVICE] Logout request")
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("[AUTH SERVICE] Logout failed:", error);
    }
    
    // Even if API call fails, clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("[AUTH SERVICE] Local storage cleared")
  },
    getUser: async (): Promise<User | null> => {
    console.log("[AUTH SERVICE] Get user request")
    const response = await api.get<any>("/auth/user"); // Allow any for now
    console.log("[AUTH SERVICE] Get user response:", response.data)

    let parsedData: any;
    if (typeof response.data === 'string') {
      console.log("[AUTH SERVICE] Get user response is string, parsing JSON...")
      try {
        const cleanedResponseData = response.data.startsWith('+') ? response.data.substring(1) : response.data;
        parsedData = JSON.parse(cleanedResponseData);
        console.log("[AUTH SERVICE] Get user parsed data:", parsedData)
      } catch (error) {
        console.error("[AUTH SERVICE] Failed to parse Get user JSON:", error)
        return null; // Or throw error
      }
    } else {
      parsedData = response.data;
    }

    if (parsedData && parsedData.success && parsedData.data) {
      return parsedData.data as User;
    }
    console.error("[AUTH SERVICE] Unexpected Get user response structure:", parsedData)
    return null; // Or throw error
  }
};
