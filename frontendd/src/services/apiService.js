class ApiService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        this.csrfToken = null;
    }

    // Méthode améliorée pour obtenir le token CSRF
    async ensureCsrfToken() {
        if (this.csrfToken) return;
        
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include', // Important pour les cookies
            });
            
            if (response.ok) {
                // Extraire le token CSRF du cookie
                this.csrfToken = this.getCookie('XSRF-TOKEN');
                console.log('CSRF token obtained:', this.csrfToken);
            }
        } catch (error) {
            console.warn('CSRF token fetch failed:', error);
        }
    }

    // Méthode pour lire les cookies
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        // Ajouter le token CSRF si disponible
        if (this.csrfToken) {
            headers['X-XSRF-TOKEN'] = this.csrfToken;
        }

        // Ajouter le token d'authentification
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        // S'assurer d'avoir le token CSRF pour les méthodes non-GET
        if (options.method && options.method !== 'GET') {
            await this.ensureCsrfToken();
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            credentials: 'include', // CRITIQUE pour les cookies
            ...options,
        };

        try {
            console.log('Making API request to:', url);
            console.log('Headers:', config.headers);
            
            const response = await fetch(url, config);
            
            console.log('Response status:', response.status);
            
            if (response.status === 419) {
                // Token CSRF expiré, en obtenir un nouveau
                this.csrfToken = null;
                await this.ensureCsrfToken();
                // Réessayer la requête avec le nouveau token
                config.headers = this.getAuthHeaders();
                const retryResponse = await fetch(url, config);
                if (!retryResponse.ok) {
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                const data = await retryResponse.json();
                return data;
            }

            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Session expirée');
            }

            if (response.status === 422) {
                const errors = await response.json();
                throw new Error(JSON.stringify(errors.errors));
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    handleUnauthorized() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        this.csrfToken = null;
        window.location.href = '/login';
    }

    // Méthodes CRUD
    get(endpoint, params = null) {
        let url = endpoint;
        if (params) {
            const queryParams = new URLSearchParams(params).toString();
            url += `?${queryParams}`;
        }
        return this.request(url);
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // Test de connexion avec CSRF
    async testConnection() {
        try {
            // D'abord obtenir le token CSRF
            await this.ensureCsrfToken();
            // Ensuite tester la connexion
            const result = await this.get('/');
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default new ApiService();