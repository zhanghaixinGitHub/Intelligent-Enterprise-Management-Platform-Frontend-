<template>
  <div class="forbidden-page">
    <el-result icon="warning" title="当前账号无权访问该页面" sub-title="请切换有对应菜单权限的账号，或联系管理员开通权限。">
      <template #extra>
        <el-space>
          <el-button type="primary" @click="goHome">返回可访问首页</el-button>
          <el-button @click="goLogin">切换账号</el-button>
        </el-space>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const goHome = async () => {
  await router.replace(authStore.homePath || "/login");
};

const goLogin = async () => {
  await authStore.logout();
  await router.replace("/login");
};
</script>

<style scoped>
.forbidden-page {
  min-height: calc(100vh - 220px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

