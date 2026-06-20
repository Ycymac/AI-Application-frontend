<template>
  <div class="interview-page">
    <section class="workspace-panel">
      <div class="hero-panel glass-panel">
        <div class="hero-copy">
          <span class="hero-kicker">AI Mock Interview</span>
          <h1>从简历出发，生成题目、完成追问、沉淀结构化报告。</h1>
          <p>
            依照简历定制化题目，结构化打分并生成报告
          </p>
        </div>

        <div class="hero-actions">
          <button class="hero-action primary" type="button" @click="openStartDialog">
            <span>新建面试</span>
            <small>先选简历，再生成题目</small>
          </button>
          <button class="hero-action secondary" type="button" @click="openStartDialog">
            <span>开始新面试</span>
            <small>支持逐题作答与实时整理</small>
          </button>
        </div>
      </div>

      <div v-if="questionGenerating" class="loading-shell glass-panel">
        <div class="beam-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <h3>正在生成面试题</h3>
          <p>agent 正在结合你选择的简历生成 15 道模拟题，请稍候。</p>
        </div>
      </div>

      <div v-else-if="evaluationGenerating" class="loading-shell glass-panel">
        <div class="beam-loader beam-loader-green">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <h3>正在生成评价</h3>
          <p>系统正在按题目、难度和回答进行逐题评价，完成后可一键生成报告。</p>
        </div>
      </div>

      <div v-else-if="reportBuilding" class="loading-shell glass-panel">
        <div class="beam-loader beam-loader-violet">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <h3>正在生成报告</h3>
          <p>系统正在汇总逐题评价、能力维度和核心知识点，稍后会返回结构化面试报告。</p>
        </div>
      </div>

      <template v-else-if="!isInterviewActive">
        <div v-if="activeReport" class="report-stack">
          <section class="report-top">
            <article class="score-card glass-panel">
              <div class="score-head">
                <div>
                  <div class="score-title">综合评价</div>
                  <div class="score-name">{{ activeReport.recordName }}</div>
                </div>
                <span class="score-date">{{ formatDateTime(activeReport.createTime) }}</span>
              </div>
              <div class="score-main">
                <strong>{{ activeReport.report.interviewPoint }}</strong>
                <span>分</span>
                <span class="grade-pill" :class="gradeClass(activeReport.report.interviewPoint)">
                  {{ gradeLabel(activeReport.report.interviewPoint) }}
                </span>
              </div>
            </article>

            <article class="radar-wrap glass-panel">
              <div class="block-title">能力雷达图</div>
              <InterviewRadarChart :metrics="activeReportMetrics" />
            </article>
          </section>

          <section class="report-middle">
            <article class="keywords-card glass-panel">
              <div class="block-title">核心知识点</div>
              <div class="chip-group">
                <span
                  v-for="(item, index) in activeReport.keywords"
                  :key="`${item}-${index}`"
                  class="skill-chip"
                >
                  {{ item }}
                </span>
                <span v-if="!activeReport.keywords.length" class="muted-text">暂无知识点标签</span>
              </div>
            </article>

            <article class="summary-card glass-panel">
              <div class="block-title">面试总结</div>
              <p>{{ activeReport.report.summaryReport || '暂无总结内容' }}</p>
            </article>
          </section>

          <section class="report-bottom">
            <article class="advice-card glass-panel">
              <div class="block-title">改进建议</div>
              <p>{{ activeReport.report.adviceReport || '暂无建议内容' }}</p>
            </article>

            <article class="process-card glass-panel">
              <div class="block-title">作答过程</div>
              <div class="process-list">
                <div
                  v-for="item in activeReport.evaluations"
                  :key="item.question.num"
                  class="process-item"
                >
                  <div class="question-meta">
                    <span class="question-num">Q{{ item.question.num }}</span>
                    <span class="difficulty-pill" :class="difficultyClass(item.question.level)">
                      {{ difficultyLabel(item.question.level) }}
                    </span>
                  </div>
                  <h4>{{ item.question.questionDescription }}</h4>
                  <div class="answer-block">
                    <label>作答</label>
                    <p>{{ item.answer || '未作答' }}</p>
                  </div>
                  <div class="answer-block">
                    <label>评价</label>
                    <p>{{ item.apiResp.comment || '暂无评价' }}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>

        <div v-else class="placeholder-panel glass-panel">
          <div class="placeholder-icon">AI</div>
          <h3>还没有可展示的面试报告</h3>
          <p>点击上方“新建面试”，选择简历后生成题目，完成作答即可沉淀结构化报告。</p>
        </div>
      </template>

      <div v-else class="placeholder-panel glass-panel focus-panel">
        <div class="placeholder-icon">IN</div>
        <h3>正在进行模拟面试</h3>
        <p>当前已进入专注模式，历史报告与面试记录已隐藏。请在弹窗中继续完成作答与提交。</p>
      </div>
    </section>

    <aside v-if="!isInterviewActive" class="records-panel glass-panel">
      <div class="records-head">
        <div>
          <h2 class="section-title">面试记录</h2>
          <p class="section-subtitle">按时间倒序显示，点击名称即可查看报告。</p>
        </div>
        <el-button icon="el-icon-refresh" circle @click="loadInterviewRecords"></el-button>
      </div>

      <div v-loading="recordsLoading" class="records-list">
        <button
          v-for="item in interviewRecords"
          :key="item.id"
          type="button"
          class="record-item"
          :class="{ active: activeRecordId === item.id }"
          @click="openRecord(item)"
        >
          <div>
            <div class="record-name">{{ item.name }}</div>
            <div class="record-date">{{ formatDateTime(item.createTime) }}</div>
            <span
              v-if="item.interviewPoint !== null && item.interviewPoint !== undefined && item.interviewPoint !== ''"
              class="record-grade"
              :class="gradeClass(item.interviewPoint)"
            >
              {{ gradeLabel(item.interviewPoint) }}
            </span>
          </div>
          <div class="record-score">{{ item.interviewPoint || '--' }}</div>
        </button>

        <div v-if="!recordsLoading && !interviewRecords.length" class="empty-state">
          暂无历史记录，生成第一份模拟面试报告后会在这里显示。
        </div>
      </div>
    </aside>

    <el-dialog
      title="选择简历"
      :visible.sync="startDialogVisible"
      width="560px"
      append-to-body
    >
      <div class="selector-list">
        <button
          v-for="item in resumeOptions"
          :key="item.id"
          type="button"
          class="selector-item"
          :class="{ active: selectedResumeId === item.id }"
          @click="selectedResumeId = item.id"
        >
          <div class="selector-name">{{ item.formName }}</div>
          <div class="selector-time">{{ formatDateTime(item.createTime) }}</div>
        </button>
        <div v-if="!resumeOptions.length" class="empty-state">
          当前还没有简历，请先到简历管理页创建简历。
        </div>
      </div>
      <span slot="footer">
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedResumeId" @click="startInterview">
          生成题目
        </el-button>
      </span>
    </el-dialog>

    <el-dialog
      custom-class="interview-dialog"
      :visible.sync="questionDialogVisible"
      width="1040px"
      append-to-body
      :close-on-click-modal="false"
      :show-close="!reportBuilding"
    >
      <div slot="title" class="dialog-title">
        <div>
          <div class="dialog-kicker">模拟面试</div>
          <div class="dialog-heading">{{ sessionResumeName || '当前面试' }}</div>
        </div>
      </div>

      <div v-if="sessionStage === 'questions'" class="session-body">
        <transition :name="questionTransitionName" mode="out-in">
          <div :key="activeQuestion.question.num" class="question-card">
            <div class="question-meta">
              <span class="question-num">Q{{ activeQuestion.question.num }}</span>
              <span class="difficulty-pill" :class="difficultyClass(activeQuestion.question.level)">
                {{ difficultyLabel(activeQuestion.question.level) }}
              </span>
            </div>
            <h3>{{ activeQuestion.question.questionDescription }}</h3>
            <div class="answer-panel">
              <label>你的回答</label>
              <el-input
                v-model.trim="activeQuestion.answer"
                type="textarea"
                :rows="9"
                maxlength="500"
                show-word-limit
                resize="none"
                placeholder="请在 500 字内完成回答"
              ></el-input>
            </div>
          </div>
        </transition>

        <div class="dialog-footer-bar">
          <el-button
            class="nav-btn"
            :disabled="activeQuestionIndex === 0"
            @click="switchQuestion('prev')"
          >
            上一题
          </el-button>
          <el-button
            class="nav-btn"
            type="primary"
            @click="activeQuestionIndex === questionDrafts.length - 1 ? submitAnswers() : switchQuestion('next')"
          >
            {{ activeQuestionIndex === questionDrafts.length - 1 ? '提交作答' : '下一题' }}
          </el-button>
        </div>
      </div>

      <div v-else-if="sessionStage === 'evaluations'" class="session-body">
        <div class="evaluation-list">
          <div
            v-for="item in evaluationList"
            :key="item.question.num"
            class="evaluation-item"
          >
            <div class="question-meta">
              <span class="question-num">Q{{ item.question.num }}</span>
              <span class="difficulty-pill" :class="difficultyClass(item.question.level)">
                {{ difficultyLabel(item.question.level) }}
              </span>
            </div>
            <h3>{{ item.question.questionDescription }}</h3>
            <div class="answer-block">
              <label>回答</label>
              <p>{{ item.answer }}</p>
            </div>
            <div class="answer-block">
              <label>评价</label>
              <p>{{ item.apiResp.comment }}</p>
            </div>
          </div>
        </div>

        <div class="dialog-footer-bar align-right">
          <el-button type="primary" :loading="reportBuilding" @click="buildReport">
            生成报告
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import InterviewRadarChart from '@/components/InterviewRadarChart.vue';
import {
  evaluateInterviewAnswers,
  fetchInterviewRecords,
  fetchInterviewReport,
  fetchResumeNames,
  generateInterviewQuestions,
  generateInterviewReport
} from '@/services/api';

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function createQuestionDraft(question) {
  return {
    question: {
      num: question.num,
      level: question.level,
      questionDescription: question.questionDescription
    },
    answer: ''
  };
}

