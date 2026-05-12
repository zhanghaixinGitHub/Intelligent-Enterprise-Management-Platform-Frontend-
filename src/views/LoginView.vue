<template>
  <div class="login-page">
    <div class="background-glow background-glow-left"></div>
    <div class="background-glow background-glow-right"></div>

    <div class="login-shell">
      <section class="brand-panel">
        <div class="eyebrow">创达智管 · 企业运营控制台</div>
        <h1>登录后按角色加载菜单与页面权限</h1>
        <p>
          本次改造采用“服务端权限目录 + 前端路由守卫”方案：
          菜单不再写死在 `App.vue` 中，而是由后端根据账号角色返回可访问菜单列表。
        </p>

        <el-space wrap>
          <el-tag effect="dark">管理员：全量菜单 + 全流程管理能力</el-tag>
          <el-tag effect="plain">人事：看板 + 考勤 + 我的流程 + 洞察</el-tag>
          <el-tag effect="plain">审批经理：看板 + 我的流程 + 对话 + 洞察</el-tag>
          <el-tag effect="plain">普通员工：考勤 + 我的流程 + 对话 + 洞察</el-tag>
        </el-space>
      </section>

      <section class="form-panel">
        <div class="form-header">
          <h2>欢迎登录</h2>
          <p>请选择演示账号，或手动输入用户名密码。</p>
        </div>

        <el-form @submit.prevent="handleLogin">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名，例如：admin" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" placeholder="请输入密码" show-password clearable @keyup.enter="handleLogin" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="submit-button" :loading="submitting" @click="handleLogin">
              登录并加载权限
            </el-button>
          </el-form-item>
        </el-form>

        <div class="demo-accounts">
          <div class="demo-title">演示账号</div>
          <div class="demo-grid">
            <button
              v-for="account in demoAccounts"
              :key="account.username"
              type="button"
              class="demo-card"
              @click="fillDemoAccount(account.username, account.password)"
            >
              <div class="demo-name">{{ account.label }}</div>
              <div class="demo-line">用户名：{{ account.username }}</div>
              <div class="demo-line">密码：{{ account.password }}</div>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const submitting = ref(false);

const form = reactive({
  username: "admin",
  password: "Admin@123"
});

const demoAccounts = [
  { label: "平台管理员", username: "admin", password: "Admin@123" },
  { label: "人事专员", username: "hr", password: "Hr@123456" },
  { label: "审批经理", username: "manager", password: "Manager@123" },
  { label: "普通员工", username: "employee", password: "Employee@123" }
];

const fillDemoAccount = (username: string, password: string) => {
  form.username = username;
  form.password = password;
};

const handleLogin = async () => {
  if (!form.username.trim() || !form.password.trim()) {
    ElMessage.warning("LoginView.handleLogin   >>>   用户名和密码不能为空");
    return;
  }

  submitting.value = true;
  try {
    const result = await authStore.login({
      username: form.username.trim(),
      password: form.password.trim()
    });
    ElMessage.success(`LoginView.handleLogin   >>>   登录成功，欢迎 ${result.user.displayName}`);
    const redirectPath = typeof route.query.redirect === "string" ? route.query.redirect : result.homePath;
    await router.replace(redirectPath || result.homePath || "/403");
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "登录失败";
    ElMessage.error(`LoginView.handleLogin   >>>   ${message}`);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(0, 173, 181, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(17, 24, 39, 0.9), transparent 36%),
    linear-gradient(135deg, #09111f 0%, #12243d 48%, #09111f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.background-glow {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.55;
}

.background-glow-left {
  top: -70px;
  left: -40px;
  background: rgba(59, 130, 246, 0.32);
}

.background-glow-right {
  right: -60px;
  bottom: -90px;
  background: rgba(20, 184, 166, 0.28);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 22px 80px rgba(2, 6, 23, 0.45);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.brand-panel,
.form-panel {
  padding: 48px;
}

.brand-panel {
  color: #f8fafc;
  background: linear-gradient(160deg, rgba(13, 30, 57, 0.9), rgba(8, 19, 34, 0.72));
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: rgba(148, 163, 184, 0.96);
}

.brand-panel h1 {
  margin: 0;
  font-size: 36px;
  line-height: 1.2;
}

.brand-panel p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: rgba(226, 232, 240, 0.92);
}

.form-panel {
  background: rgba(247, 250, 252, 0.96);
}

.form-header h2 {
  margin: 0;
  font-size: 30px;
  color: #102a43;
}

.form-header p {
  margin: 8px 0 24px;
  color: #52637a;
}

.submit-button {
  width: 100%;
}

.demo-accounts {
  margin-top: 24px;
}

.demo-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #102a43;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.demo-card {
  text-align: left;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.demo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  border-color: rgba(37, 99, 235, 0.28);
}

.demo-name {
  font-weight: 700;
  color: #132238;
  margin-bottom: 8px;
}

.demo-line {
  font-size: 12px;
  color: #5b6b80;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel,
  .form-panel {
    padding: 32px 24px;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>

