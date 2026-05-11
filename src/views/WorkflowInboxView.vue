<template>
  <div class="page">
    <el-alert
      :title="`当前审批人：${authStore.user?.displayName || '-'}（${authStore.user?.employeeId || '-'}）`"
      type="info"
      :closable="false"
      show-icon
      class="feedback"
    />
    <el-table :data="rows" border stripe>
      <el-table-column prop="workflowId" label="流程ID" min-width="180" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="applicant" label="申请人" width="120" />
      <el-table-column prop="amount" label="金额(元)" width="120" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'running' ? 'warning' : 'success'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="approve(row.workflowId)">审批通过</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" class="feedback" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { approveWorkflow } from "../services/workflowService";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
const message = ref("");
const messageType = ref<"success" | "error">("success");

const rows = ref([
  { workflowId: "wf-demo-001", type: "报销", applicant: "employee-001", amount: 500, status: "running" },
  { workflowId: "wf-demo-002", type: "请假", applicant: "employee-002", amount: 0, status: "running" }
]);

const approve = async (workflowId: string) => {
  try {
    const data = await approveWorkflow(workflowId);
    const target = rows.value.find((row) => row.workflowId === workflowId);
    if (target) target.status = data.status;
    messageType.value = "success";
    message.value = `流程 ${workflowId} 审批成功`;
  } catch (e: any) {
    messageType.value = "error";
    message.value = e?.message || "审批失败";
  }
};
</script>

<style scoped>
.feedback {
  margin-top: 12px;
}
</style>