export default {
  name: 'InterviewCenter',
  components: {
    InterviewRadarChart
  },
  data() {
    return {
      resumeOptions: [],
      selectedResumeId: '',
      startDialogVisible: false,
      questionDialogVisible: false,
      questionGenerating: false,
      evaluationGenerating: false,
      reportBuilding: false,
      recordsLoading: false,
      sessionStage: 'questions',
      sessionResumeName: '',
      questionDrafts: [],
      activeQuestionIndex: 0,
      questionDirection: 'next',
      evaluationList: [],
      interviewRecords: [],
      activeRecordId: '',
      activeReport: null
    };
  },
  computed: {
    isInterviewActive() {
      return this.questionDialogVisible || this.questionGenerating || this.evaluationGenerating || this.reportBuilding;
    },
    activeQuestion() {
      return this.questionDrafts[this.activeQuestionIndex] || {
        question: {
          num: 1,
          level: 0,
          questionDescription: ''
        },
        answer: ''
      };
    },
    questionTransitionName() {
      return this.questionDirection === 'next' ? 'question-slide-next' : 'question-slide-prev';
    },
    activeReportMetrics() {
      if (!this.activeReport) {
        return [];
      }
      const report = this.activeReport.report || {};
      return [
        { name: '准确性', score: report.accuracyScore || 0 },
        { name: '完整性', score: report.completenessScore || 0 },
        { name: '表达能力', score: report.expressionAbilityScore || 0 },
        { name: '逻辑能力', score: report.logicScore || 0 },
        { name: '详细程度', score: report.levelOfDetailScore || 0 }
      ];
    }
  },
  created() {
    this.loadResumeOptions();
    this.loadInterviewRecords();
  },
  methods: {
    async loadResumeOptions() {
      try {
        const result = await fetchResumeNames();
        this.resumeOptions = (result.data || []).slice().sort((a, b) => {
          return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
        });
        if (!this.selectedResumeId && this.resumeOptions.length) {
          this.selectedResumeId = this.resumeOptions[0].id;
        }
      } catch (error) {
        this.$message.error(error.message || '获取简历列表失败');
      }
    },
    async loadInterviewRecords() {
      this.recordsLoading = true;
      try {
        const result = await fetchInterviewRecords();
        this.interviewRecords = (result.data || []).slice().sort((a, b) => {
          return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
        });

        if (!this.activeRecordId && this.interviewRecords.length) {
          this.openRecord(this.interviewRecords[0]);
        }
      } catch (error) {
        this.$message.error(error.message || '获取面试记录失败');
      } finally {
        this.recordsLoading = false;
      }
    },
    openStartDialog() {
      if (!this.resumeOptions.length) {
        this.$message.warning('请先创建简历，再开始模拟面试');
        return;
      }
      this.startDialogVisible = true;
    },
    async startInterview() {
      if (!this.selectedResumeId) {
        this.$message.warning('请先选择一份简历');
        return;
      }

      const currentResume = this.resumeOptions.find(item => item.id === this.selectedResumeId);
      this.startDialogVisible = false;
      this.questionGenerating = true;
      this.activeQuestionIndex = 0;
      this.evaluationList = [];
      this.activeRecordId = '';

      try {
        const result = await generateInterviewQuestions({ formId: this.selectedResumeId });
        const questions = (result.data && result.data.questions) || [];
        this.questionDrafts = questions.map(createQuestionDraft);
        this.sessionResumeName = currentResume ? currentResume.formName : '模拟面试';
        this.sessionStage = 'questions';
        this.questionDialogVisible = true;
      } catch (error) {
        this.$message.error(error.message || '题目生成失败');
      } finally {
        this.questionGenerating = false;
      }
    },
    switchQuestion(direction) {
      if (direction === 'next' && this.activeQuestionIndex < this.questionDrafts.length - 1) {
        this.questionDirection = 'next';
        this.activeQuestionIndex += 1;
      }
      if (direction === 'prev' && this.activeQuestionIndex > 0) {
        this.questionDirection = 'prev';
        this.activeQuestionIndex -= 1;
      }
    },
    async submitAnswers() {
      const unfilled = this.questionDrafts.filter(item => !item.answer);
      if (unfilled.length) {
        this.$message.warning(`还有 ${unfilled.length} 题未作答，请补充后再提交`);
        return;
      }

      this.questionDialogVisible = false;
      this.evaluationGenerating = true;
      try {
        const result = await evaluateInterviewAnswers({
          questionWithAnswers: this.questionDrafts
        });
        this.evaluationList = (result.data || []).map(item => ({
          question: item.question || {},
          answer: item.answer || '',
          apiResp: item.apiResp || {}
        }));
        this.sessionStage = 'evaluations';
        this.questionDialogVisible = true;
      } catch (error) {
        this.$message.error(error.message || '生成评价失败');
      } finally {
        this.evaluationGenerating = false;
      }
    },
    async buildReport() {
      this.reportBuilding = true;
      try {
        const result = await generateInterviewReport({
          formId: this.selectedResumeId,
          answerEvaluationRespS: this.evaluationList
        });
        const reportData = result.data || {};
        this.activeReport = this.composeLiveReport(reportData);
        this.activeRecordId = '';
        this.questionDialogVisible = false;
        this.$message.success('报告已生成');
        await this.loadInterviewRecords();
      } catch (error) {
        this.$message.error(error.message || '生成报告失败');
      } finally {
        this.reportBuilding = false;
      }
    },
    composeLiveReport(payload) {
      const reportDTO = payload.reportDTO || {};
      const resume = this.resumeOptions.find(item => item.id === this.selectedResumeId);
      return {
        id: '',
        recordName: payload.recordName || `${resume ? resume.formName : '模拟面试'} 报告`,
        createTime: payload.date || new Date(),
        keywords: (resume && resume.professionalSkills) || [],
        evaluations: this.evaluationList,
        report: {
          interviewPoint: reportDTO.interviewPoint || 0,
          accuracyScore: reportDTO.accuracyScore || 0,
          completenessScore: reportDTO.completenessScore || 0,
          levelOfDetailScore: reportDTO.levelOfDetailScore || 0,
          logicScore: reportDTO.logicScore || 0,
          expressionAbilityScore: reportDTO.expressionAbilityScore || 0,
          summaryReport: reportDTO.summaryReport || '',
          adviceReport: reportDTO.adviceReport || ''
        }
      };
    },
    async openRecord(record) {
      if (!record || !record.id) {
        return;
      }
      try {
        const result = await fetchInterviewReport(record.id);
        this.activeReport = this.normalizeRecordDetail(result.data || {});
        this.activeRecordId = record.id;
      } catch (error) {
        this.$message.error(error.message || '获取记录详情失败');
      }
    },
    normalizeRecordDetail(detail) {
      const evaluations = safeJsonParse(detail.interviewProcessRecord, []) || [];
      const keywords = safeJsonParse(detail.interviewKeywords, []) || [];
      const summaryReport = safeJsonParse(detail.summaryReportRecord, '');
      const adviceReport = safeJsonParse(detail.adviceReportRecord, '');
      return {
        id: detail.id,
        recordName: detail.recordName,
        createTime: detail.createTime,
        keywords,
        evaluations,
        report: {
          interviewPoint: detail.interviewPoint || 0,
          accuracyScore: detail.accuracyScore || 0,
          completenessScore: detail.completenessScore || 0,
          levelOfDetailScore: detail.levelOfDetailScore || 0,
          logicScore: detail.logicScore || 0,
          expressionAbilityScore: detail.expressionAbilityScore || 0,
          summaryReport,
          adviceReport
        }
      };
    },
    difficultyLabel(level) {
      const map = {
        0: '简单',
        1: '中等',
        2: '困难'
      };
      return map[level] || '未定义';
    },
    difficultyClass(level) {
      const map = {
        0: 'is-easy',
        1: 'is-medium',
        2: 'is-hard'
      };
      return map[level] || 'is-medium';
    },
    gradeLabel(score) {
      const value = Number(score);
      if (Number.isNaN(value)) {
        return '未评定';
      }
      if (value >= 90) {
        return '优秀';
      }
      if (value >= 80) {
        return '良好';
      }
      if (value >= 70) {
        return '中等';
      }
      if (value >= 60) {
        return '及格';
      }
      return '不及格';
    },
    gradeClass(score) {
      const value = Number(score);
      if (Number.isNaN(value)) {
        return 'grade-na';
      }
      if (value >= 90) {
        return 'grade-excellent';
      }
      if (value >= 80) {
        return 'grade-good';
      }
      if (value >= 70) {
        return 'grade-medium';
      }
      if (value >= 60) {
        return 'grade-pass';
      }
      return 'grade-fail';
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
.interview-page {
  height: 100vh;
  padding: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) 288px;
  gap: 22px;
  overflow: hidden;
}

.workspace-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 8px;
}

.hero-panel {
  padding: 28px;
  border-radius: var(--radius-xl);
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.9fr);
  gap: 24px;
}

