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
  min-height: 100vh;
  padding: 26px;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
}

.resume-list-panel {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 52px);
  padding: 24px 18px 18px;
  border-radius: 28px;
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
  width: 100%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 16px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(17, 35, 63, 0.06);
  cursor: pointer;
  text-align: left;
}

.resume-list-item.active {
  outline: 2px solid rgba(20, 184, 197, 0.24);
  background: linear-gradient(180deg, #ffffff, #f0fbfc);
}

.resume-list-title {
  font-size: 17px;
  font-weight: 700;
  color: #172033;
}

.resume-list-date {
  margin-top: 6px;
  color: #95a1b8;
  font-size: 13px;
}

.create-btn {
  margin-top: 18px;
  height: 48px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(90deg, #0f8c9d, #14b8c5);
}

.resume-detail-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.resume-hero {
  padding: 28px;
  border-radius: 28px;
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
  border-radius: 999px;
  color: #0f7f99;
  background: rgba(20, 184, 197, 0.12);
  font-size: 13px;
  margin-bottom: 14px;
}

.resume-hero h2 {
  margin: 0;
  font-size: 34px;
}

.resume-hero p {
  margin: 10px 0 0;
  color: #3ab58c;
  font-weight: 700;
}

.profile-icon {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #eafcff, #d8f6f8);
  color: #0f7f99;
  font-size: 26px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.detail-card,
.detail-placeholder {
  padding: 22px;
  border-radius: 24px;
}

.detail-card h3,
.detail-placeholder h3 {
  margin: 0 0 18px;
  font-size: 18px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: #eefbf6;
  color: #34a873;
  font-size: 13px;
  font-weight: 600;
}

.timeline-item + .timeline-item {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(23, 32, 51, 0.08);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.timeline-header span,
.timeline-item small {
  color: #8c98b0;
}

.timeline-item p {
  margin: 8px 0 6px;
  color: #25314b;
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
  color: #7c8aa5;
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
