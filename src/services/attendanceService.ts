import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

export const clockIn = async (employeeId: string, workDate: string, clockInTime: string) => {
  const { data } = await api.post("/api/v1/attendance/clock-in", null, {
    params: { employeeId, workDate, clockIn: clockInTime }
  });
  return data;
};

export const monthlySummary = async (employeeId: string, month: string) => {
  const { data } = await api.get("/api/v1/attendance/monthly-summary", {
    params: { employeeId, month }
  });
  return data;
};
