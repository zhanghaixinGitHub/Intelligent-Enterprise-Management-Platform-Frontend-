import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

export const getDashboardOverview = async () => {
  const { data } = await api.get("/api/v1/dashboard/overview");
  return data;
};
