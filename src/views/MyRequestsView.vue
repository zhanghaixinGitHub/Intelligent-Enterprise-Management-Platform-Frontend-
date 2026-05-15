<template>
  <div class="my-requests-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>我的请求</h2>
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-select v-model="filterStatus" placeholder="流程状态" clearable @change="handleFilter">
          <el-option label="全部" value="" />
          <el-option label="审批中" value="RUNNING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已撤回" value="REVOKED" />
        </el-select>
      </div>

      <!-- 请求列表 -->
      <el-table :data="filteredRequests" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="processDefinitionName" label="流程类型" min-width="150" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="processStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.processStatus)">
              {{ getStatusText(row.processStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentTaskNames" label="当前节点" min-width="150">
          <template #default="{ row }">
            {{ row.currentTaskNames?.join('、') || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="发起时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.canRevoke"
              type="danger"
              size="small"
              @click="handleRevoke(row)"
            >
              撤回
            </el-button>
            <el-button
              v-else
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && requests.length === 0"
        description="暂无流程请求"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getMyRequests, type WorkflowRequestItem } from '@/services/workflowService'

const loading = ref(false)
const requests = ref<WorkflowRequestItem[]>([])
const filterStatus = ref('')

const filteredRequests = computed(() => {
  if (!filterStatus.value) return requests.value
  return requests.value.filter(req => req.processStatus === filterStatus.value)
})

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    'RUNNING': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'REVOKED': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'RUNNING': '审批中',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'REVOKED': '已撤回'
  }
  return textMap[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await getMyRequests()
    requests.value = response.requests
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const handleFilter = () => {
  // 筛选逻辑已在 computed 中处理
}

const handleRevoke = async (row: WorkflowRequestItem) => {
  try {
    await ElMessageBox.confirm('确认撤回该流程请求吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // TODO: 调用撤回接口
    ElMessage.success('撤回成功')
    loadData()
  } catch {
    // 用户取消
  }
}

const handleViewDetail = (row: WorkflowRequestItem) => {
  // TODO: 跳转到流程详情页
  console.log('查看详情', row)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-requests-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
}
</style>
