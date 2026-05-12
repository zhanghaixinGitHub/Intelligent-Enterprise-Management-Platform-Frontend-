<template>
  <div class="placeholder-page">
    <el-alert
      :title="headerTitle"
      :type="hasPermission ? 'info' : 'warning'"
      show-icon
      :closable="false"
      class="placeholder-feedback"
    />

    <el-row :gutter="12">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ featureTitle }}</span>
              <el-tag :type="hasPermission ? 'success' : 'warning'" effect="plain">
                {{ hasPermission ? '已开放入口' : '当前账号仅可见骨架' }}
              </el-tag>
            </div>
          </template>

          <div class="placeholder-copy">
            <p>{{ description }}</p>
            <el-steps direction="vertical" :active="hasPermission ? 2 : 1" finish-status="success">
              <el-step title="页面入口已落地" description="左侧“我的流程”二级菜单已经按照企业级信息架构拆分完成。" />
              <el-step title="后端接口待接入" :description="apiPlan" />
              <el-step title="后续联调" description="待后端提供真实查询接口后，可直接切换为列表 / 搜索 / 详情联动模式。" />
            </el-steps>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>规划建议</template>
          <el-timeline>
            <el-timeline-item v-for="item in suggestions" :key="item" type="primary">
              {{ item }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  featureTitle: string;
  description: string;
  apiPlan: string;
  hasPermission: boolean;
}>();

const headerTitle = computed(() => {
  return props.hasPermission
    ? `${props.featureTitle}页面已就绪，当前阶段先展示骨架与后续接入计划。`
    : `当前账号暂未获得 ${props.featureTitle} 的完整管理权限，因此先展示受控骨架页面。`;
});

const suggestions = computed(() => [
  `为 ${props.featureTitle} 增加筛选条件、状态统计与分页列表。`,
  "补充详情抽屉或详情页，支持查看流程轨迹与关键字段。",
  "与后端统一状态枚举、排序规则与可操作按钮，避免前后端含义不一致。"
]);
</script>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.placeholder-feedback {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.placeholder-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #52637a;
  line-height: 1.8;
}

.placeholder-copy p {
  margin: 0;
}
</style>

