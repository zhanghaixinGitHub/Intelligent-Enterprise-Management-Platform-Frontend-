<template>
  <WorkflowFeaturePlaceholder
    feature-title="流程回收站"
    description="该页面用于管理已撤回、已作废、待恢复或已归档的流程实例。当前先交付受控骨架页面，等后端提供回收站查询与恢复接口后，再补充列表操作与恢复按钮。"
    api-plan="建议后端新增流程回收站查询接口，并明确区分撤回、作废、归档、恢复等状态与操作权限。"
    :has-permission="hasPermission"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import WorkflowFeaturePlaceholder from "../../components/workflow/WorkflowFeaturePlaceholder.vue";
import { useAuthStore } from "../../stores/authStore";

const authStore = useAuthStore();
const hasPermission = computed(() => authStore.actionScopes.includes("workflow:recycle:view") || authStore.actionScopes.includes("*"));
</script>


