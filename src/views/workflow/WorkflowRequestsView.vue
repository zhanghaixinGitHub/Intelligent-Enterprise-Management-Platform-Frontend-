<template>
  <WorkflowFeaturePlaceholder
    feature-title="我的请求"
    description="该页面用于承接“我发起的流程”查询、进度跟踪、撤回申请与详情查看。当前前端入口、信息架构和权限隔离已经就绪，待后端补充“我发起的流程列表”接口后即可切换为真实数据列表。"
    api-plan="建议后端新增 /api/v1/workflows/requests/my 或等价接口，返回我发起的流程列表、状态、当前节点、发起时间与可撤回标记。"
    :has-permission="hasPermission"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import WorkflowFeaturePlaceholder from "../../components/workflow/WorkflowFeaturePlaceholder.vue";
import { useAuthStore } from "../../stores/authStore";

const authStore = useAuthStore();
const hasPermission = computed(() => authStore.actionScopes.includes("workflow:view") || authStore.actionScopes.includes("*"));
</script>

