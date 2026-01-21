import axios from 'axios';

// Use environment variable from Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 🛡️ Handle Subscription Blocking
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_BLOCKED') {
      window.dispatchEvent(new Event('open-renew-modal'));
      // Prevent default error handling (toast) by returning a pending promise or specific error
      // But usually interceptors must reject. We will reject but the UI should know not to toast.
      // For now, we just triggering the modal.
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