.hero-kicker,
.dialog-kicker {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: var(--accent-violet-soft);
  color: var(--accent-violet);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}

.hero-copy h1 {
  margin: 16px 0 12px;
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--text-main);
}

.hero-copy p {
  margin: 0;
  max-width: 680px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-actions {
  display: grid;
  gap: 14px;
}

.hero-action {
  position: relative;
  min-height: 128px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--surface-strong);
  padding: 22px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--duration-normal) var(--ease-product), box-shadow var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product);
}

.hero-action:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-hover);
}

.hero-action span {
  position: relative;
  z-index: 1;
  display: block;
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.hero-action small {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-action.primary { border-left: 3px solid var(--accent-violet); }
.hero-action.secondary { border-left: 3px solid var(--accent-cyan); }

.loading-shell,
.placeholder-panel,
.records-panel,
.score-card,
.radar-wrap,
.keywords-card,
.summary-card,
.advice-card,
.process-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
}

.loading-shell,
.placeholder-panel {
  padding: 34px 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.loading-shell h3,
.placeholder-panel h3,
.block-title,
.dialog-heading {
  margin: 0;
  color: var(--text-main);
}

.loading-shell p,
.placeholder-panel p {
  margin: 10px 0 0;
  color: var(--text-secondary);
}

.beam-loader {
  width: 112px;
  display: grid;
  gap: 10px;
}

.beam-loader span {
  display: block;
  height: 10px;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  background-size: 220% 100%;
  animation: beamMove 1.3s linear infinite;
}

.beam-loader span:nth-child(2) {
  animation-delay: 0.14s;
}

.beam-loader span:nth-child(3) {
  animation-delay: 0.28s;
}

.beam-loader-green span {
  background: linear-gradient(90deg, transparent, var(--accent-lime), transparent);
  background-size: 220% 100%;
}

.beam-loader-violet span {
  background: linear-gradient(90deg, transparent, var(--accent-violet), transparent);
  background-size: 220% 100%;
}

.placeholder-panel {
  min-height: 280px;
  justify-content: center;
  text-align: center;
  flex-direction: column;
}

.focus-panel {
  min-height: 360px;
}

.placeholder-icon {
  width: 74px;
  height: 74px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.records-panel {
  padding: 22px 18px 18px;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.records-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.records-list {
  flex: 1;
  min-height: 0;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.record-item,
.selector-item {
  width: 100%;
  border: 1px solid var(--line);
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
  transition: transform var(--duration-normal) var(--ease-product), box-shadow var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product);
  min-width: 0;
}

.record-item:hover,
.selector-item:hover {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-hover);
}

.record-item.active,
.selector-item.active {
  border-color: var(--accent-violet);
  background: var(--accent-violet-soft);
}

.record-name,
.selector-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-main);
  font-weight: 700;
}

.record-date,
.selector-time,
.score-date {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.record-score {
  flex: 0 0 44px;
  min-width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  background: var(--accent-violet-soft);
  color: var(--accent-violet);
  font-weight: 700;
}

.empty-state,
.muted-text {
  color: var(--text-tertiary);
  line-height: 1.8;
}

.report-stack,
.report-middle,
.report-bottom,
.report-top {
  display: grid;
  gap: 18px;
}

.workspace-panel::-webkit-scrollbar,
.records-list::-webkit-scrollbar,
.selector-list::-webkit-scrollbar {
  width: 10px;
}

.workspace-panel::-webkit-scrollbar-track,
.records-list::-webkit-scrollbar-track,
.selector-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: var(--radius-pill);
}

.workspace-panel::-webkit-scrollbar-thumb,
.records-list::-webkit-scrollbar-thumb,
.selector-list::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: var(--radius-pill);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.report-top {
  grid-template-columns: minmax(320px, 0.88fr) minmax(360px, 1.12fr);
}

.score-card,
.radar-wrap,
.keywords-card,
.summary-card,
.advice-card,
.process-card {
  padding: 24px;
}

.score-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.score-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-lime);
}

