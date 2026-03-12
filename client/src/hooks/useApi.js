import { useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useApi() {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    try {
      const config = { method, url, ...options };
      if (data) config.data = data;
      const response = await api(config);
      return response;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Something went wrong';
      if (!options.silent) toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, options) => request('get', url, null, options), [request]);
  const post = useCallback((url, data, options) => request('post', url, data, options), [request]);
  const put = useCallback((url, data, options) => request('put', url, data, options), [request]);
  const patch = useCallback((url, data, options) => request('patch', url, data, options), [request]);
  const del = useCallback((url, options) => request('delete', url, null, options), [request]);

  return { loading, get, post, put, patch, del };
}
