# 智能企业管理平台：登录与权限改造说明

## 1. 本次改造目标

本次已完成以下企业级基础能力改造：

1. 新增登录能力，前端不再默认“匿名进入系统”。
2. 新增基于角色的菜单权限控制，左侧菜单由后端返回，不再写死在 `src/App.vue`。
3. 新增路由守卫，未登录自动跳转登录页，无权限自动进入 `403` 页面。
4. 新增后端接口鉴权，业务接口统一校验 Bearer Token 与动作权限。
5. 移除前端页面中的硬编码员工编号/审批人编号，统一改为按当前登录人执行业务。

## 2. 演示账号

后端启动后会自动初始化默认账号与权限策略，可直接使用：

| 角色 | 用户名 | 密码 | 可见菜单 |
|---|---|---|---|
| 平台管理员 | `admin` | `Admin@123` | 全部菜单 |
| 人事专员 | `hr` | `Hr@123456` | 经营看板、考勤管理、智能洞察 |
| 审批经理 | `manager` | `Manager@123` | 经营看板、审批待办、AI 对话中心、智能洞察 |
| 普通员工 | `employee` | `Employee@123` | 考勤管理、AI 对话中心、智能洞察 |

## 3. 前端关键改动

### 3.1 路由与布局

- `src/router/index.ts`
  - 新增登录页、403 页、主布局与业务子路由
  - 新增路由守卫：未登录跳登录页，已登录按菜单权限判断可访问页面
- `src/layouts/MainLayout.vue`
  - 左侧菜单改为从 `authStore.menus` 动态渲染
  - 顶部显示当前登录人、角色标签、退出登录按钮
- `src/App.vue`
  - 简化为纯路由出口

### 3.2 登录态与请求封装

- `src/stores/authStore.ts`
  - 统一维护 token、当前用户、菜单、首页路径、动作权限
- `src/services/http.ts`
  - 统一注入 `Authorization: Bearer xxx`
  - 统一拦截 401 并清理本地登录态
- `src/services/authService.ts`
  - 封装登录、获取当前用户、获取菜单、退出登录接口

### 3.3 页面去硬编码

以下页面已改为按当前登录人工作：

- `src/views/AttendanceView.vue`
- `src/views/WorkflowInboxView.vue`
- `src/views/AiDialogCenterView.vue`
- `src/views/InsightAssistantView.vue`
- `src/stores/chatStore.ts`

## 4. 后端关键改动

### 4.1 新增认证与权限模块

- `app/domain/models/auth_models.py`
  - 新增登录账号表 `user_accounts`
- `app/domain/services/auth_service.py`
  - 登录校验
  - 默认账号/权限种子数据初始化
  - 角色 -> 菜单/动作权限解析
- `app/security/token_service.py`
  - 基于标准库实现轻量 Bearer Token 签名与校验
- `app/domain/constants/auth_catalog.py`
  - 统一定义菜单目录、角色权限策略、默认账号与接口动作映射

### 4.2 新增认证接口

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/menus`
- `POST /api/v1/auth/logout`

### 4.3 接口鉴权升级

- `app/api/middleware/authz_middleware.py`
  - 从占位校验升级为真实 Bearer Token 校验
  - 自动把当前登录人写入 `request.state.current_user`
  - 基于动作权限拦截无权接口调用

### 4.4 业务接口改造

以下接口已改为优先使用当前登录人，不再信任前端传入的身份字段：

- 考勤：`attendance_routes.py`
- 审批：`workflow_routes.py`
- AI 对话：`chat_routes.py`
- 数据问答：`query_routes.py`
- 知识问答：`knowledge_routes.py`

## 5. 已执行验证

### 5.1 前端构建验证

已执行：

```powershell
Set-Location 'D:\webStormProjects\workSpace06'
npm run build
```

结果：**构建成功**。

### 5.2 后端权限烟雾测试

已执行：

```powershell
Set-Location 'D:\pyCharmProjects\workSpace03'
.\.conda\py311\python.exe -u .\app\tests\integration\auth_permissions_smoke.py
```

验证点：

1. 管理员可成功登录。
2. 已登录用户可获取当前用户和菜单信息。
3. 人事账号访问审批接口会被 `403` 拦截。
4. 人事账号访问考勤汇总接口可正常通过。

结果：**烟雾测试通过**。

## 6. 启动方式

### 6.1 启动后端

当前已知项目内有脚本：`D:\pyCharmProjects\workSpace03\scripts\start_backend.ps1`

也可直接执行：

```powershell
Set-Location 'D:\pyCharmProjects\workSpace03'
conda run -n ai_enterprise uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

### 6.2 启动前端

```powershell
Set-Location 'D:\webStormProjects\workSpace06'
npm run dev -- --host 0.0.0.0 --port 5175
```

访问地址通常为：

- `http://localhost:5175/`

## 7. 设计说明

### 7.1 使用的设计模式

1. **策略模式**
   - 用于角色 -> 菜单权限 / 动作权限解析
   - 通过 `access_policies` 与 `auth_catalog.py` 组织权限规则
2. **适配器模式**
   - 用于 `token_service.py`
   - 当前先使用标准库轻量 token，后续若切换 JWT / OAuth2，可保持业务层接口不变
3. **中间件模式**
   - 用于后端统一鉴权与上下文注入
   - 避免每个接口重复写 Bearer Token 解析逻辑

### 7.2 当前没有继续引入更重设计的原因

目前项目仍是单体前后端联调阶段，优先目标是：

- 菜单权限从“前端写死”升级为“服务端统一下发”
- 接口从“可伪造身份”升级为“服务端按登录人鉴权”
- 在不引入过多基础设施依赖的情况下快速落地可运行方案

因此暂未强行引入：

- Redis token 黑名单
- OAuth2 / SSO
- 多租户 RBAC
- 动态按钮级权限中心

这些能力都已为后续扩展预留位置。

## 8. 后续建议

建议下一步继续做：

1. 把当前轻量 token 升级为 JWT，并接入刷新 token 机制。
2. 把菜单权限继续细化为“页面 + 按钮 + 数据范围”。
3. 为审批、考勤、洞察等页面补真正的后端列表查询接口，去掉演示数据。
4. 补充前端单测与 E2E：登录、菜单显隐、403 拦截、退出登录。
5. 把默认演示账号初始化逻辑迁移到独立初始化脚本，便于测试/生产区分。

