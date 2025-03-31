import { useState, useCallback } from 'react';

interface ApiOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async <T>({ url, method = 'GET', body, headers }: ApiOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Making ${method} request to ${url}`);
      // For now, just return a mock response since we don't have an actual API
      return null as T;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchData, loading, error };
};

export default useApi;
