<template>
  <WorkflowFeaturePlaceholder
    feature-title="流程监控"
    description="该页面用于管理角色查看流程运行态、阻塞节点、处理耗时与异常实例。当前先完成导航入口、页面骨架与权限隔离，避免后续接入真实监控接口时再返工左侧菜单结构。"
    api-plan="建议后端新增流程实例监控列表、状态统计、按发起人/节点/时间筛选的查询接口，并补充流程轨迹详情能力。"
    :has-permission="hasPermission"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import WorkflowFeaturePlaceholder from "../../components/workflow/WorkflowFeaturePlaceholder.vue";
import { useAuthStore } from "../../stores/authStore";

const authStore = useAuthStore();
const hasPermission = computed(() => authStore.actionScopes.includes("workflow:monitor:view") || authStore.actionScopes.includes("*"));
</script>

