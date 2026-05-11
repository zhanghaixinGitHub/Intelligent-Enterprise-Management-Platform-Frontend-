<template>
  <div class="page">
    <el-form inline>
      <el-form-item label="当前员工">
        <el-input :model-value="authStore.user?.displayName || '-'" disabled style="width: 180px" />
      </el-form-item>
      <el-form-item label="月份">
        <el-input v-model="month" placeholder="YYYY-MM" style="width: 140px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="doClockIn">立即打卡</el-button>
        <el-button @click="loadSummary">查看本月汇总</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>最近打卡结果</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="记录ID">{{ clockInResult.recordId || "-" }}</el-descriptions-item>
            <el-descriptions-item label="员工">{{ clockInResult.employeeId || "-" }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ clockInResult.workDate || "-" }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ clockInResult.status || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>月度汇总</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="出勤天数">{{ summary.days ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="加班分钟">{{ summary.overtimeMinutes ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="员工">{{ summary.employeeId || "-" }}</el-descriptions-item>
            <el-descriptions-item label="月份">{{ summary.month || month }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="error"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { clockIn, monthlySummary } from "../services/attendanceService";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
const month = ref(new Date().toISOString().slice(0, 7));
const error = ref("");
const clockInResult = reactive<Record<string, string>>({});
const summary = reactive<Record<string, any>>({});

const doClockIn = async () => {
  error.value = "";
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toTimeString().slice(0, 8);
    const data = await clockIn(today, now);
    Object.assign(clockInResult, data);
  } catch (e: any) {
    error.value = e?.message || "打卡失败";
  }
};

const loadSummary = async () => {
  error.value = "";
  try {
    const data = await monthlySummary(month.value);
    Object.assign(summary, data);
  } catch (e: any) {
    error.value = e?.message || "汇总查询失败";
  }
};
</script>

<style scoped>
.error {
  margin-top: 12px;
}
</style>
