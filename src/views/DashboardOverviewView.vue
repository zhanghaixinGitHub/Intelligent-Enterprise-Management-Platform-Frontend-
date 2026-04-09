<template>
  <div class="page">
    <div class="toolbar">
      <el-button type="primary" @click="load" :loading="loading">刷新看板</el-button>
      <el-text v-if="error" type="danger">{{ error }}</el-text>
    </div>

    <el-row :gutter="12" class="kpi-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="kpi-label">审批总量</div>
          <div class="kpi-value">{{ overview.workflowTotal ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="kpi-label">考勤总记录</div>
          <div class="kpi-value">{{ overview.attendanceTotal ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="kpi-label">待处理审批</div>
          <div class="kpi-value warn">{{ overview.pendingApprovals ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="trend-card">
      <template #header>趋势洞察</template>
      <el-alert
        :title="overview.trendHint || '暂无趋势数据'"
        type="info"
        show-icon
        :closable="false"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getDashboardOverview } from "../services/dashboardService";

const loading = ref(false);
const error = ref("");
const overview = reactive<Record<string, number | string>>({});

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const data = await getDashboardOverview();
    Object.assign(overview, data);
  } catch (e: any) {
    error.value = e?.message || "看板加载失败";
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.kpi-row {
  margin-bottom: 12px;
}
.kpi-label {
  color: #909399;
  font-size: 13px;
}
.kpi-value {
  font-size: 26px;
  margin-top: 6px;
  font-weight: 700;
}
.warn {
  color: #e6a23c;
}
</style>
