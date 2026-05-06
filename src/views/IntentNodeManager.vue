<template>
  <div class="intent-page">
    <section class="glass-panel page-card">
      <div class="page-head">
        <div>
          <h2 class="section-title">意图识别结点管理</h2>
          <p class="section-subtitle">支持单条与批量管理。</p>
        </div>
        <div class="action-group">
          <el-input
            v-model.trim="keyword"
            placeholder="搜索名称、描述、知识库"
            clearable
            class="search-input"
          ></el-input>
          <el-button icon="el-icon-refresh" circle @click="loadNodes"></el-button>
          <el-button type="primary" @click="openDialog('create')">新建结点</el-button>
        </div>
      </div>

      <div class="batch-bar">
        <el-button :disabled="!selectedRows.length" @click="batchOperate('enable')">批量启用</el-button>
        <el-button :disabled="!selectedRows.length" @click="batchOperate('disable')">批量禁用</el-button>
        <el-popconfirm title="确认批量删除选中结点吗？" @confirm="batchOperate('delete')">
          <el-button slot="reference" :disabled="!selectedRows.length" type="danger" plain>批量删除</el-button>
        </el-popconfirm>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredNodes"
        stripe
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="结点名称" min-width="180"></el-table-column>
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.kind === 0 ? 'success' : 'warning'">
              {{ row.kind === 0 ? '知识库结点' : '系统结点' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="kbName" label="知识库" width="160"></el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column label="示例数" width="90">
          <template slot-scope="{ row }">{{ (row.examples || []).length }}</template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template slot-scope="{ row }">
            <el-switch :value="row.enabled === 1" @change="toggleNode(row, $event)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170">
          <template slot-scope="{ row }">
            <div class="action-group">
              <el-button type="text" @click="openDialog('edit', row)">编辑</el-button>
              <el-popconfirm title="确认删除该结点吗？" @confirm="removeNode(row)">
                <el-button slot="reference" type="text" class="danger-text">删除</el-button>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      :title="dialogMode === 'create' ? '新建意图结点' : '编辑意图结点'"
      :visible.sync="dialogVisible"
      width="700px"
      @closed="resetForm"
    >
      <el-form ref="nodeForm" :model="nodeForm" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="结点名称" prop="name">
            <el-input v-model.trim="nodeForm.name"></el-input>
          </el-form-item>
          <el-form-item label="结点类型" prop="kind">
            <el-select v-model="nodeForm.kind">
              <el-option label="知识库结点" :value="0"></el-option>
              <el-option label="系统结点" :value="1"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="nodeForm.kind === 0" label="关联知识库" prop="kbId">
            <el-select v-model="nodeForm.kbId" filterable>
              <el-option
                v-for="item in knowledgeBaseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="启用状态" prop="enabled">
            <el-select v-model="nodeForm.enabled">
              <el-option label="启用" :value="1"></el-option>
              <el-option label="禁用" :value="0"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="结点描述" prop="description">
          <el-input v-model.trim="nodeForm.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="示例问题">
          <el-input
            v-model.trim="nodeForm.examplesText"
            type="textarea"
            :rows="4"
            placeholder="每行一个示例问题"
          ></el-input>
        </el-form-item>
        <el-form-item label="短提示词">
          <el-input v-model.trim="nodeForm.promptSnippet" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="完整 Prompt 模板">
          <el-input v-model.trim="nodeForm.promptTemplate" type="textarea" :rows="6"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitNode">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  batchDeleteIntentNodes,
  batchDisableIntentNodes,
  batchEnableIntentNodes,
  createIntentNode,
  deleteIntentNode,
  fetchIntentNodes,
  fetchKnowledgeBasePage,
  updateIntentNode
} from '@/services/api';

function createForm() {
  return {
    id: '',
    kind: 0,
    kbId: '',
    name: '',
    description: '',
    examplesText: '',
    promptSnippet: '',
    promptTemplate: '',
    enabled: 1
  };
}

export default {
  name: 'IntentNodeManager',
  data() {
    return {
      loading: false,
      submitting: false,
      keyword: '',
      nodes: [],
      selectedRows: [],
      dialogVisible: false,
      dialogMode: 'create',
      nodeForm: createForm(),
      knowledgeBaseOptions: [],
      rules: {
        name: [{ required: true, message: '请输入结点名称', trigger: 'blur' }],
        kind: [{ required: true, message: '请选择结点类型', trigger: 'change' }],
        description: [{ required: true, message: '请输入结点描述', trigger: 'blur' }]
      }
    };
  },
  computed: {
    filteredNodes() {
      if (!this.keyword) {
        return this.nodes;
      }
      const key = this.keyword.toLowerCase();
      return this.nodes.filter(item => {
        const examples = (item.examples || []).join(' ');
        return [item.name, item.description, item.kbName, examples]
          .join(' ')
          .toLowerCase()
          .includes(key);
      });
    }
  },
  created() {
    this.loadNodes();
    this.loadKnowledgeBases();
  },
  methods: {
    async loadNodes() {
      this.loading = true;
      try {
        const result = await fetchIntentNodes();
        this.nodes = result.data || [];
      } catch (error) {
        this.$message.error(error.message || '获取意图结点失败');
      } finally {
        this.loading = false;
      }
    },
    async loadKnowledgeBases() {
      try {
        const result = await fetchKnowledgeBasePage({ current: 1, size: 100 });
        this.knowledgeBaseOptions = (result.data && result.data.records) || [];
      } catch (error) {
        this.knowledgeBaseOptions = [];
      }
    },
    openDialog(mode, row) {
      this.dialogMode = mode;
      if (mode === 'edit' && row) {
        this.nodeForm = {
          id: row.id,
          kind: row.kind,
          kbId: row.kbId || '',
          name: row.name,
          description: row.description,
          examplesText: (row.examples || []).join('\n'),
          promptSnippet: row.promptSnippet || '',
          promptTemplate: row.promptTemplate || '',
          enabled: row.enabled
        };
      } else {
        this.nodeForm = createForm();
      }
      this.dialogVisible = true;
    },
    resetForm() {
      this.nodeForm = createForm();
      if (this.$refs.nodeForm) {
        this.$refs.nodeForm.resetFields();
      }
    },
    buildPayload() {
      return {
        kind: this.nodeForm.kind,
        kbId: this.nodeForm.kind === 0 ? this.nodeForm.kbId : '',
        name: this.nodeForm.name,
        description: this.nodeForm.description,
        examples: this.nodeForm.examplesText.split(/\r?\n/).map(item => item.trim()).filter(Boolean),
        promptSnippet: this.nodeForm.promptSnippet,
        promptTemplate: this.nodeForm.promptTemplate,
        enabled: this.nodeForm.enabled
      };
    },
    submitNode() {
      if (this.nodeForm.kind === 0 && !this.nodeForm.kbId) {
        this.$message.warning('知识库结点必须选择关联知识库');
        return;
      }
      this.$refs.nodeForm.validate(async valid => {
        if (!valid) {
          return;
        }
        this.submitting = true;
        try {
          const payload = this.buildPayload();
          if (this.dialogMode === 'create') {
            await createIntentNode(payload);
            this.$message.success('结点已创建');
          } else {
            await updateIntentNode(this.nodeForm.id, payload);
            this.$message.success('结点已更新');
          }
          this.dialogVisible = false;
          await this.loadNodes();
        } catch (error) {
          this.$message.error(error.message || '保存结点失败');
        } finally {
          this.submitting = false;
        }
      });
    },
    async toggleNode(row, value) {
      try {
        await updateIntentNode(row.id, {
          enabled: value ? 1 : 0
        });
        this.$message.success('结点状态已更新');
        await this.loadNodes();
      } catch (error) {
        this.$message.error(error.message || '更新状态失败');
      }
    },
    async removeNode(row) {
      try {
        await deleteIntentNode(row.id);
        this.$message.success('结点已删除');
        await this.loadNodes();
      } catch (error) {
        this.$message.error(error.message || '删除结点失败');
      }
    },
    async batchOperate(action) {
      if (!this.selectedRows.length) {
        return;
      }
      const payload = {
        ids: this.selectedRows.map(item => item.id)
      };
      try {
        if (action === 'enable') {
          await batchEnableIntentNodes(payload);
        } else if (action === 'disable') {
          await batchDisableIntentNodes(payload);
        } else {
          await batchDeleteIntentNodes(payload);
        }
        this.$message.success(`批量${action === 'delete' ? '删除' : action === 'enable' ? '启用' : '禁用'}完成`);
        this.selectedRows = [];
        await this.loadNodes();
      } catch (error) {
        this.$message.error(error.message || '批量操作失败');
      }
    }
  }
};
</script>

<style scoped>
.intent-page { min-height: 100vh; padding: 24px; }
.page-card { min-height: calc(100vh - 48px); border-radius: 28px; padding: 24px; }
.page-head, .batch-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.batch-bar { margin: 18px 0; justify-content: flex-start; }
.action-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-input { width: 280px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.danger-text { color: #df5b5b; }
@media (max-width: 900px) {
  .intent-page { padding: 18px; }
  .page-head { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
