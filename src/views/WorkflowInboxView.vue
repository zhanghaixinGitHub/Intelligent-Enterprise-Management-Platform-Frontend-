<template>
  <div class="page workflow-page">
    <el-alert
      :title="`当前审批人：${authStore.user?.displayName || '-'}（${authStore.user?.employeeId || '-'}）`"
      type="info"
      :closable="false"
      show-icon
      class="feedback"
    />

    <el-row :gutter="12" class="workflow-section">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="workflow-card">
          <template #header>
            <div class="card-header">
              <span>流程发起</span>
              <el-button link type="primary" :loading="definitionsLoading" @click="loadProcessDefinitions">刷新流程定义</el-button>
            </div>
          </template>

          <el-form
            v-if="canStartProcess"
            ref="startFormRef"
            :model="startForm"
            :rules="startFormRules"
            label-width="120px"
          >
            <el-form-item label="流程定义" prop="processDefinitionKey">
              <el-select
                v-model="startForm.processDefinitionKey"
                placeholder="请选择流程定义"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="definition in processDefinitions"
                  :key="definition.id"
                  :label="`${definition.name}（${definition.key} / v${definition.version}）`"
                  :value="definition.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="直属主管工号" prop="managerAssignee">
              <el-input v-model="startForm.managerAssignee" placeholder="请输入直属主管工号，例如 manager01" />
            </el-form-item>
            <el-form-item label="HR 工号" prop="hrAssignee">
              <el-input v-model="startForm.hrAssignee" placeholder="请输入 HR 工号，例如 hr01" />
            </el-form-item>
            <el-form-item label="业务单号" prop="businessKey">
              <el-input v-model="startForm.businessKey" placeholder="选填，例如 LEAVE-20260512-0001" />
            </el-form-item>
            <el-form-item label="流程标题" prop="title">
              <el-input v-model="startForm.title" placeholder="选填，例如 员工请假审批" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="starting" @click="handleStartProcess">发起流程</el-button>
              <el-button :loading="pageLoading" @click="loadAllWorkflowData">刷新全部</el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-else
            title="当前角色没有 workflow:start 权限，因此此页面仅展示可查看的工作流数据。"
            type="warning"
            show-icon
            :closable="false"
          />

          <el-divider content-position="left">已部署流程定义</el-divider>
          <div v-if="processDefinitions.length" class="definition-list">
            <el-tag
              v-for="definition in processDefinitions"
              :key="definition.id"
              :type="definition.suspended ? 'danger' : 'success'"
              effect="plain"
              class="definition-tag"
            >
              {{ definition.name }} / {{ definition.key }} / v{{ definition.version }}
            </el-tag>
          </div>
          <el-empty v-else description="暂无可用流程定义" />
        </el-card>

        <el-card v-if="lastStartedProcess.processInstanceId" shadow="never" class="workflow-card result-card">
          <template #header>最近一次发起结果</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="流程定义">{{ lastStartedProcess.processDefinitionKey || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程实例ID">{{ lastStartedProcess.processInstanceId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="业务单号">{{ lastStartedProcess.businessKey || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程状态">
              <el-tag :type="lastStartedProcess.processStatus === 'RUNNING' ? 'warning' : 'success'">
                {{ lastStartedProcess.processStatus || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前节点">
              {{ lastStartedProcess.currentTaskNames?.join('、') || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="workflow-card">
          <template #header>
            <div class="card-header">
              <span>我的待办</span>
              <el-button link type="primary" :loading="tasksLoading" @click="loadMyTasks">刷新待办</el-button>
            </div>
          </template>

          <el-table :data="tasks" border stripe empty-text="当前没有待办任务">
            <el-table-column prop="taskName" label="任务名称" min-width="140" />
            <el-table-column prop="taskDefinitionKey" label="节点编码" min-width="150" />
            <el-table-column prop="processInstanceId" label="流程实例ID" min-width="220" />
            <el-table-column prop="createTime" label="创建时间" min-width="160" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <div class="task-actions">
                  <template v-if="canCompleteTask">
                    <template v-if="row.taskDefinitionKey === 'managerApproveTask'">
                      <el-button
                        type="primary"
                        link
                        :loading="operationLoadingTaskId === row.taskId"
                        @click="handleCompleteTask(row.taskId, true, '前端发起：主管审批通过')"
                      >
                        审批通过
                      </el-button>
                      <el-button
                        type="danger"
                        link
                        :loading="operationLoadingTaskId === row.taskId"
                        @click="handleCompleteTask(row.taskId, false, '前端发起：主管审批驳回')"
                      >
                        驳回
                      </el-button>
                    </template>
                    <el-button
                      v-else
                      type="primary"
                      link
                      :loading="operationLoadingTaskId === row.taskId"
                      @click="handleCompleteTask(row.taskId, undefined, '前端发起：任务完成')"
                    >
                      完成任务
                    </el-button>
                  </template>
                  <span v-else class="permission-tip">当前角色无办理权限</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="feedback.message"
      :title="feedback.message"
      :type="feedback.type"
      show-icon
      :closable="false"
      class="feedback"
    />
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { completeTask, listMyTasks, listProcessDefinitions, startProcessInstance } from "../services/workflowService";
import { useAuthStore } from "../stores/authStore";
import type {
  WorkflowCompleteTaskRequest,
  WorkflowProcessDefinitionItem,
  WorkflowStartProcessRequest,
  WorkflowStartProcessResponse,
  WorkflowTaskItem
} from "../types/workflow";

const authStore = useAuthStore();
const startFormRef = ref<FormInstance>();
const pageLoading = ref(false);
const definitionsLoading = ref(false);
const tasksLoading = ref(false);
const starting = ref(false);
const operationLoadingTaskId = ref("");

const processDefinitions = ref<WorkflowProcessDefinitionItem[]>([]);
const tasks = ref<WorkflowTaskItem[]>([]);

const feedback = reactive<{ message: string; type: "success" | "error" | "warning" }>({
  message: "",
  type: "success"
});

const startForm = reactive<Required<Pick<WorkflowStartProcessRequest, "processDefinitionKey" | "managerAssignee" | "hrAssignee">> & Pick<WorkflowStartProcessRequest, "businessKey" | "title">>({
  processDefinitionKey: "",
  managerAssignee: "",
  hrAssignee: "",
  businessKey: "",
  title: ""
});

const lastStartedProcess = reactive<Partial<WorkflowStartProcessResponse>>({
  processDefinitionKey: "",
  processInstanceId: "",
  businessKey: "",
  processStatus: "",
  currentTaskNames: []
});

/*
  为什么这样改：
  1. 页面不是所有角色都具备“发起流程”或“完成任务”的能力，按钮是否可见应当由服务端下发的 actionScopes 决定；
  2. 这样可以保持“前端展示控制 + 后端服务端鉴权”双保险，既符合企业项目的最小授权原则，也避免在页面中写死角色名称；
  3. 即使后续权限模型扩展到更多角色，只要 actionScopes 变化，页面行为就能自动适配。
*/
const canStartProcess = computed(() => authStore.actionScopes.includes("workflow:start"));
const canCompleteTask = computed(() => authStore.actionScopes.includes("workflow:task:complete"));

const startFormRules: FormRules = {
  processDefinitionKey: [{ required: true, message: "请选择流程定义", trigger: "change" }],
  managerAssignee: [{ required: true, message: "请输入直属主管工号", trigger: "blur" }],
  hrAssignee: [{ required: true, message: "请输入 HR 工号", trigger: "blur" }]
};

const setFeedback = (message: string, type: "success" | "error" | "warning") => {
  feedback.message = message;
  feedback.type = type;
};

const resolveErrorMessage = (error: unknown, fallbackMessage: string) => {
  const responseMessage = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
  return responseMessage?.message || responseMessage?.detail || (error as { message?: string })?.message || fallbackMessage;
};

const loadProcessDefinitions = async () => {
  definitionsLoading.value = true;
  try {
    const definitionList = await listProcessDefinitions();
    processDefinitions.value = definitionList;

    /*
      为什么这样改：
      1. 发起流程前必须选定流程定义；
      2. 为减少用户首次进入页面时的额外操作，如果后端至少返回一个已部署流程定义，就默认选中第一项；
      3. 这里仍然保留用户手工切换能力，不会覆盖已经选中的值。
    */
    if (!startForm.processDefinitionKey && definitionList.length > 0) {
      startForm.processDefinitionKey = definitionList[0].key;
    }
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "流程定义加载失败"), "error");
  } finally {
    definitionsLoading.value = false;
  }
};

const loadMyTasks = async () => {
  tasksLoading.value = true;
  try {
    tasks.value = await listMyTasks();
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "待办任务加载失败"), "error");
  } finally {
    tasksLoading.value = false;
  }
};

