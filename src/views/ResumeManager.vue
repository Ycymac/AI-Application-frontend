<template>
  <div class="resume-page">
    <section class="resume-list-panel glass-panel">
      <div class="panel-header">
        <div>
          <h2 class="section-title">简历管理</h2>
          <p class="section-subtitle">按创建时间倒序展示你的简历。</p>
        </div>
        <el-button icon="el-icon-refresh" circle @click="loadResumeNames"></el-button>
      </div>

      <div v-loading="loading" class="resume-list">
        <button
          v-for="item in resumeNames"
          :key="item.id"
          type="button"
          class="resume-list-item"
          :class="{ active: activeResumeId === item.id }"
          @click="selectResume(item.id)"
        >
          <div>
            <div class="resume-list-title">{{ item.formName }}</div>
            <div class="resume-list-date">{{ formatDate(item.createTime) }}</div>
          </div>
          <i class="el-icon-arrow-right"></i>
        </button>

        <div v-if="!loading && !resumeNames.length" class="empty-block">
          <p>当前还没有简历，点击底部按钮创建第一份。</p>
        </div>
      </div>

      <el-button class="create-btn" type="primary" @click="openCreateDialog">添加简历</el-button>
    </section>

    <section class="resume-detail-panel">
      <div v-if="detailLoading" class="detail-loading" v-loading="detailLoading"></div>

      <template v-else-if="activeResume">
        <div class="resume-hero glass-panel">
          <div class="resume-hero-top">
            <div>
              <div class="resume-form-name">{{ activeResume.formName }}</div>
              <h2>{{ activeResume.candidateName }}</h2>
              <p>{{ activeResume.jobIntention }}</p>
            </div>
            <div class="profile-icon">人</div>
          </div>
        </div>

        <div class="detail-grid">
          <article class="detail-card glass-panel">
            <h3>专业技能</h3>
            <div class="tag-group">
              <span v-for="skill in activeResume.professionalSkills" :key="skill" class="skill-tag">{{ skill }}</span>
            </div>
          </article>

          <article class="detail-card glass-panel">
            <h3>教育经历</h3>
            <div
              v-for="(item, index) in activeResume.educationExperiences"
              :key="`education-${index}`"
              class="timeline-item"
            >
              <div class="timeline-header">
                <strong>{{ item.schoolName }}</strong>
                <span>{{ item.startDate }} - {{ item.endDate }}</span>
              </div>
              <p>{{ item.major }} / {{ item.degree }}</p>
              <small>{{ item.highlights || '无补充说明' }}</small>
            </div>
          </article>

          <article class="detail-card glass-panel">
            <h3>工作经历</h3>
            <div
              v-for="(item, index) in activeResume.workExperiences"
              :key="`work-${index}`"
              class="timeline-item"
            >
              <div class="timeline-header">
                <strong>{{ item.companyName }}</strong>
                <span>{{ item.startDate }} - {{ item.endDate }}</span>
              </div>
              <p>{{ item.department || '未填写部门' }} / {{ item.position }}</p>
              <small>{{ item.workContent }}</small>
            </div>
            <div v-if="!activeResume.workExperiences.length" class="empty-line">当前没有工作经历</div>
          </article>

          <article class="detail-card glass-panel">
            <h3>项目经历</h3>
            <div
              v-for="(item, index) in activeResume.projectExperiences"
              :key="`project-${index}`"
              class="timeline-item"
            >
              <div class="timeline-header">
                <strong>{{ item.projectName }}</strong>
                <span>{{ item.projectRole }}</span>
              </div>
              <p>{{ item.projectDescription }}</p>
              <small>职责：{{ item.responsibility }}</small>
              <small>成果：{{ item.achievement }}</small>
            </div>
          </article>
        </div>

        <div class="detail-actions">
          <el-button type="primary" plain @click="openEditDialog">编辑简历</el-button>
          <el-popconfirm title="确认删除这份简历吗？" @confirm="removeResume">
            <el-button slot="reference" type="danger" plain>删除简历</el-button>
          </el-popconfirm>
        </div>
      </template>

      <div v-else class="detail-placeholder glass-panel">
        <h3>选择一份简历查看详情</h3>
        <p>左侧列表按创建时间倒序展示，新增后会自动刷新。</p>
      </div>
    </section>

    <el-dialog
      :title="dialogMode === 'create' ? '添加简历' : '编辑简历'"
      :visible.sync="dialogVisible"
      width="760px"
      top="5vh"
      @closed="resetForm"
    >
      <el-form ref="resumeForm" :model="resumeForm" :rules="resumeRules" label-position="top">
        <div class="form-grid">
          <el-form-item label="简历名称" prop="formName">
            <el-input v-model.trim="resumeForm.formName"></el-input>
          </el-form-item>
          <el-form-item label="候选人姓名" prop="candidateName">
            <el-input v-model.trim="resumeForm.candidateName"></el-input>
          </el-form-item>
          <el-form-item label="求职意向" prop="jobIntention">
            <el-input v-model.trim="resumeForm.jobIntention"></el-input>
          </el-form-item>
          <el-form-item label="专业技能" prop="professionalSkillsInput">
            <el-input
              v-model.trim="resumeForm.professionalSkillsInput"
              placeholder="多个技能使用中文逗号分隔"
            ></el-input>
          </el-form-item>
        </div>

        <div class="form-section">
          <h4>教育经历</h4>
          <div class="form-grid">
            <el-form-item label="学校名称" prop="educationSchoolName">
              <el-input v-model.trim="resumeForm.education.schoolName"></el-input>
            </el-form-item>
            <el-form-item label="专业" prop="educationMajor">
              <el-input v-model.trim="resumeForm.education.major"></el-input>
            </el-form-item>
            <el-form-item label="学历" prop="educationDegree">
              <el-input v-model.trim="resumeForm.education.degree"></el-input>
            </el-form-item>
            <el-form-item label="开始时间" prop="educationStartDate">
              <el-input v-model.trim="resumeForm.education.startDate" placeholder="如 2019-09"></el-input>
            </el-form-item>
            <el-form-item label="结束时间" prop="educationEndDate">
              <el-input v-model.trim="resumeForm.education.endDate" placeholder="如 2023-06"></el-input>
            </el-form-item>
            <el-form-item label="补充说明">
              <el-input v-model.trim="resumeForm.education.highlights"></el-input>
            </el-form-item>
          </div>
        </div>

        <div class="form-section">
          <h4>工作经历</h4>
          <div class="form-grid">
            <el-form-item label="公司名称">
              <el-input v-model.trim="resumeForm.work.companyName"></el-input>
            </el-form-item>
            <el-form-item label="部门">
              <el-input v-model.trim="resumeForm.work.department"></el-input>
            </el-form-item>
            <el-form-item label="岗位">
              <el-input v-model.trim="resumeForm.work.position"></el-input>
            </el-form-item>
            <el-form-item label="开始时间">
              <el-input v-model.trim="resumeForm.work.startDate" placeholder="如 2023-07"></el-input>
            </el-form-item>
            <el-form-item label="结束时间">
              <el-input v-model.trim="resumeForm.work.endDate" placeholder="如 至今"></el-input>
            </el-form-item>
            <el-form-item label="工作内容" class="grid-span-2">
              <el-input
                v-model.trim="resumeForm.work.workContent"
                type="textarea"
                :rows="3"
              ></el-input>
            </el-form-item>
          </div>
        </div>

        <div class="form-section">
          <h4>项目经历</h4>
          <div class="form-grid">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model.trim="resumeForm.project.projectName"></el-input>
            </el-form-item>
            <el-form-item label="项目角色" prop="projectRole">
              <el-input v-model.trim="resumeForm.project.projectRole"></el-input>
            </el-form-item>
            <el-form-item label="项目描述" prop="projectDescription" class="grid-span-2">
              <el-input
                v-model.trim="resumeForm.project.projectDescription"
                type="textarea"
                :rows="3"
              ></el-input>
            </el-form-item>
            <el-form-item label="职责描述" prop="responsibility" class="grid-span-2">
              <el-input
                v-model.trim="resumeForm.project.responsibility"
                type="textarea"
                :rows="3"
              ></el-input>
            </el-form-item>
            <el-form-item label="项目成果" prop="achievement" class="grid-span-2">
              <el-input
                v-model.trim="resumeForm.project.achievement"
                type="textarea"
                :rows="3"
              ></el-input>
            </el-form-item>
          </div>
        </div>
      </el-form>

      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResume">
          {{ dialogMode === 'create' ? '确认添加' : '保存修改' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  createResume,
  deleteResume,
  fetchResumeDetail,
  fetchResumeNames,
  updateResume
} from '@/services/api';

function createEmptyForm() {
  return {
    id: '',
    formName: '',
    candidateName: '',
    jobIntention: '',
    professionalSkillsInput: '',
    education: {
      schoolName: '',
      startDate: '',
      endDate: '',
      major: '',
      degree: '',
      highlights: ''
    },
    work: {
      companyName: '',
      startDate: '',
      endDate: '',
      department: '',
      position: '',
      workContent: ''
    },
    project: {
      projectName: '',
      projectRole: '',
      projectDescription: '',
      responsibility: '',
      achievement: ''
    }
  };
}

export default {
  name: 'ResumeManager',
  data() {
    return {
      loading: false,
      detailLoading: false,
      submitting: false,
      dialogVisible: false,
      dialogMode: 'create',
      resumeNames: [],
      activeResumeId: '',
      activeResume: null,
      resumeForm: createEmptyForm(),
      resumeRules: {
        formName: [{ required: true, message: '请输入简历名称', trigger: 'blur' }],
        candidateName: [{ required: true, message: '请输入候选人姓名', trigger: 'blur' }],
        jobIntention: [{ required: true, message: '请输入求职意向', trigger: 'blur' }],
        professionalSkillsInput: [{ required: true, message: '请输入至少一个技能', trigger: 'blur' }],
        educationSchoolName: [{ validator: (rule, value, callback) => this.checkEducation('schoolName', callback), trigger: 'blur' }],
        educationMajor: [{ validator: (rule, value, callback) => this.checkEducation('major', callback), trigger: 'blur' }],
        educationDegree: [{ validator: (rule, value, callback) => this.checkEducation('degree', callback), trigger: 'blur' }],
        educationStartDate: [{ validator: (rule, value, callback) => this.checkEducation('startDate', callback), trigger: 'blur' }],
        educationEndDate: [{ validator: (rule, value, callback) => this.checkEducation('endDate', callback), trigger: 'blur' }],
        projectName: [{ validator: (rule, value, callback) => this.checkProject('projectName', callback), trigger: 'blur' }],
        projectRole: [{ validator: (rule, value, callback) => this.checkProject('projectRole', callback), trigger: 'blur' }],
        projectDescription: [{ validator: (rule, value, callback) => this.checkProject('projectDescription', callback), trigger: 'blur' }],
        responsibility: [{ validator: (rule, value, callback) => this.checkProject('responsibility', callback), trigger: 'blur' }],
        achievement: [{ validator: (rule, value, callback) => this.checkProject('achievement', callback), trigger: 'blur' }]
      }
    };
  },
  created() {
    this.loadResumeNames();
  },
  methods: {
    async loadResumeNames() {
      this.loading = true;
      try {
        const result = await fetchResumeNames();
        this.resumeNames = (result.data || []).slice().sort((a, b) => {
          return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
        });
        if (this.resumeNames.length) {
          const targetId = this.resumeNames.some(item => item.id === this.activeResumeId)
            ? this.activeResumeId
            : this.resumeNames[0].id;
          this.selectResume(targetId);
        } else {
          this.activeResumeId = '';
          this.activeResume = null;
        }
      } catch (error) {
        this.$message.error(error.message || '获取简历列表失败');
      } finally {
        this.loading = false;
      }
    },
    async selectResume(id) {
      if (!id) {
        return;
      }
      this.activeResumeId = id;
      this.detailLoading = true;
      try {
        const result = await fetchResumeDetail(id);
        this.activeResume = result.data;
      } catch (error) {
        this.$message.error(error.message || '获取简历详情失败');
      } finally {
        this.detailLoading = false;
      }
    },
    formatDate(value) {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    },
    openCreateDialog() {
      this.dialogMode = 'create';
      this.dialogVisible = true;
      this.resumeForm = createEmptyForm();
    },
    openEditDialog() {
      if (!this.activeResume) {
        return;
      }
      const education = this.activeResume.educationExperiences[0] || {};
      const work = this.activeResume.workExperiences[0] || {};
      const project = this.activeResume.projectExperiences[0] || {};
      this.dialogMode = 'edit';
      this.resumeForm = {
        id: this.activeResume.id,
        formName: this.activeResume.formName,
        candidateName: this.activeResume.candidateName,
        jobIntention: this.activeResume.jobIntention,
        professionalSkillsInput: (this.activeResume.professionalSkills || []).join('，'),
        education: {
          schoolName: education.schoolName || '',
          startDate: education.startDate || '',
          endDate: education.endDate || '',
          major: education.major || '',
          degree: education.degree || '',
          highlights: education.highlights || ''
        },
        work: {
          companyName: work.companyName || '',
          startDate: work.startDate || '',
          endDate: work.endDate || '',
          department: work.department || '',
          position: work.position || '',
          workContent: work.workContent || ''
        },
        project: {
          projectName: project.projectName || '',
          projectRole: project.projectRole || '',
          projectDescription: project.projectDescription || '',
          responsibility: project.responsibility || '',
          achievement: project.achievement || ''
        }
      };
      this.dialogVisible = true;
    },
    resetForm() {
      this.resumeForm = createEmptyForm();
      if (this.$refs.resumeForm) {
        this.$refs.resumeForm.resetFields();
      }
    },
    checkEducation(field, callback) {
      if (!this.resumeForm.education[field]) {
        callback(new Error('教育经历必填'));
        return;
      }
      callback();
    },
    checkProject(field, callback) {
      if (!this.resumeForm.project[field]) {
        callback(new Error('项目经历必填'));
        return;
      }
      callback();
    },
    buildPayload() {
      const skills = this.resumeForm.professionalSkillsInput
        .split(/[,，]/)
        .map(item => item.trim())
        .filter(Boolean);

      const payload = {
        formName: this.resumeForm.formName,
        candidateName: this.resumeForm.candidateName,
        jobIntention: this.resumeForm.jobIntention,
        professionalSkills: skills,
        educationExperiences: [{ ...this.resumeForm.education }],
        workExperiences: this.resumeForm.work.companyName && this.resumeForm.work.position
          ? [{ ...this.resumeForm.work }]
          : [],
        projectExperiences: [{ ...this.resumeForm.project }]
      };

      if (this.dialogMode === 'edit') {
        payload.id = this.resumeForm.id;
      }

      return payload;
    },
    submitResume() {
      this.$refs.resumeForm.validate(async valid => {
        if (!valid) {
          return;
        }

        this.submitting = true;
        try {
          const payload = this.buildPayload();
          if (this.dialogMode === 'create') {
            const result = await createResume(payload);
            this.$message.success('简历已创建');
            this.dialogVisible = false;
            await this.loadResumeNames();
            if (result.data && result.data.id) {
              this.selectResume(result.data.id);
            }
          } else {
            await updateResume(payload);
            this.$message.success('简历已更新');
            this.dialogVisible = false;
            await this.loadResumeNames();
            this.selectResume(payload.id);
          }
        } catch (error) {
          this.$message.error(error.message || '保存失败');
        } finally {
          this.submitting = false;
        }
      });
    },
    async removeResume() {
      if (!this.activeResumeId) {
        return;
      }
      try {
        await deleteResume(this.activeResumeId);
        this.$message.success('简历已删除');
        this.activeResumeId = '';
        this.activeResume = null;
        this.loadResumeNames();
      } catch (error) {
        this.$message.error(error.message || '删除失败');
      }
    }
  }
};
</script>

<style scoped>
.resume-page {
  min-height: 100%;
  padding: 26px;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  color: var(--text-main);
}

.resume-list-panel {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 52px);
  padding: 24px 18px 18px;
  border-radius: var(--radius-xl);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.resume-list {
  flex: 1;
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resume-list-item {
  position: relative;
  width: 100%;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  cursor: pointer;
  text-align: left;
  transition: transform var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product), box-shadow var(--duration-normal) var(--ease-product);
}

.resume-list-item:hover {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-hover);
}