.score-name {
  margin-top: 10px;
  color: var(--text-main);
  font-size: 16px;
}

.score-main {
  margin-top: 22px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.score-main strong {
  font-family: var(--font-display);
  font-size: 60px;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--text-main);
}

.score-main span {
  padding-bottom: 8px;
  color: var(--text-tertiary);
  font-size: 18px;
}

.grade-pill {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  align-self: center;
}

.record-grade {
  display: inline-flex;
  margin-top: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
}

.grade-excellent { color: var(--accent-lime); background: var(--accent-lime-soft); }
.grade-good { color: var(--accent-cyan); background: var(--accent-cyan-soft); }
.grade-medium { color: var(--accent-violet); background: var(--accent-violet-soft); }
.grade-pass { color: var(--accent-orange); background: var(--accent-orange-soft); }
.grade-fail { color: var(--accent-rose); background: var(--accent-rose-soft); }
.grade-na { color: var(--text-tertiary); background: var(--surface-muted); }

.block-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.report-middle {
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
}

.chip-group {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-chip {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--accent-lime-soft);
  color: var(--accent-lime);
  font-weight: 600;
}

.summary-card p,
.advice-card p {
  margin: 18px 0 0;
  color: var(--text-secondary);
  line-height: 1.9;
}

.process-list,
.evaluation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.process-item,
.evaluation-item,
.question-card {
  padding: 22px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  border: 1px solid var(--line);
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  background: var(--accent-cyan-soft);
  color: var(--accent-cyan);
  font-family: var(--font-mono);
  font-weight: 700;
}

