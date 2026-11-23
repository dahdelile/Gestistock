import apiService from './apiService';

export const authService = {
    // Login
    async login(credentials) {
        try {
            const response = await apiService.post('/login', credentials);
            
            if (response.token) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Register
    async register(userData) {
        try {
            const response = await apiService.post('/register', userData);
            
            if (response.token) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await apiService.post('/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const response = await apiService.get('/user');
            localStorage.setItem('user', JSON.stringify(response));
            return response;
        } catch (error) {
            this.logout();
            throw error;
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    // Get stored user data
    getStoredUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};