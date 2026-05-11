<template>
  <div class="page">
    <el-alert
      :title="`当前会话身份：${authStore.user?.displayName || '-'}（${authStore.user?.employeeId || '-'}）`"
      type="info"
      show-icon
      :closable="false"
      class="status"
    />
    <el-row :gutter="12">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>会话窗口</template>
          <div class="msg-list">
            <div v-for="(item, idx) in store.messages" :key="idx" :class="['msg-item', item.role]">
              <span class="role">{{ item.role === 'user' ? '我' : 'AI' }}</span>
              <span>{{ item.content }}</span>
            </div>
          </div>
          <div class="input-area">
            <el-input
              v-model="text"
              placeholder="请输入：帮我请明天年假"
              @keyup.enter="submit"
              clearable
            />
            <el-button type="primary" @click="submit">发送</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>快捷指令</template>
          <el-space direction="vertical" fill>
            <el-button @click="quickAsk('帮我请明天年假')">请假申请</el-button>
            <el-button @click="quickAsk('提交上周出差500元餐费报销')">报销申请</el-button>
            <el-button @click="quickAsk('本月研发部加班最多的是谁')">数据查询</el-button>
            <el-button @click="quickAsk('报销流程怎么走')">制度问答</el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="error" />
    <el-alert
      v-if="lastStatus"
      :title="`最近一次状态：${lastStatus}`"
      type="info"
      show-icon
      :closable="false"
      class="status"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";

const authStore = useAuthStore();
const store = useChatStore();
const text = ref("");
const error = ref("");
const lastStatus = ref("");

const submit = async () => {
  if (!text.value.trim()) return;
  error.value = "";
  try {
    const data = await store.sendMessage(text.value.trim());
    lastStatus.value = data?.status || "";
    text.value = "";
  } catch (e: any) {
    error.value = e?.message || "发送失败";
  }
};

const quickAsk = (msg: string) => {
  text.value = msg;
  submit();
};
</script>

<style scoped>
.msg-list {
  min-height: 260px;
  max-height: 420px;
  overflow: auto;
  padding-right: 8px;
}

.msg-item {
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.msg-item.user {
  background: #ecf5ff;
}

.msg-item.assistant {
  background: #f4f4f5;
}

.role {
  font-weight: 700;
}

.input-area {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.error,
.status {
  margin-top: 12px;
}
</style>
