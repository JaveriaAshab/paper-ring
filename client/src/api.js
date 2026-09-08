import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request Interceptor: Attach token from localStorage OR sessionStorage
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("paperring_token") ||
      sessionStorage.getItem("paperring_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clean up token on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("paperring_token");
      localStorage.removeItem("paperring_user");
      sessionStorage.removeItem("paperring_token");
      sessionStorage.removeItem("paperring_user");
    }
    return Promise.reject(error);
  }
);

export default api;
