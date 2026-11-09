// API base configuration
import axios from "axios";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  responseType: 'json',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("[API] Request interceptor - token exists:", !!token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API] Authorization header set")
    }
    console.log("[API] Request URL:", config.url)
    return config;
  },
  (error) => {
    console.error("[API] Request interceptor error:", error)
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log("[API] Response received:", response.status, response.config.url)
    console.log("[API] Response headers:", response.headers)
    console.log("[API] Response data type:", typeof response.data)
    if (typeof response.data === 'string') {
      console.log("[API] Response data is string, first 100 chars:", response.data.substring(0, 100))
    }
    return response;
  },
  (error) => {
    console.error("[API] Response error:", error.response?.status, error.response?.data)
    const message = error.response?.data?.message || "Une erreur est survenue";
    toast.error(message);
    
    // Redirect to login if unauthorized
    if (error.response?.status === 401) {
      console.log("[API] 401 error - clearing storage and redirecting to login")
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login in client-side environment
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
