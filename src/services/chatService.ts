import { http } from "./http";

export interface ChatOperatePayload {
  sessionId: string;
  message: string;
  idempotencyKey?: string;
}

export const chatOperate = async (payload: ChatOperatePayload) => {
  const { data } = await http.post("/api/v1/chat/operate", payload);
  return data;
};
