<template>
  <el-container class="layout-root">
    <el-aside width="220px" class="layout-aside">
      <div class="brand">AI 企业管理平台</div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="onMenuSelect"
      >
        <el-menu-item index="dashboard">经营看板</el-menu-item>
        <el-menu-item index="attendance">考勤管理</el-menu-item>
        <el-menu-item index="workflow">审批待办</el-menu-item>
        <el-menu-item index="dialog">AI 对话中心</el-menu-item>
        <el-menu-item index="insight">智能洞察</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <div class="title">创达智管 · 企业运营控制台</div>
          <div class="subtitle">对话即操作 · 提问即答案</div>
        </div>
        <div class="header-right">
          <el-tag type="success">在线</el-tag>
          <el-tag type="info">版本 v0.1</el-tag>
        </div>
      </el-header>

      <el-main class="layout-main">
        <el-card shadow="never" class="module-card">
          <template #header>
            <div class="module-header">
              <span>{{ moduleTitle }}</span>
              <el-text type="info">{{ moduleDesc }}</el-text>
            </div>
          </template>

          <DashboardOverviewView v-if="activeMenu === 'dashboard'" />
          <AttendanceView v-else-if="activeMenu === 'attendance'" />
          <WorkflowInboxView v-else-if="activeMenu === 'workflow'" />
          <AiDialogCenterView v-else-if="activeMenu === 'dialog'" />
          <InsightAssistantView v-else />
        </el-card>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AiDialogCenterView from "./views/AiDialogCenterView.vue";
import DashboardOverviewView from "./views/DashboardOverviewView.vue";
import AttendanceView from "./views/AttendanceView.vue";
import WorkflowInboxView from "./views/WorkflowInboxView.vue";
import InsightAssistantView from "./views/InsightAssistantView.vue";

const activeMenu = ref("dashboard");

const menuMap: Record<string, { title: string; desc: string }> = {
  dashboard: { title: "经营看板", desc: "经营、人事与审批总览" },
  attendance: { title: "考勤管理", desc: "打卡与月度汇总" },
  workflow: { title: "审批待办", desc: "审批流转与处理" },
  dialog: { title: "AI 对话中心", desc: "自然语言办理业务" },
  insight: { title: "智能洞察", desc: "知识问答与数据分析" }
};

const onMenuSelect = (index: string) => {
  activeMenu.value = index;
};

const moduleTitle = computed(() => menuMap[activeMenu.value].title);
const moduleDesc = computed(() => menuMap[activeMenu.value].desc);
</script>

<style scoped>
.layout-root {
  height: 100%;
}

.layout-aside {
  background: #001529;
  color: #fff;
}

.brand {
  height: 56px;
  line-height: 56px;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
}

.layout-header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeef3;
}

.header-left .title {
  font-size: 18px;
  font-weight: 600;
}

.header-left .subtitle {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 8px;
}

.layout-main {
  padding: 16px;
}

.module-card {
  min-height: calc(100vh - 120px);
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
