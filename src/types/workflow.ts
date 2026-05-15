export interface WorkflowProcessDefinitionItem {
  id: string;
  key: string;
  name: string;
  version: number;
  suspended: boolean;
  deploymentId: string;
}

export interface WorkflowProcessDefinitionListResponse {
  processDefinitions: WorkflowProcessDefinitionItem[];
}

export interface WorkflowStartProcessRequest {
  processDefinitionKey: string;
  managerAssignee?: string;
  hrAssignee?: string;
  businessKey?: string;
  leaveReason?: string;
  leaveTime?: string | null;
  variables?: Record<string, unknown>;
}

export interface WorkflowStartProcessResponse {
  processDefinitionKey: string;
  processInstanceId: string;
  businessKey?: string | null;
  processStatus: string;
  currentTaskNames: string[];
}

export interface WorkflowTaskItem {
  taskId: string;
  taskName: string;
  taskDefinitionKey: string;
  assignee: string;
  processInstanceId: string;
  processDefinitionId: string;
  createTime?: string | null;
}

export interface WorkflowMyTasksResponse {
  tasks: WorkflowTaskItem[];
}

export interface WorkflowCompleteTaskRequest {
  approved?: boolean;
  comment?: string;
  variables?: Record<string, unknown>;
}

export interface WorkflowCompleteTaskResponse {
  taskId: string;
  processInstanceId: string;
  processEnded: boolean;
  currentTaskNames: string[];
}

export interface WorkflowRequestItem {
  processInstanceId: string;
  processDefinitionKey: string;
  processDefinitionName?: string;
  businessKey?: string;
  title?: string;
  processStatus: string;
  currentTaskNames?: string[];
  startTime?: string;
  canRevoke?: boolean;
}

export interface WorkflowMyRequestsResponse {
  requests: WorkflowRequestItem[];
}
