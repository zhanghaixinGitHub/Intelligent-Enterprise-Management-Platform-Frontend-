<template>
  <el-container class="layout-root">
    <el-aside width="240px" class="layout-aside">
      <div class="brand">
        <div class="brand-title">AI 企业管理平台</div>
        <div class="brand-subtitle">登录后按权限展示业务菜单</div>
      </div>

      <el-menu
        :default-active="activeMenuPath"
        :default-openeds="openedMenuKeys"
        class="menu"
        :router="true"
      >
        <template v-for="menu in authStore.menus" :key="menu.key">
          <el-sub-menu v-if="menu.children?.length" :index="menu.key">
            <template #title>
              <el-icon><component :is="resolveIcon(menu.icon)" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>

            <el-menu-item
              v-for="childMenu in menu.children"
              :key="childMenu.key"
              :index="childMenu.path"
            >
              <el-icon><component :is="resolveIcon(childMenu.icon)" /></el-icon>
              <span>{{ childMenu.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item
            v-else
            :index="menu.path"
          >
            <el-icon><component :is="resolveIcon(menu.icon)" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <div class="title">{{ currentTitle }}</div>
          <div class="subtitle">{{ currentDesc }}</div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <div class="user-name">{{ authStore.user?.displayName || "未登录" }}</div>
            <div class="user-meta">
              <el-tag v-for="roleName in authStore.user?.roleNames || []" :key="roleName" size="small" effect="plain">
                {{ roleName }}
              </el-tag>
            </div>
          </div>
          <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <el-card shadow="never" class="module-card">
          <RouterView />
        </el-card>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import { Calendar, ChatDotRound, CirclePlus, DataBoard, DeleteFilled, Document, List, MagicStick, Monitor, Tickets } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/authStore";
import { findMenuByKey, findMenuTrailByPath, flattenMenus } from "../utils/menu";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const iconMap = {
  Calendar,
  ChatDotRound,
  CirclePlus,
  DataBoard,
  DeleteFilled,
  Document,
  List,
  MagicStick,
  Monitor,
  Tickets
};

const resolveIcon = (iconName: string) => iconMap[iconName as keyof typeof iconMap] || DataBoard;

const flattenedMenus = computed(() => flattenMenus(authStore.menus));
const currentMenuTrail = computed(() => findMenuTrailByPath(authStore.menus, route.path));

const activeMenuPath = computed(() => {
  const matchedMenu = currentMenuTrail.value.at(-1);
  return matchedMenu?.path || authStore.homePath;
});

const openedMenuKeys = computed(() => {
  return currentMenuTrail.value.slice(0, -1).map((item) => item.key);
});

const currentMenu = computed(() => {
  const currentMenuKey = route.meta.menuKey as string | undefined;
  return (currentMenuKey ? findMenuByKey(authStore.menus, currentMenuKey) : undefined)
    || currentMenuTrail.value.at(-1)
    || flattenedMenus.value[0];
});

const currentTitle = computed(() => currentMenu.value?.title || "企业工作台");
const currentDesc = computed(() => currentMenu.value?.desc || "根据登录身份动态渲染可访问页面");

const handleLogout = async () => {
  await authStore.logout();
  ElMessage.success("MainLayout.handleLogout   >>>   已退出登录");
  await router.replace("/login");
};
</script>

<style scoped>
.layout-root {
  min-height: 100vh;
}

.layout-aside {
  background: linear-gradient(180deg, #102a43 0%, #0b1f33 100%);
  color: #fff;
}

.brand {
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
}

.menu {
  border-right: none;
  background: transparent;
}

/*
  为什么这样改：
  1. 当前侧边栏是深色背景，而 Element Plus 默认菜单文字在该场景下对比度不足，导致未悬停时几乎看不清。
  2. 这里通过深度选择器覆盖菜单内部样式，保证默认态就有足够可读性；
  3. 同时区分“默认 / 悬停 / 选中”三种状态，避免只靠鼠标移入才能识别菜单。
*/
:deep(.menu.el-menu) {
  --el-menu-bg-color: transparent;
  --el-menu-border-color: transparent;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-menu-text-color: rgba(255, 255, 255, 0.88);
  --el-menu-active-color: #ffffff;
}

:deep(.menu .el-menu-item) {
  margin: 8px 12px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}

:deep(.menu .el-sub-menu__title) {
  margin: 8px 12px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 600;
}

:deep(.menu .el-sub-menu__title .el-icon),
:deep(.menu .el-sub-menu__icon-arrow) {
  color: rgba(255, 255, 255, 0.78);
}

:deep(.menu .el-sub-menu__title:hover) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

:deep(.menu .el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #ffffff;
  background: rgba(64, 158, 255, 0.16);
}

:deep(.menu .el-menu .el-menu-item) {
  margin-left: 24px;
}

:deep(.menu .el-menu-item .el-icon) {
  color: rgba(255, 255, 255, 0.78);
}

:deep(.menu .el-menu-item:hover) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

:deep(.menu .el-menu-item:hover .el-icon) {
  color: #ffffff;
}

:deep(.menu .el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.32), rgba(64, 158, 255, 0.18));
  box-shadow: inset 3px 0 0 #66b1ff;
}

:deep(.menu .el-menu-item.is-active .el-icon) {
  color: #8cc5ff;
}

.layout-header {
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5edf5;
  padding: 0 24px;
}

.header-left .title {
  font-size: 20px;
  font-weight: 700;
  color: #132238;
}

.header-left .subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7a90;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
}

.user-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.layout-main {
  padding: 16px;
}

.module-card {
  min-height: calc(100vh - 104px);
  border-radius: 18px;
}
</style>