const loadAllWorkflowData = async () => {
  pageLoading.value = true;
  try {
    await Promise.all([loadProcessDefinitions(), loadMyTasks()]);
  } finally {
    pageLoading.value = false;
  }
};

const buildStartPayload = (): WorkflowStartProcessRequest => {
  return {
    processDefinitionKey: startForm.processDefinitionKey,
    managerAssignee: startForm.managerAssignee.trim(),
    hrAssignee: startForm.hrAssignee.trim(),
    businessKey: startForm.businessKey.trim() || undefined,
    title: startForm.title?.trim() || undefined,
    variables: {}
  };
};

const handleStartProcess = async () => {
  if (!canStartProcess.value) {
    setFeedback("当前账号没有发起流程的权限", "warning");
    return;
  }

  const validationPassed = await startFormRef.value?.validate().catch(() => false);
  if (!validationPassed) {
    return;
  }

  starting.value = true;
  try {
    const result = await startProcessInstance(buildStartPayload());
    Object.assign(lastStartedProcess, result);
    setFeedback(`流程发起成功，实例ID：${result.processInstanceId}`, "success");
    await loadMyTasks();
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "流程发起失败"), "error");
  } finally {
    starting.value = false;
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

onMounted(loadAllWorkflowData);
</script>

<style scoped>
.workflow-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workflow-section {
  align-items: stretch;
}

.workflow-card {
  height: 100%;
}

.result-card {
  margin-top: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.definition-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.definition-tag {
  margin-right: 0;
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

.feedback {
  margin-top: 0;
}
</style>
