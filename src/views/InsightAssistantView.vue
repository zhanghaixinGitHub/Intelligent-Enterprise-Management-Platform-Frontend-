<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="数据问答" name="data" />
      <el-tab-pane label="知识问答" name="knowledge" />
    </el-tabs>

    <el-input
      v-model="question"
      placeholder="输入问题，例如：本月研发部加班最多的是谁"
      clearable
      class="query-input"
    />

    <el-space>
      <el-button type="primary" @click="submit" :loading="loading">执行查询</el-button>
      <el-button @click="question='报销流程怎么走'; submit()">示例问题</el-button>
    </el-space>

    <el-card shadow="never" class="result-card">
      <template #header>查询结果</template>
      <pre>{{ result }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { askData, askKnowledge } from "../services/insightService";

const activeTab = ref("data");
const question = ref("");
const result = ref("暂无结果");
const loading = ref(false);

const submit = async () => {
  if (!question.value.trim()) return;
  loading.value = true;
  try {
    const data = activeTab.value === "data"
      ? await askData("employee-001", question.value)
      : await askKnowledge("employee-001", question.value);
    result.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    result.value = `查询失败: ${e?.message || "未知错误"}`;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.query-input {
  margin-bottom: 12px;
}

.result-card {
  margin-top: 12px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
