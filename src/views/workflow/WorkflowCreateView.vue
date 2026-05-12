<template>
  <div class="workflow-page">
    <el-alert
      :title="`当前申请人：${authStore.user?.displayName || '-'}（${authStore.user?.employeeId || '-'}）`"
      type="info"
      :closable="false"
      show-icon
    />

    <el-row :gutter="12">
      <el-col :span="18">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <div class="section-title">新建流程</div>
                <div class="section-desc">从流程目录中选择一个模板，填写必要信息后发起审批流程。</div>
              </div>
              <div class="toolbar-actions">
                <el-input v-model="keyword" placeholder="搜索流程名称或编码" clearable style="width: 260px" />
                <el-button type="primary" :loading="loadingDefinitions" @click="loadProcessDefinitions">刷新流程目录</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!canStartProcess"
            title="当前账号没有 workflow:start 权限，因此只能浏览流程目录，不能发起新流程。"
            type="warning"
            show-icon
            :closable="false"
            class="section-alert"
          />

          <el-empty v-if="!filteredDefinitions.length && !loadingDefinitions" description="暂无可用流程定义" />

          <div v-else class="definition-grid">
            <el-card
              v-for="definition in filteredDefinitions"
              :key="definition.id"
              shadow="hover"
              class="definition-card"
            >
              <template #header>
                <div class="definition-header">
                  <div>
                    <div class="definition-name">{{ definition.name }}</div>
                    <div class="definition-key">{{ definition.key }} / v{{ definition.version }}</div>
                  </div>
                  <el-tag :type="definition.suspended ? 'danger' : 'success'" effect="plain">
                    {{ definition.suspended ? '已停用' : '可发起' }}
                  </el-tag>
                </div>
              </template>

              <div class="definition-body">
                <p>{{ buildDefinitionDescription(definition) }}</p>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="部署ID">{{ definition.deploymentId }}</el-descriptions-item>
                  <el-descriptions-item label="适用场景">{{ buildDefinitionCategory(definition) }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="definition-actions">
                <el-button
                  type="primary"
                  :disabled="definition.suspended || !canStartProcess"
                  @click="openStartDialog(definition)"
                >
                  发起流程
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="aside-card">
          <template #header>最近一次发起结果</template>
          <el-empty v-if="!lastStartedProcess.processInstanceId" description="还没有成功发起过流程" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="流程定义">{{ lastStartedProcess.processDefinitionKey || '-' }}</el-descriptions-item>
            <el-descriptions-item label="流程实例ID">{{ lastStartedProcess.processInstanceId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="业务单号">{{ lastStartedProcess.businessKey || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ lastStartedProcess.currentTaskNames?.join('、') || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" title="发起流程" width="720px" destroy-on-close>
      <el-form ref="startFormRef" :model="startForm" :rules="startFormRules" label-width="110px">
        <el-form-item label="流程模板">
          <el-input :model-value="selectedDefinitionLabel" disabled />
        </el-form-item>
        <el-form-item label="直属主管工号" prop="managerAssignee">
          <el-input v-model="startForm.managerAssignee" placeholder="请输入直属主管工号，例如 manager01" />
        </el-form-item>
        <el-form-item label="HR 工号" prop="hrAssignee">
          <el-input v-model="startForm.hrAssignee" placeholder="请输入 HR 工号，例如 hr01" />
        </el-form-item>
        <el-form-item label="业务单号">
          <el-input v-model="startForm.businessKey" placeholder="选填，例如 LEAVE-20260512-0008" />
        </el-form-item>
        <el-form-item label="流程标题">
          <el-input v-model="startForm.title" placeholder="选填，例如 员工请假申请" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-space>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="starting" @click="handleStartProcess">确认发起</el-button>
        </el-space>
      </template>
    </el-dialog>

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
import type { FormInstance, FormRules } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { listProcessDefinitions, startProcessInstance } from "../../services/workflowService";
import { useAuthStore } from "../../stores/authStore";
import type { WorkflowProcessDefinitionItem, WorkflowStartProcessRequest, WorkflowStartProcessResponse } from "../../types/workflow";

const authStore = useAuthStore();
const startFormRef = ref<FormInstance>();
const keyword = ref("");
const loadingDefinitions = ref(false);
const starting = ref(false);
const dialogVisible = ref(false);
const selectedDefinition = ref<WorkflowProcessDefinitionItem | null>(null);
const processDefinitions = ref<WorkflowProcessDefinitionItem[]>([]);

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

const canStartProcess = computed(() => authStore.actionScopes.includes("workflow:start") || authStore.actionScopes.includes("*"));

const filteredDefinitions = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  if (!normalizedKeyword) {
    return processDefinitions.value;
  }
  return processDefinitions.value.filter((definition) => {
    return definition.name.toLowerCase().includes(normalizedKeyword) || definition.key.toLowerCase().includes(normalizedKeyword);
  });
});

const selectedDefinitionLabel = computed(() => {
  if (!selectedDefinition.value) {
    return "";
  }
  return `${selectedDefinition.value.name}（${selectedDefinition.value.key} / v${selectedDefinition.value.version}）`;
});

const startFormRules: FormRules = {
  managerAssignee: [{ required: true, message: "请输入直属主管工号", trigger: "blur" }],
  hrAssignee: [{ required: true, message: "请输入 HR 工号", trigger: "blur" }]
};

const setFeedback = (message: string, type: "success" | "error" | "warning") => {
  feedback.message = message;
  feedback.type = type;
};

const resolveErrorMessage = (error: unknown, fallbackMessage: string) => {
  const responseData = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
  return responseData?.message || responseData?.detail || (error as { message?: string })?.message || fallbackMessage;
};

const buildDefinitionDescription = (definition: WorkflowProcessDefinitionItem) => {
  if (definition.key.toLowerCase().includes("leave")) {
    return "适用于请假类业务，由申请人发起后进入直属主管审批，并在通过后流转到 HR 备案。";
  }
  return "当前流程定义已经部署到审批中心，可作为标准化业务流模板供业务人员直接发起。";
};

const buildDefinitionCategory = (definition: WorkflowProcessDefinitionItem) => {
  if (definition.key.toLowerCase().includes("leave")) {
    return "人事 / 假勤类";
  }
  return "通用业务流程";
};

const loadProcessDefinitions = async () => {
  loadingDefinitions.value = true;
  try {
    processDefinitions.value = await listProcessDefinitions();
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "流程目录加载失败"), "error");
  } finally {
    loadingDefinitions.value = false;
  }
};

const openStartDialog = (definition: WorkflowProcessDefinitionItem) => {
  selectedDefinition.value = definition;
  startForm.processDefinitionKey = definition.key;
  dialogVisible.value = true;
};

const buildStartPayload = (): WorkflowStartProcessRequest => ({
  processDefinitionKey: startForm.processDefinitionKey,
  managerAssignee: startForm.managerAssignee.trim(),
  hrAssignee: startForm.hrAssignee.trim(),
  businessKey: startForm.businessKey.trim() || undefined,
  title: startForm.title.trim() || undefined,
  variables: {}
});

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
    dialogVisible.value = false;
  } catch (error) {
    setFeedback(resolveErrorMessage(error, "流程发起失败"), "error");
  } finally {
    starting.value = false;
  }
};

onMounted(loadProcessDefinitions);
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-alert {
  margin-bottom: 12px;
}

.definition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.definition-card {
  border-radius: 16px;
}

.definition-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.definition-name {
  font-size: 16px;
  font-weight: 700;
  color: #132238;
}

.definition-key {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7a90;
}

.definition-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #52637a;
  line-height: 1.8;
}

.definition-body p {
  margin: 0;
}

.definition-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.aside-card {
  height: 100%;
}
</style>