.difficulty-pill {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  height: 32px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.is-easy {
  color: var(--accent-lime);
  background: var(--accent-lime-soft);
}

.is-medium {
  color: var(--accent-orange);
  background: var(--accent-orange-soft);
}

.is-hard {
  color: var(--accent-rose);
  background: var(--accent-rose-soft);
}

.process-item h4,
.evaluation-item h3,
.question-card h3 {
  margin: 16px 0 0;
  line-height: 1.65;
  color: var(--text-main);
}

.answer-block,
.answer-panel {
  margin-top: 18px;
}

.answer-block label,
.answer-panel label {
  display: inline-block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.answer-block p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.85;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow: auto;
}

.dialog-title {
  display: flex;
  align-items: center;
}

.dialog-heading {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.session-body {
  padding-top: 4px;
}

.dialog-footer-bar {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-footer-bar.align-right {
  justify-content: flex-end;
}

.nav-btn {
  min-width: 128px;
  border-radius: var(--radius-md);
}

.interview-page /deep/ .interview-dialog {
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.interview-page /deep/ .interview-dialog .el-dialog__header {
  padding: 22px 24px 10px;
}

.interview-page /deep/ .interview-dialog .el-dialog__body {
  padding: 14px 24px 24px;
}

.interview-page /deep/ .el-textarea__inner {
  border-radius: var(--radius-md);
  min-height: 260px;
  padding: 16px 18px;
}

.question-slide-next-enter-active,
.question-slide-next-leave-active,
.question-slide-prev-enter-active,
.question-slide-prev-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.question-slide-next-enter,
.question-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(36px);
}

.question-slide-next-leave-to,
.question-slide-prev-enter {
  opacity: 0;
  transform: translateX(-36px);
}

@keyframes beamMove {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (max-width: 1280px) {
  .interview-page {
    grid-template-columns: minmax(0, 1fr) 260px;
  }

  .records-panel {
    height: calc(100vh - 48px);
  }
}

@media (max-width: 900px) {
  .interview-page {
    height: auto;
    min-height: 100vh;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .hero-panel,
  .report-top,
  .report-middle {
    grid-template-columns: 1fr;
  }

  .records-panel {
    min-height: auto;
    height: auto;
    overflow: visible;
  }

  .workspace-panel,
  .records-list {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .interview-page {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .dialog-footer-bar {
    gap: 12px;
  }

  .nav-btn {
    flex: 1;
    min-width: 0;
  }
}
</style>
