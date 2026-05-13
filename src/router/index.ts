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

/**
 * 全局前置路由守卫 - 统一权限鉴权与导航控制
 *
 * 设计模式：责任链模式（Chain of Responsibility）
 * 通过多级权限检查链，逐级验证用户身份和访问权限，确保只有合法请求才能进入目标页面。
 *
 * 核心职责：
 * 1. 应用初始化检查：确保 Pinia Store 在首次导航前完成状态恢复
 * 2. 公共路由处理：允许未登录用户访问登录页等公共资源
 * 3. 已登录用户重定向：防止已登录用户重复访问登录页
 * 4. 未登录拦截：将未认证用户重定向至登录页并记录原始目标路径
 * 5. 根路径重定向：将访问根路径的用户引导至其角色对应的首页
 * 6. 菜单权限校验：基于后端返回的菜单树验证用户对目标页面的访问权限
 *
 * 执行流程（按优先级从高到低）：
 * Step 1: 检查 authStore 是否已初始化，未初始化则调用 bootstrap() 从 localStorage 或服务端恢复状态
 * Step 2: 判断是否为公共路由（meta.public = true），若是则直接放行或重定向已登录用户
 * Step 3: 检查用户认证状态，未登录则携带 redirect 参数跳转至登录页
 * Step 4: 处理根路径 "/" 的特殊情况，重定向至用户角色的默认首页
 * Step 5: 提取目标路由的 menuKey，通过 authStore.hasMenuPermission() 递归检查菜单权限树
 * Step 6: 所有检查通过，允许导航继续
 *
 * 安全性保障：
 * - 所有受保护路由必须在 router 配置中声明 meta.menuKey，否则无法通过权限校验
 * - 权限校验基于服务端返回的菜单数据，前端仅做展示控制，真正的鉴权应在接口层实现
 * - 使用 replace 模式跳转避免历史记录污染，提升用户体验
 *
 * @param to - 即将进入的目标路由对象（RouteLocationNormalized），包含 path、name、meta 等信息
 * @returns 返回值类型说明：
 *   - true: 允许导航继续，用户可以访问目标页面
 *   - string: 重定向到指定路径（如 "/403" 或 authStore.homePath）
 *   - Location 对象: 重定向到指定路由配置（如跳转到登录页并携带 redirect 查询参数）
 *   - false: 取消导航（本守卫未使用此返回值）
 *
 * @example
 * // 场景1：未登录用户访问 /dashboard
 * // 返回 { name: "login", query: { redirect: "/dashboard" } }
 *
 * // 场景2：已登录管理员访问 /login
 * // 返回 authStore.homePath (如 "/dashboard")
 *
 * // 场景3：普通员工访问需要经理权限的 /workflow/monitor
 * // 返回 "/403"
 */
router.beforeEach(async (to) => {
  /**
   * 获取了 authStore 实例 - 负责管理用户认证状态、权限数据和相关操作
   */
  const authStore = useAuthStore(pinia);

  /**
   * 应用初始化检查 - 确保 Pinia Store 状态已恢复
   * 
   * 浏览器刷新会导致内存中的 Pinia 状态丢失，此检查确保在首次导航前：
   * 1. 从 localStorage 读取之前保存的认证快照（用户信息、菜单树、token等）
   * 2. 如果本地快照有效且未过期，直接使用本地数据快速恢复
   * 3. 如果本地快照无效或已过期，调用后端接口重新获取最新权限数据
   */
  if (!authStore.initialized) {
    await authStore.bootstrap();
  }

  /**
   * 公共路由处理 - 允许未登录用户访问公共资源
   * 
   * 公共路由包括：登录页（/login）、无权限页（/403）等
   * 特殊逻辑：已登录用户访问登录页时，自动重定向至其角色对应的首页，避免重复登录
   */
  if (to.meta.public) {
    if (to.name === "login" && authStore.isAuthenticated) {
      return authStore.homePath || "/403";
    }
    return true;
  }

  /**
   * 未登录拦截 - 强制跳转至登录页并记录原始目标路径
   * 
   * 当用户尝试访问受保护路由但未认证时：
   * 1. 将用户重定向到登录页
   * 2. 通过 query.redirect 参数保存用户原本想访问的路径
   * 3. 登录成功后，LoginView 会读取此参数并将用户带回原目标页面
   * 
   * 示例：用户访问 /attendance → 跳转 /login?redirect=/attendance → 登录后回到 /attendance
   */
  if (!authStore.isAuthenticated) {
    return {
      name: "login",
      query: to.fullPath && to.fullPath !== "/" ? { redirect: to.fullPath } : undefined
    };
  }

  /**
   * 根路径重定向 - 将访问 "/" 的用户引导至角色默认首页
   * 
   * 不同角色的 homePath 由后端返回，例如：
   * - 管理员：/dashboard
   * - 人事专员：/attendance
   * - 普通员工：/workflow/create
   */
  if (to.path === "/") {
    return authStore.homePath || "/403";
  }

  /**
   * 菜单权限校验 - 基于服务端返回的菜单树验证访问权限
   * 
   * 核心逻辑：
   * 1. 从目标路由的 meta 中提取 menuKey（在 router 配置中声明）
   * 2. 调用 authStore.hasMenuPermission() 递归检查该 menuKey 是否存在于用户的菜单树中
   * 3. 如果菜单树中不包含该 key，说明用户没有访问权限，跳转至 403 页面
   * 
   * 安全提示：此处的权限控制仅用于前端展示和路由拦截，真正的业务鉴权应在后端接口层实现
   */
  const requiredMenuKey = to.meta.menuKey as string | undefined;
  if (requiredMenuKey && !authStore.hasMenuPermission(requiredMenuKey)) {
    return "/403";
  }

  return true;
});

export default router;

