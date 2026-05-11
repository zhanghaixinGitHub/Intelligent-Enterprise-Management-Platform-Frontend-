import { http } from "./http";

export const clockIn = async (workDate: string, clockInTime: string) => {
  const { data } = await http.post("/api/v1/attendance/clock-in", null, {
    params: { workDate, clockIn: clockInTime }
  });
  return data;
};

export const monthlySummary = async (month: string) => {
  const { data } = await http.get("/api/v1/attendance/monthly-summary", {
    params: { month }
  });
  return data;
};
