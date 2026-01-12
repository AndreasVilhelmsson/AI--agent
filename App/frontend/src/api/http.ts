import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5168";

export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
