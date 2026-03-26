import axios from 'axios';

// Use environment variable from Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */

// 🔒 Prevent duplicate modal triggers (important for React 18 / prod)
let renewModalOpened = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    /* 🔥 SUBSCRIPTION BLOCK HANDLING */
    if (status === 403 && code === 'SUBSCRIPTION_BLOCKED') {
      if (!renewModalOpened) {
        renewModalOpened = true;

        window.dispatchEvent(
          new CustomEvent('open-renew-modal')
        );

        // Reset flag after modal is closed (frontend should emit this)
        window.addEventListener(
          'renew-modal-closed',
          () => {
            renewModalOpened = false;
          },
          { once: true }
        );
      }

      // Always reject so API callers still fail safely
      return Promise.reject(error);
    }

    /* 🔐 AUTH HANDLING */
    if (status === 401) {
      // Check if we are already on the login page or making a login request
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginPage && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
