import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

export interface ChatOperatePayload {
  sessionId: string;
  employeeId: string;
  message: string;
  idempotencyKey?: string;
}

export const chatOperate = async (payload: ChatOperatePayload) => {
  const { data } = await api.post("/api/v1/chat/operate", payload);
  return data;
};
