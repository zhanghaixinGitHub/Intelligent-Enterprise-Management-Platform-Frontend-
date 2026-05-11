import { http } from "./http";

export const getDashboardOverview = async () => {
  const { data } = await http.get("/api/v1/dashboard/overview");
  return data;
};
