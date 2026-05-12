<template>
  <div class="workflow-page">
    <el-alert
      :title="`当前办理人：${authStore.user?.displayName || '-'}（${authStore.user?.employeeId || '-'}）`"
      type="info"
      show-icon
      :closable="false"
    />

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <div class="section-title">待办事宜</div>
            <div class="section-desc">查看当前账号待办任务，并按节点类型执行通过、驳回或完成动作。</div>
          </div>
          <el-button type="primary" :loading="loading" @click="loadMyTasks">刷新待办</el-button>
        </div>
      </template>

      <el-table :data="tasks" border stripe empty-text="当前没有待办任务">
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column prop="taskDefinitionKey" label="节点编码" min-width="180" />
        <el-table-column prop="processInstanceId" label="流程实例ID" min-width="220" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="task-actions">
              <template v-if="canCompleteTask">
                <template v-if="row.taskDefinitionKey === 'managerApproveTask'">
                  <el-button
                    type="primary"
                    link
                    :loading="operationLoadingTaskId === row.taskId"
                    @click="handleCompleteTask(row.taskId, true, '前端办理：主管审批通过')"
                  >
                    审批通过
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    :loading="operationLoadingTaskId === row.taskId"
                    @click="handleCompleteTask(row.taskId, false, '前端办理：主管审批驳回')"
                  >
                    驳回
                  </el-button>
                </template>
                <el-button
                  v-else
                  type="primary"
                  link
                  :loading="operationLoadingTaskId === row.taskId"
                  @click="handleCompleteTask(row.taskId, undefined, '前端办理：任务完成')"
                >
                  完成任务
                </el-button>
              </template>
              <span v-else class="permission-tip">当前账号没有 workflow:task:complete 权限</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-alert
      v-if="feedback.message"
      :title="feedback.message"
      :type="feedback.type"
      show-icon
      :closable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { completeTask, listMyTasks } from "../../services/workflowService";
import { useAuthStore } from "../../stores/authStore";
import type { WorkflowCompleteTaskRequest, WorkflowTaskItem } from "../../types/workflow";

const authStore = useAuthStore();
const loading = ref(false);
const operationLoadingTaskId = ref("");
const tasks = ref<WorkflowTaskItem[]>([]);

const feedback = reactive<{ message: string; type: "success" | "error" | "warning" }>({
  message: "",
  type: "success"
});

const canCompleteTask = computed(() => authStore.actionScopes.includes("workflow:task:complete") || authStore.actionScopes.includes("*"));

const setFeedback = (message: string, type: "success" | "error" | "warning") => {
  feedback.message = message;
  feedback.type = type;
};

const resolveErrorMessage = (error: unknown, fallbackMessage: string) => {
  const responseData = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
  return responseData?.message || responseData?.detail || (error as { message?: string })?.message || fallbackMessage;
};

const loadMyTasks = async () => {
  loading.value = true;
  try {
    tasks.value = await listMyTasks();
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "待办任务加载失败"), "error");
  } finally {
    loading.value = false;
  }
};

const handleCompleteTask = async (taskId: string, approved: boolean | undefined, comment: string) => {
  if (!canCompleteTask.value) {
    setFeedback("当前账号没有办理待办的权限", "warning");
    return;
  }

  const payload: WorkflowCompleteTaskRequest = {
    approved,
    comment,
    variables: {}
  };

  operationLoadingTaskId.value = taskId;
  try {
    const result = await completeTask(taskId, payload);
    setFeedback(
      result.processEnded
        ? `任务 ${taskId} 已完成，流程已结束`
        : `任务 ${taskId} 已完成，当前节点：${result.currentTaskNames.join("、") || "无"}`,
      "success"
    );
    await loadMyTasks();
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "任务办理失败"), "error");
  } finally {
    operationLoadingTaskId.value = "";
  }
};

onMounted(loadMyTasks);
</script>

<style scoped>
.workflow-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #132238;
}

.section-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7a90;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-tip {
  color: #909399;
  font-size: 12px;
}
</style>

