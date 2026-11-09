// src/hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (apiFunction, params = null, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = async (newParams = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFunction(newParams || params);
            setData(response.data.data);
            return response.data.data;
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
            console.error(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, []);

    return { data, loading, error, execute, setData };
};

export default useApi;