.resume-list-item.active {
  border-color: var(--accent-rose);
  background: var(--accent-rose-soft);
}

.resume-list-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
}

.resume-list-date {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.create-btn {
  margin-top: 18px;
  height: 48px;
  border-radius: var(--radius-lg);
}

.resume-detail-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.resume-hero {
  padding: 28px;
  border-radius: var(--radius-xl);
}

.resume-hero-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.resume-form-name {
  display: inline-block;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--accent-rose);
  background: var(--accent-rose-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 14px;
}

.resume-hero h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 34px;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.resume-hero p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-weight: 600;
}

.profile-icon {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  background: var(--accent-rose-soft);
  color: var(--accent-rose);
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 800;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.detail-card,
.detail-placeholder {
  padding: 22px;
  border-radius: var(--radius-lg);
}

.detail-card h3,
.detail-placeholder h3 {
  margin: 0 0 18px;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: var(--accent-lime-soft);
  color: var(--accent-lime);
  font-size: 13px;
  font-weight: 600;
}

.timeline-item + .timeline-item {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: var(--text-main);
}

.timeline-header span,
.timeline-item small {
  color: var(--text-tertiary);
}

.timeline-item p {
  margin: 8px 0 6px;
  color: var(--text-secondary);
}

.timeline-item small {
  display: block;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.detail-placeholder {
  min-height: 280px;
  display: grid;
  place-content: center;
  text-align: center;
}

.detail-placeholder p,
.empty-block p,
.empty-line {
  color: var(--text-secondary);
}

.detail-loading {
  min-height: 120px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-section h4 {
  margin: 8px 0 14px;
  color: var(--text-main);
}

.grid-span-2 {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .resume-page {
    grid-template-columns: 1fr;
  }

  .resume-list-panel {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .resume-page {
    padding: 18px;
  }

  .detail-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .grid-span-2 {
    grid-column: auto;
  }

  .resume-hero-top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
