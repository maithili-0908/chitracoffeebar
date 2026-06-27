import axios from "axios";

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chitraToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error) {
  return error?.response?.data?.message || "Something went wrong";
}

export default api;