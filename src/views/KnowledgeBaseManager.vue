<template>
  <div class="knowledge-page">
    <section class="kb-list-panel glass-panel">
      <div class="panel-head">
        <div>
          <h2 class="section-title">知识库管理</h2>
          <p class="section-subtitle">统一管理知识库、文档和分块。</p>
        </div>
        <el-button icon="el-icon-refresh" circle @click="loadKnowledgeBases"></el-button>
      </div>

      <div class="toolbar-row">
        <el-input
          v-model.trim="kbQuery.name"
          placeholder="搜索知识库名称"
          clearable
          @keyup.enter.native="loadKnowledgeBases"
          @clear="loadKnowledgeBases"
        >
          <el-button slot="append" icon="el-icon-search" @click="loadKnowledgeBases"></el-button>
        </el-input>
      </div>

      <div v-loading="kbLoading" class="kb-list">
        <button
          v-for="item in knowledgeBases"
          :key="item.id"
          type="button"
          class="kb-item"
          :class="{ active: item.id === activeKbId }"
          @click="selectKnowledgeBase(item.id)"
        >
          <div>
            <div class="kb-name">{{ item.name }}</div>
            <div class="kb-meta">{{ item.embeddingModel || '未配置嵌入模型' }}</div>
          </div>
          <span class="kb-count">{{ item.documentCount || 0 }}</span>
        </button>
        <div v-if="!kbLoading && !knowledgeBases.length" class="empty-block">当前还没有知识库。</div>
      </div>

      <el-pagination
        small
        background
        layout="prev, pager, next"
        :current-page="kbQuery.current"
        :page-size="kbQuery.size"
        :total="kbTotal"
        @current-change="handleKbPageChange"
      ></el-pagination>

      <el-button class="create-btn" type="primary" @click="openKbDialog('create')">新建知识库</el-button>
    </section>

    <section class="kb-detail-panel">
      <template v-if="activeKb">
        <div class="hero-panel glass-panel">
          <div>
            <span class="hero-kicker">Knowledge Workspace</span>
            <h1>{{ activeKb.name }}</h1>
            <p>集合名：{{ activeKb.collectionName || '未生成' }}，嵌入模型：{{ activeKb.embeddingModel || '未配置' }}</p>
          </div>
          <div class="hero-stats">
            <div class="stat-card">
              <strong>{{ activeKb.documentCount || 0 }}</strong>
              <span>文档数量</span>
            </div>
            <div class="stat-card">
              <strong>{{ formatDateTime(activeKb.updateTime || activeKb.createTime) || '--' }}</strong>
              <span>最近更新时间</span>
            </div>
          </div>
          <div class="hero-actions">
            <el-button type="primary" @click="openDocDialog('upload')">上传文档</el-button>
            <el-button plain @click="openKbDialog('edit')">编辑配置</el-button>
            <el-button plain @click="openRenameDialog">重命名</el-button>
            <el-popconfirm title="确认删除当前知识库吗？" @confirm="removeKnowledgeBase">
              <el-button slot="reference" type="danger" plain>删除知识库</el-button>
            </el-popconfirm>
          </div>
        </div>

        <div class="content-grid">
          <article class="content-card glass-panel">
            <div class="card-head">
              <div>
                <h3>文档列表</h3>
                <p>支持上传、分块、启停、编辑、删除和日志查看。</p>
              </div>
              <el-button type="primary" plain @click="openDocDialog('upload')">新增文档</el-button>
            </div>

            <div class="filter-row">
              <el-input
                v-model.trim="documentQuery.keyword"
                placeholder="按文档名称搜索"
                clearable
                @keyup.enter.native="loadDocuments"
                @clear="loadDocuments"
              ></el-input>
              <el-select v-model="documentQuery.status" clearable placeholder="状态" @change="loadDocuments">
                <el-option label="处理中" value="running"></el-option>
                <el-option label="成功" value="success"></el-option>
                <el-option label="失败" value="failed"></el-option>
                <el-option label="待处理" value="pending"></el-option>
              </el-select>
              <el-button icon="el-icon-search" @click="loadDocuments">查询</el-button>
            </div>

            <el-table v-loading="documentsLoading" :data="documents" stripe>
              <el-table-column prop="docName" label="文档"></el-table-column>
              <el-table-column prop="sourceType" label="来源" width="90"></el-table-column>
              <el-table-column label="状态" width="110">
                <template slot-scope="{ row }">
                  <el-tag size="small" :type="documentStatusType(row.status)">{{ row.status || 'unknown' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="90">
                <template slot-scope="{ row }">
                  <el-switch :value="Boolean(row.enabled)" @change="toggleDocument(row)"></el-switch>
                </template>
              </el-table-column>
              <el-table-column prop="chunkCount" label="Chunk" width="90"></el-table-column>
              <el-table-column label="操作" min-width="250">
                <template slot-scope="{ row }">
                  <div class="action-group">
                    <el-button type="text" @click="openDocDialog('edit', row)">编辑</el-button>
                    <el-button type="text" @click="startChunk(row)">分块</el-button>
                    <el-button type="text" @click="openChunkDialog(row)">Chunk</el-button>
                    <el-button type="text" @click="openLogDialog(row)">日志</el-button>
                    <el-popconfirm title="确认删除该文档吗？" @confirm="removeDocument(row)">
                      <el-button slot="reference" type="text" class="danger-text">删除</el-button>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              background
              layout="total, prev, pager, next"
              :current-page="documentQuery.current"
              :page-size="documentQuery.size"
              :total="documentTotal"
              @current-change="handleDocumentPageChange"
            ></el-pagination>
          </article>

          <article class="content-card glass-panel">
            <div class="card-head">
              <div>
                <h3>全局文档搜索</h3>
                <p>调用搜索接口快速定位跨知识库文档。</p>
              </div>
            </div>

            <div class="filter-row">
              <el-input
                v-model.trim="searchKeyword"
                placeholder="输入关键字后搜索"
                clearable
                @keyup.enter.native="handleDocumentSearch"
              ></el-input>
              <el-input-number v-model="searchLimit" :min="1" :max="20"></el-input-number>
              <el-button icon="el-icon-search" @click="handleDocumentSearch">搜索</el-button>
            </div>

            <div v-loading="searchLoading" class="search-result-list">
              <button
                v-for="item in searchResults"
                :key="item.id"
                type="button"
                class="search-item"
                @click="jumpToSearchResult(item)"
              >
                <div class="search-title">{{ item.docName }}</div>
                <div class="search-subtitle">{{ item.kbName || item.kbId }}</div>
              </button>
              <div v-if="!searchLoading && !searchResults.length" class="empty-block">暂无搜索结果。</div>
            </div>
          </article>
        </div>
      </template>

      <div v-else class="placeholder-panel glass-panel">
        <div class="placeholder-icon">KB</div>
        <h3>选择一个知识库查看详情</h3>
        <p>左侧列表支持分页与搜索，选中后会加载文档与分块管理能力。</p>
      </div>
    </section>

    <el-dialog
      :title="kbDialogMode === 'create' ? '新建知识库' : '编辑知识库'"
      :visible.sync="kbDialogVisible"
      width="520px"
      @closed="resetKbForm"
    >
      <el-form ref="kbForm" :model="kbForm" :rules="kbRules" label-position="top">
        <el-form-item label="知识库名称" prop="name">
          <el-input v-model.trim="kbForm.name"></el-input>
        </el-form-item>
        <el-form-item label="嵌入模型" prop="embeddingModel">
          <el-input v-model.trim="kbForm.embeddingModel"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="kbDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingKb" @click="submitKnowledgeBase">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="docDialogMode === 'upload' ? '新增文档' : '编辑文档'"
      :visible.sync="docDialogVisible"
      width="640px"
      @closed="resetDocForm"
    >
      <el-form ref="docForm" :model="docForm" :rules="docRules" label-position="top">
        <div class="dialog-grid">
          <el-form-item label="来源类型" prop="sourceType">
            <el-select v-model="docForm.sourceType">
              <el-option label="文件上传" value="file"></el-option>
              <el-option label="URL 抓取" value="url"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="处理模式" prop="processMode">
            <el-select v-model="docForm.processMode">
              <el-option label="chunk" value="chunk"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="分块策略" prop="chunkStrategy">
            <el-select v-model="docForm.chunkStrategy">
              <el-option label="fixed_size" value="fixed_size"></el-option>
              <el-option label="structure_aware" value="structure_aware"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="定时抓取">
            <el-switch v-model="docForm.scheduleEnabled"></el-switch>
          </el-form-item>
        </div>

        <el-form-item v-if="docDialogMode === 'edit'" label="文档名称" prop="docName">
          <el-input v-model.trim="docForm.docName"></el-input>
        </el-form-item>

        <el-form-item v-if="docForm.sourceType === 'url'" label="来源地址" prop="sourceLocation">
          <el-input v-model.trim="docForm.sourceLocation" placeholder="请输入 URL"></el-input>
        </el-form-item>

        <el-form-item v-if="docForm.scheduleEnabled" label="Cron 表达式" prop="scheduleCron">
          <el-input v-model.trim="docForm.scheduleCron" placeholder="例如 0 0/30 * * * ?"></el-input>
        </el-form-item>

        <el-form-item v-if="docDialogMode === 'upload' && docForm.sourceType === 'file'" label="选择文件">
          <input type="file" class="file-input" @change="handleFileChange">
          <div class="input-help">{{ docForm.file ? docForm.file.name : '尚未选择文件' }}</div>
        </el-form-item>

        <el-form-item label="分块配置 JSON" prop="chunkConfig">
          <el-input v-model.trim="docForm.chunkConfig" type="textarea" :rows="5"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="docDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingDoc" @click="submitDocument">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="Chunk 管理"
      :visible.sync="chunkDialogVisible"
      width="920px"
      @closed="resetChunkDialog"
    >
      <div class="dialog-head-inline">
        <div>
          <strong>{{ currentDoc.docName || '当前文档' }}</strong>
          <div class="section-subtitle">支持单条启停、批量启停与向量重建。</div>
        </div>
        <div class="action-group">
          <el-select v-model="chunkQuery.enabled" clearable placeholder="启用状态" @change="loadChunks">
            <el-option label="启用" :value="1"></el-option>
            <el-option label="禁用" :value="0"></el-option>
          </el-select>
          <el-button @click="batchToggleChunks('enable')">批量启用</el-button>
          <el-button @click="batchToggleChunks('disable')">批量禁用</el-button>
          <el-button type="primary" plain @click="rebuildChunks">重建向量</el-button>
        </div>
      </div>

      <el-table
        v-loading="chunksLoading"
        :data="chunks"
        stripe
        @selection-change="selectedChunks = $event"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="chunkIndex" label="#" width="70"></el-table-column>
        <el-table-column prop="content" label="内容" show-overflow-tooltip></el-table-column>
        <el-table-column prop="tokenCount" label="Token" width="90"></el-table-column>
        <el-table-column label="启用" width="90">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="{ row }">
            <div class="action-group">
              <el-button v-if="!row.enabled" type="text" @click="toggleChunk(row, true)">启用</el-button>
              <el-button v-else type="text" @click="toggleChunk(row, false)">禁用</el-button>
              <el-popconfirm title="确认删除该 chunk 吗？" @confirm="removeChunk(row)">
                <el-button slot="reference" type="text" class="danger-text">删除</el-button>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="chunkQuery.current"
        :page-size="chunkQuery.size"
        :total="chunkTotal"
        @current-change="handleChunkPageChange"
      ></el-pagination>
    </el-dialog>

    <el-dialog title="分块日志" :visible.sync="logDialogVisible" width="880px">
      <el-table v-loading="logsLoading" :data="chunkLogs" stripe>
        <el-table-column prop="status" label="状态" width="100"></el-table-column>
        <el-table-column prop="chunkStrategy" label="策略" width="120"></el-table-column>
        <el-table-column prop="chunkCount" label="生成 Chunk" width="110"></el-table-column>
        <el-table-column label="总耗时(ms)" width="120">
          <template slot-scope="{ row }">{{ row.totalDuration || 0 }}</template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template slot-scope="{ row }">{{ formatDateTime(row.startTime || row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip></el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import {
  batchDisableKnowledgeChunks,
  batchEnableKnowledgeChunks,
  createKnowledgeBase,
  deleteKnowledgeBase,
  deleteKnowledgeChunk,
  deleteKnowledgeDocument,
  disableKnowledgeChunk,
  enableKnowledgeChunk,
  fetchKnowledgeBaseDetail,
  fetchKnowledgeBasePage,
  fetchKnowledgeChunks,
  fetchKnowledgeDocumentChunkLogs,
  fetchKnowledgeDocumentDetail,
  fetchKnowledgeDocuments,
  rebuildKnowledgeChunks,
  renameKnowledgeBase,
  searchKnowledgeDocuments,
  startKnowledgeDocumentChunk,
  toggleKnowledgeDocumentEnabled,
  updateKnowledgeBase,
  updateKnowledgeDocument,
  uploadKnowledgeDocument
} from '@/services/api';

function createKbForm() {
  return { id: '', name: '', embeddingModel: '' };
}

function createDocForm() {
  return {
    id: '',
    docName: '',
    sourceType: 'file',
    sourceLocation: '',
    scheduleEnabled: false,
    scheduleCron: '',
    processMode: 'chunk',
    chunkStrategy: 'fixed_size',
    chunkConfig: '{"chunkSize":500,"chunkOverlap":50}',
    file: null
  };
}

function normalizePage(result) {
  const page = (result && result.data) || {};
  return {
    records: page.records || [],
    total: Number(page.total || 0)
  };
}

export default {
  name: 'KnowledgeBaseManager',
  data() {
    return {
      kbLoading: false,
      kbDialogVisible: false,
      kbDialogMode: 'create',
      submittingKb: false,
      knowledgeBases: [],
      kbTotal: 0,
      kbQuery: { current: 1, size: 8, name: '' },
      activeKbId: '',
      activeKb: null,
      documentsLoading: false,
      documents: [],
      documentTotal: 0,
      documentQuery: { current: 1, size: 8, keyword: '', status: '' },
      searchKeyword: '',
      searchLimit: 8,
      searchResults: [],
      searchLoading: false,
      docDialogVisible: false,
      docDialogMode: 'upload',
      docForm: createDocForm(),
      submittingDoc: false,
      currentDoc: {},
      chunkDialogVisible: false,
      chunksLoading: false,
      chunks: [],
      chunkTotal: 0,
      chunkQuery: { current: 1, size: 8, enabled: '' },
      selectedChunks: [],
      logDialogVisible: false,
      logsLoading: false,
      chunkLogs: [],
      kbForm: createKbForm(),
      kbRules: {
        name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
        embeddingModel: [{ required: true, message: '请输入嵌入模型', trigger: 'blur' }]
      },
      docRules: {
        sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
        processMode: [{ required: true, message: '请选择处理模式', trigger: 'change' }],
        chunkStrategy: [{ required: true, message: '请选择分块策略', trigger: 'change' }],
        chunkConfig: [{ required: true, message: '请输入 chunk 配置 JSON', trigger: 'blur' }]
      }
    };
  },
  created() {
    this.loadKnowledgeBases();
  },
  methods: {
    async loadKnowledgeBases() {
      this.kbLoading = true;
      try {
        const result = await fetchKnowledgeBasePage(this.kbQuery);
        const page = normalizePage(result);
        this.knowledgeBases = page.records;
        this.kbTotal = page.total;
        if (this.knowledgeBases.length) {
          const targetId = this.knowledgeBases.some(item => item.id === this.activeKbId)
            ? this.activeKbId
            : this.knowledgeBases[0].id;
          await this.selectKnowledgeBase(targetId);
        } else {
          this.activeKbId = '';
          this.activeKb = null;
          this.documents = [];
          this.documentTotal = 0;
        }
      } catch (error) {
        this.$message.error(error.message || '获取知识库列表失败');
      } finally {
        this.kbLoading = false;
      }
    },
    async selectKnowledgeBase(kbId) {
      if (!kbId) {
        return;
      }
      this.activeKbId = kbId;
      try {
        const result = await fetchKnowledgeBaseDetail(kbId);
        this.activeKb = result.data || null;
        this.documentQuery.current = 1;
        await this.loadDocuments();
      } catch (error) {
        this.$message.error(error.message || '获取知识库详情失败');
      }
    },
    async loadDocuments() {
      if (!this.activeKbId) {
        return;
      }
      this.documentsLoading = true;
      try {
        const result = await fetchKnowledgeDocuments(this.activeKbId, this.documentQuery);
        const page = normalizePage(result);
        this.documents = page.records;
        this.documentTotal = page.total;
      } catch (error) {
        this.$message.error(error.message || '获取文档列表失败');
      } finally {
        this.documentsLoading = false;
      }
    },
    handleKbPageChange(page) {
      this.kbQuery.current = page;
      this.loadKnowledgeBases();
    },
    handleDocumentPageChange(page) {
      this.documentQuery.current = page;
      this.loadDocuments();
    },
    handleChunkPageChange(page) {
      this.chunkQuery.current = page;
      this.loadChunks();
    },
    openKbDialog(mode) {
      this.kbDialogMode = mode;
      if (mode === 'edit' && this.activeKb) {
        this.kbForm = {
          id: this.activeKb.id,
          name: this.activeKb.name,
          embeddingModel: this.activeKb.embeddingModel
        };
      } else {
        this.kbForm = createKbForm();
      }
      this.kbDialogVisible = true;
    },
    resetKbForm() {
      this.kbForm = createKbForm();
      if (this.$refs.kbForm) {
        this.$refs.kbForm.resetFields();
      }
    },
    submitKnowledgeBase() {
      this.$refs.kbForm.validate(async valid => {
        if (!valid) {
          return;
        }
        this.submittingKb = true;
        try {
          if (this.kbDialogMode === 'create') {
            const result = await createKnowledgeBase(this.kbForm);
            this.$message.success('知识库已创建');
            this.kbDialogVisible = false;
            await this.loadKnowledgeBases();
            if (result.data) {
              await this.selectKnowledgeBase(result.data);
            }
          } else {
            await updateKnowledgeBase(this.kbForm);
            this.$message.success('知识库已更新');
            this.kbDialogVisible = false;
            await this.loadKnowledgeBases();
          }
        } catch (error) {
          this.$message.error(error.message || '保存知识库失败');
        } finally {
          this.submittingKb = false;
        }
      });
    },
    async openRenameDialog() {
      if (!this.activeKb) {
        return;
      }
      try {
        const { value } = await this.$prompt('请输入新的知识库名称', '重命名知识库', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: this.activeKb.name
        });
        await renameKnowledgeBase({
          id: this.activeKb.id,
          name: value,
          embeddingModel: this.activeKb.embeddingModel
        });
        this.$message.success('知识库已重命名');
        await this.loadKnowledgeBases();
      } catch (error) {
        if (error === 'cancel') {
          return;
        }
        this.$message.error(error.message || '重命名失败');
      }
    },
    async removeKnowledgeBase() {
      if (!this.activeKbId) {
        return;
      }
      try {
        await deleteKnowledgeBase(this.activeKbId);
        this.$message.success('知识库已删除');
        this.activeKbId = '';
        this.activeKb = null;
        await this.loadKnowledgeBases();
      } catch (error) {
        this.$message.error(error.message || '删除知识库失败');
      }
    },
    async handleDocumentSearch() {
      this.searchLoading = true;
      try {
        const result = await searchKnowledgeDocuments({
          keyword: this.searchKeyword,
          limit: this.searchLimit
        });
        this.searchResults = result.data || [];
      } catch (error) {
        this.$message.error(error.message || '文档搜索失败');
      } finally {
        this.searchLoading = false;
      }
    },
    async jumpToSearchResult(item) {
      if (!item || !item.kbId) {
        return;
      }
      await this.selectKnowledgeBase(item.kbId);
      this.documentQuery.keyword = item.docName || '';
      this.documentQuery.current = 1;
      await this.loadDocuments();
    },
    openDocDialog(mode, row) {
      this.docDialogMode = mode;
      if (mode === 'edit' && row) {
        this.loadDocumentDetail(row.id);
      } else {
        this.docForm = createDocForm();
      }
      this.docDialogVisible = true;
    },
    async loadDocumentDetail(docId) {
      try {
        const result = await fetchKnowledgeDocumentDetail(docId);
        const detail = result.data || {};
        this.docForm = {
          id: detail.id,
          docName: detail.docName || '',
          sourceType: detail.sourceType || 'file',
          sourceLocation: detail.sourceLocation || '',
          scheduleEnabled: Boolean(detail.scheduleEnabled),
          scheduleCron: detail.scheduleCron || '',
          processMode: detail.processMode || 'chunk',
          chunkStrategy: detail.chunkStrategy || 'fixed_size',
          chunkConfig: detail.chunkConfig || '{"chunkSize":500,"chunkOverlap":50}',
          file: null
        };
      } catch (error) {
        this.$message.error(error.message || '获取文档详情失败');
      }
    },
    resetDocForm() {
      this.docForm = createDocForm();
      this.currentDoc = {};
      if (this.$refs.docForm) {
        this.$refs.docForm.resetFields();
      }
    },
    handleFileChange(event) {
      const files = event.target.files || [];
      this.docForm.file = files[0] || null;
    },
    submitDocument() {
      if (this.docDialogMode === 'upload' && this.docForm.sourceType === 'file' && !this.docForm.file) {
        this.$message.warning('请选择上传文件');
        return;
      }
      if (this.docForm.sourceType === 'url' && !this.docForm.sourceLocation) {
        this.$message.warning('请输入来源地址');
        return;
      }
      try {
        JSON.parse(this.docForm.chunkConfig || '{}');
      } catch (error) {
        this.$message.warning('chunk 配置必须是合法 JSON');
        return;
      }
      this.$refs.docForm.validate(async valid => {
        if (!valid) {
          return;
        }
        this.submittingDoc = true;
        try {
          if (this.docDialogMode === 'upload') {
            const formData = new FormData();
            formData.append('sourceType', this.docForm.sourceType);
            formData.append('sourceLocation', this.docForm.sourceLocation || '');
            formData.append('scheduleEnabled', this.docForm.scheduleEnabled);
            formData.append('scheduleCron', this.docForm.scheduleCron || '');
            formData.append('processMode', this.docForm.processMode);
            formData.append('chunkStrategy', this.docForm.chunkStrategy);
            formData.append('chunkConfig', this.docForm.chunkConfig);
            if (this.docForm.file) {
              formData.append('file', this.docForm.file);
            }
            await uploadKnowledgeDocument(this.activeKbId, formData);
            this.$message.success('文档已提交');
          } else {
            await updateKnowledgeDocument(this.docForm.id, {
              docName: this.docForm.docName,
              processMode: this.docForm.processMode,
              chunkStrategy: this.docForm.chunkStrategy,
              chunkConfig: this.docForm.chunkConfig
            });
            this.$message.success('文档已更新');
          }
          this.docDialogVisible = false;
          await this.refreshKnowledgeBaseData();
        } catch (error) {
          this.$message.error(error.message || '保存文档失败');
        } finally {
          this.submittingDoc = false;
        }
      });
    },
    async refreshKnowledgeBaseData() {
      if (!this.activeKbId) {
        return;
      }
      const currentId = this.activeKbId;
      await this.loadKnowledgeBases();
      await this.selectKnowledgeBase(currentId);
    },
    async startChunk(row) {
      try {
        await startKnowledgeDocumentChunk(row.id);
        this.$message.success('已触发文档分块');
        await this.loadDocuments();
      } catch (error) {
        this.$message.error(error.message || '触发分块失败');
      }
    },
    async toggleDocument(row) {
      try {
        await toggleKnowledgeDocumentEnabled(row.id, !row.enabled);
        this.$message.success('文档状态已更新');
        await this.loadDocuments();
      } catch (error) {
        this.$message.error(error.message || '更新文档状态失败');
      }
    },
    async removeDocument(row) {
      try {
        await deleteKnowledgeDocument(row.id);
        this.$message.success('文档已删除');
        await this.refreshKnowledgeBaseData();
      } catch (error) {
        this.$message.error(error.message || '删除文档失败');
      }
    },
    openChunkDialog(row) {
      this.currentDoc = row || {};
      this.chunkQuery.current = 1;
      this.chunkDialogVisible = true;
      this.loadChunks();
    },
    resetChunkDialog() {
      this.currentDoc = {};
      this.selectedChunks = [];
      this.chunks = [];
      this.chunkTotal = 0;
      this.chunkQuery = { current: 1, size: 8, enabled: '' };
    },
    async loadChunks() {
      if (!this.currentDoc.id) {
        return;
      }
      this.chunksLoading = true;
      try {
        const result = await fetchKnowledgeChunks(this.currentDoc.id, this.chunkQuery);
        const page = normalizePage(result);
        this.chunks = page.records;
        this.chunkTotal = page.total;
      } catch (error) {
        this.$message.error(error.message || '获取 chunk 列表失败');
      } finally {
        this.chunksLoading = false;
      }
    },
    async toggleChunk(row, enabled) {
      try {
        if (enabled) {
          await enableKnowledgeChunk(this.currentDoc.id, row.id);
        } else {
          await disableKnowledgeChunk(this.currentDoc.id, row.id);
        }
        this.$message.success('Chunk 状态已更新');
        await this.loadChunks();
      } catch (error) {
        this.$message.error(error.message || '更新 chunk 状态失败');
      }
    },
    async batchToggleChunks(action) {
      if (!this.currentDoc.id) {
        return;
      }
      const payload = this.selectedChunks.length
        ? { chunkIds: this.selectedChunks.map(item => item.id) }
        : {};
      try {
        if (action === 'enable') {
          await batchEnableKnowledgeChunks(this.currentDoc.id, payload);
        } else {
          await batchDisableKnowledgeChunks(this.currentDoc.id, payload);
        }
        this.$message.success(`批量${action === 'enable' ? '启用' : '禁用'}完成`);
        await this.loadChunks();
      } catch (error) {
        this.$message.error(error.message || '批量操作失败');
      }
    },
    async rebuildChunks() {
      try {
        await rebuildKnowledgeChunks(this.currentDoc.id);
        this.$message.success('已触发向量重建');
      } catch (error) {
        this.$message.error(error.message || '重建向量失败');
      }
    },
    async removeChunk(row) {
      try {
        await deleteKnowledgeChunk(this.currentDoc.id, row.id);
        this.$message.success('Chunk 已删除');
        await this.loadChunks();
      } catch (error) {
        this.$message.error(error.message || '删除 chunk 失败');
      }
    },
    async openLogDialog(row) {
      this.currentDoc = row || {};
      this.logDialogVisible = true;
      this.logsLoading = true;
      try {
        const result = await fetchKnowledgeDocumentChunkLogs(row.id, { current: 1, size: 20 });
        const page = normalizePage(result);
        this.chunkLogs = page.records;
      } catch (error) {
        this.$message.error(error.message || '获取分块日志失败');
      } finally {
        this.logsLoading = false;
      }
    },
    documentStatusType(status) {
      const map = { success: 'success', failed: 'danger', running: 'warning', pending: 'info' };
      return map[status] || 'info';
    },
    formatDateTime(value) {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      const hour = `${date.getHours()}`.padStart(2, '0');
      const minute = `${date.getMinutes()}`.padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
  }
};
</script>

<style scoped>
.knowledge-page { min-height: 100vh; padding: 24px; display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 22px; }
.kb-list-panel, .hero-panel, .content-card, .placeholder-panel { border-radius: 28px; }
.kb-list-panel { min-height: calc(100vh - 48px); padding: 22px 18px 18px; display: flex; flex-direction: column; gap: 16px; }
.kb-detail-panel { min-width: 0; display: flex; flex-direction: column; gap: 18px; }
.panel-head, .card-head, .dialog-head-inline { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.toolbar-row, .filter-row { display: grid; grid-template-columns: minmax(0, 1fr) 140px auto; gap: 12px; }
.kb-list, .search-result-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow: auto; }
.kb-item, .search-item { border: none; width: 100%; padding: 16px; border-radius: 22px; text-align: left; display: flex; justify-content: space-between; gap: 12px; background: rgba(255, 255, 255, 0.88); cursor: pointer; transition: transform 0.24s ease, box-shadow 0.24s ease; }
.kb-item:hover, .search-item:hover { transform: translateY(-1px); box-shadow: 0 16px 32px rgba(15, 33, 58, 0.08); }
.kb-item.active { outline: 2px solid rgba(20, 184, 197, 0.24); background: linear-gradient(180deg, #ffffff, #eefafc); }
.kb-name, .search-title { color: #172033; font-size: 16px; font-weight: 700; }
.kb-meta, .search-subtitle, .input-help { margin-top: 6px; color: #7a879e; font-size: 13px; }
.kb-count { width: 44px; height: 44px; border-radius: 16px; display: grid; place-items: center; background: rgba(20, 184, 197, 0.12); color: #0f7f99; font-weight: 700; }
.create-btn { height: 48px; border: none; border-radius: 18px; background: linear-gradient(90deg, #0f8c9d, #14b8c5); }
.hero-panel { padding: 28px; display: grid; grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(160px, 220px)); gap: 18px; align-items: stretch; }
.hero-kicker { display: inline-flex; padding: 7px 12px; border-radius: 999px; color: #0f7f99; background: rgba(15, 127, 153, 0.1); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.hero-panel h1 { margin: 14px 0 10px; font-size: 34px; color: #172033; }
.hero-panel p { margin: 0; line-height: 1.8; color: #64738d; }
.hero-stats { display: contents; }
.stat-card { padding: 22px; border-radius: 24px; background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column; justify-content: center; gap: 10px; }
.stat-card strong { color: #172033; font-size: 22px; }
.stat-card span { color: #7b869b; font-size: 13px; }
.hero-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 12px; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr); gap: 18px; }
.content-card { padding: 22px; min-width: 0; }
.content-card h3 { margin: 0; color: #172033; font-size: 20px; }
.content-card p { margin: 8px 0 0; color: #7a879e; }
.content-card /deep/ .el-pagination { margin-top: 18px; text-align: right; }
.action-group { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.danger-text { color: #df5b5b; }
.placeholder-panel { min-height: calc(100vh - 48px); display: grid; place-content: center; text-align: center; padding: 32px; }
.placeholder-icon { width: 78px; height: 78px; margin: 0 auto 18px; border-radius: 26px; display: grid; place-items: center; background: linear-gradient(180deg, #dbfbff, #eff9ff); color: #0f7f99; font-size: 24px; font-weight: 800; }
.placeholder-panel h3 { margin: 0; color: #172033; }
.placeholder-panel p, .empty-block { color: #7a879e; line-height: 1.8; }
.dialog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.file-input { display: block; width: 100%; }
@media (max-width: 1280px) { .knowledge-page { grid-template-columns: 300px minmax(0, 1fr); } .hero-panel, .content-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .knowledge-page { grid-template-columns: 1fr; padding: 18px; } .kb-list-panel { min-height: auto; } .toolbar-row, .filter-row, .dialog-grid { grid-template-columns: 1fr; } .dialog-head-inline { flex-direction: column; } }
</style>
