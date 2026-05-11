import { http } from "./http";

export const approveWorkflow = async (workflowId: string) => {
  const { data } = await http.post(`/api/v1/workflows/${workflowId}/approve`, {
    action: "approve"
  });
  return data;
};
