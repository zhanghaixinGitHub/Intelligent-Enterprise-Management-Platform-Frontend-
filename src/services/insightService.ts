import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

export const askData = async (employeeId: string, question: string) => {
  const { data } = await api.post("/api/v1/query/ask", { employeeId, question });
  return data;
};

export const askKnowledge = async (employeeId: string, question: string) => {
  const { data } = await api.post("/api/v1/knowledge/ask", { employeeId, question });
  return data;
};
