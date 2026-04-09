import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

export const approveWorkflow = async (workflowId: string, approverId: string) => {
  const { data } = await api.post(`/api/v1/workflows/${workflowId}/approve`, {
    approverId,
    action: "approve"
  });
  return data;
};
