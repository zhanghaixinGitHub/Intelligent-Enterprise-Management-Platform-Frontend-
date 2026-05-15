import { http } from "./http";
import type {
  WorkflowCompleteTaskRequest,
  WorkflowCompleteTaskResponse,
  WorkflowMyRequestsResponse,
  WorkflowMyTasksResponse,
  WorkflowProcessDefinitionItem,
  WorkflowProcessDefinitionListResponse,
  WorkflowStartProcessRequest,
  WorkflowStartProcessResponse
} from "../types/workflow";

/*
  为什么这样改：
  1. 工作流页面已经从“本地演示式审批”升级为“Python 网关 + Java Flowable”真实链路；
  2. 如果页面继续直接依赖旧的 /{workflowId}/approve，只能做单点演示，无法支撑流程定义查询、发起实例、待办列表和任务办理这些企业级审批中心能力；
  3. 因此前端服务层需要围绕新的统一契约做封装，让页面只关心业务动作，不直接处理底层 URL 与响应结构细节。
*/

export const listProcessDefinitions = async (): Promise<WorkflowProcessDefinitionItem[]> => {
  const { data } = await http.get<WorkflowProcessDefinitionListResponse>("/api/v1/workflows/process-definitions");
  return data.processDefinitions;
};

export const startProcessInstance = async (
  payload: WorkflowStartProcessRequest
): Promise<WorkflowStartProcessResponse> => {
  const { data } = await http.post<WorkflowStartProcessResponse>("/api/v1/workflows/process-instances/start", payload);
  return data;
};

export const listMyTasks = async (): Promise<WorkflowMyTasksResponse["tasks"]> => {
  const { data } = await http.get<WorkflowMyTasksResponse>("/api/v1/workflows/tasks/my");
  return data.tasks;
};

export const completeTask = async (
  taskId: string,
  payload: WorkflowCompleteTaskRequest
): Promise<WorkflowCompleteTaskResponse> => {
  const { data } = await http.post<WorkflowCompleteTaskResponse>(`/api/v1/workflows/tasks/${taskId}/complete`, payload);
  return data;
};

/**
 * 获取当前用户的流程请求列表。
 * 用于在"我的请求"页面展示用户发起的所有流程实例。
 * 
 * 设计模式：Repository Pattern（仓储模式）
 * 将数据访问逻辑封装在服务层，页面只关心业务逻辑。
 * 
 * @returns Promise<WorkflowMyRequestsResponse> 返回请求列表响应数据
 */
export const getMyRequests = async (): Promise<WorkflowMyRequestsResponse> => {
  const { data } = await http.get<WorkflowMyRequestsResponse>("/api/v1/workflows/requests/my");
  return data;
};
