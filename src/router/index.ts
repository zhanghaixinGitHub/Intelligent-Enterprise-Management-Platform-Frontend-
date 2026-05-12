import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { pinia } from "../stores";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { public: true, title: "登录" }
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("../views/ForbiddenView.vue"),
      meta: { public: true, title: "无权限" }
    },
    {
      path: "/",
      component: () => import("../layouts/MainLayout.vue"),
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("../views/DashboardOverviewView.vue"),
          meta: { menuKey: "dashboard", title: "经营看板" }
        },
        {
          path: "attendance",
          name: "attendance",
          component: () => import("../views/AttendanceView.vue"),
          meta: { menuKey: "attendance", title: "考勤管理" }
        },
        {
          path: "workflow",
          name: "workflow",
          redirect: "/workflow/create",
          meta: { menuKey: "workflow", title: "我的流程" }
        },
        {
          path: "workflow/create",
          name: "workflow-create",
          component: () => import("../views/workflow/WorkflowCreateView.vue"),
          meta: { menuKey: "workflow-create", title: "新建流程" }
        },
        {
          path: "workflow/todo",
          name: "workflow-todo",
          component: () => import("../views/workflow/WorkflowTodoView.vue"),
          meta: { menuKey: "workflow-todo", title: "待办事宜" }
        },
        {
          path: "workflow/requests",
          name: "workflow-requests",
          component: () => import("../views/workflow/WorkflowRequestsView.vue"),
          meta: { menuKey: "workflow-requests", title: "我的请求" }
        },
        {
          path: "workflow/monitor",
          name: "workflow-monitor",
          component: () => import("../views/workflow/WorkflowMonitorView.vue"),
          meta: { menuKey: "workflow-monitor", title: "流程监控" }
        },
        {
          path: "workflow/recycle-bin",
          name: "workflow-recycle",
          component: () => import("../views/workflow/WorkflowRecycleBinView.vue"),
          meta: { menuKey: "workflow-recycle", title: "流程回收站" }
        },
        {
          path: "dialog",
          name: "dialog",
          component: () => import("../views/AiDialogCenterView.vue"),
          meta: { menuKey: "dialog", title: "AI 对话中心" }
        },
        {
          path: "insight",
          name: "insight",
          component: () => import("../views/InsightAssistantView.vue"),
          meta: { menuKey: "insight", title: "智能洞察" }
        }
      ]
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/403"
    }
  ]
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);

  if (!authStore.initialized) {
    await authStore.bootstrap();
  }

  if (to.meta.public) {
    if (to.name === "login" && authStore.isAuthenticated) {
      return authStore.homePath || "/403";
    }
    return true;
  }

  if (!authStore.isAuthenticated) {
    return {
      name: "login",
      query: to.fullPath && to.fullPath !== "/" ? { redirect: to.fullPath } : undefined
    };
  }

  if (to.path === "/") {
    return authStore.homePath || "/403";
  }

  const requiredMenuKey = to.meta.menuKey as string | undefined;
  if (requiredMenuKey && !authStore.hasMenuPermission(requiredMenuKey)) {
    return "/403";
  }

  return true;
});

export default router;

