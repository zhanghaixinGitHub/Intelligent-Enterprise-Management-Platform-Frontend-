import { http } from "./http";

export const askData = async (question: string) => {
  const { data } = await http.post("/api/v1/query/ask", { question });
  return data;
};

export const askKnowledge = async (question: string) => {
  const { data } = await http.post("/api/v1/knowledge/ask", { question });
  return data;
};
