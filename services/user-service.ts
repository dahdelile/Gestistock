import api from "@/lib/api";
import { User } from "@/types/user";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<any>("/users"); // Change to any to handle string response initially
    let responseData = response.data;

    if (typeof responseData === 'string') {
      let stringToParse = responseData;
      if (stringToParse.startsWith('+')) {
        stringToParse = stringToParse.substring(1);
      }
      try {
        responseData = JSON.parse(stringToParse);
      } catch (error) {
        console.error('[userService.getAll] Failed to parse JSON string:', error, 'Attempted to parse:', stringToParse);
        throw new Error("Failed to parse user data string from API");
      }
    }

    // Now, responseData should be an object (or array if API directly returned array and it wasn't a string initially)
    // Also ensure responseData.data is an array, as per User[] return type and API spec { data: User[] }
    if (responseData && typeof responseData === 'object' && responseData.hasOwnProperty('data') && Array.isArray(responseData.data)) {
      const transformedUsers = responseData.data.map((apiUser: any) => {
        const user = {
          ...apiUser,
          active: apiUser.active === 1,
        };
        return user;
      });
      return transformedUsers as User[];
    } else if (Array.isArray(responseData)) {
      // This case handles if the parsed JSON string itself was an array,
      // or if the API returned an array directly (and it wasn't a string).
      const transformedUsers = responseData.map((apiUser: any) => {
        const user = {
          ...apiUser,
          active: apiUser.active === 1,
        };
        return user;
      });
      return transformedUsers as User[];
    } else {
      console.error('[userService.getAll] Unexpected response structure after processing:', responseData);
      throw new Error("Unexpected user data structure from API after processing");
    }
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
  
  create: async (user: Omit<User, "id">): Promise<User> => {
    const response = await api.post<User>("/users", user);
    return response.data;
  },
  
  update: async (user: User): Promise<User> => {
    console.log("[UserService] update - id:", user.id, "data:", user);
    const endpoint = `/users/${user.id}`;
    console.log("[UserService] update - endpoint:", endpoint);
    try {
      const response = await api.put<User>(endpoint, user);
      console.log("[UserService] update - response:", response);
      return response.data;
    } catch (error) {
      console.error("[UserService] update - error:", error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
