<template>
  <div class="project-intro-page">
    <section class="intro-hero product-card reveal-card">
      <div class="hero-copy">
        <p class="mono-label hero-kicker">AI INTERVIEW × RAG SYSTEM</p>
        <h1>用知识库驱动的 AI 面试训练工作台。</h1>
        <p class="hero-desc">
          系统围绕简历、知识库、RAG 检索与大模型评判构建完整面试训练流程，帮助候选人生成题目、组织回答并获得结构化反馈。
        </p>
        <div class="hero-actions">
          <el-button type="primary" @click="go('/app/interviews')">开始模拟面试</el-button>
          <el-button plain @click="go('/app/knowledge-bases')">管理 RAG 知识库</el-button>
          <el-button plain @click="go('/app/knowledge-chat')">体验知识库问答</el-button>
        </div>
      </div>

      <div class="hero-visual" aria-label="AI 与 RAG 流程视觉示意">
        <div class="signal-grid">
          <span v-for="item in 25" :key="item"></span>
        </div>
        <div class="orbital-card main-node">
          <span class="node-tag">RAG</span>
          <strong>AI Interview OS</strong>
          <small>Retrieve · Generate · Evaluate</small>
        </div>
        <div class="float-chip chip-cyan">Vector Search</div>
        <div class="float-chip chip-violet">LLM Judge</div>
        <div class="float-chip chip-lime">Score +{{ sampleScore }}</div>
      </div>
    </section>

    <section class="capability-grid">
      <article
        v-for="item in capabilities"
        :key="item.title"
        class="capability-card product-card reveal-card"
        :class="item.tone"
        @click="go(item.to)"
      >
        <span class="capability-icon">{{ item.icon }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
        <span class="capability-link">进入模块 →</span>
      </article>
    </section>

    <section class="flow-section product-card reveal-card">
      <div class="section-headline">
        <p class="mono-label">RAG PIPELINE</p>
        <h2>从文档到可追溯回答的知识流。</h2>
      </div>
      <ol class="rag-flow">
        <li v-for="(step, index) in ragSteps" :key="step.title" :class="step.tone">
          <span class="flow-index">0{{ index + 1 }}</span>
          <strong>{{ step.title }}</strong>
          <p>{{ step.desc }}</p>
        </li>
      </ol>
    </section>

    <section class="lab-grid">
      <article class="lab-card product-card reveal-card">
        <p class="mono-label">JAVASCRIPT EXPRESSION</p>
        <h2>能力模型圆形计算</h2>
        <p class="lab-desc">将候选人的综合能力抽象为半径模型，使用 JavaScript 变量、表达式和运算符计算面积与周长。</p>
        <div class="lab-control">
          <span>模型半径</span>
          <el-input-number v-model="radius" :min="1" :max="20" :step="1"></el-input-number>
        </div>
        <div class="metric-row">
          <div>
            <span>面积</span>
            <strong>{{ circleArea }}</strong>
          </div>
          <div>
            <span>周长</span>
            <strong>{{ circlePerimeter }}</strong>
          </div>
        </div>
      </article>

      <article class="lab-card product-card reveal-card">
        <p class="mono-label">BRANCH LOGIC</p>
        <h2>面试评分等级</h2>
        <p class="lab-desc">根据 AI 评判分数进入不同考评区间，展示 JavaScript 分支结构在面试评估中的实际应用。该等级会同步显示在「模拟面试」的评分卡与面试记录中。</p>
        <div class="lab-control">
          <span>模拟分数</span>
          <el-input-number v-model="sampleScore" :min="0" :max="100" :step="1"></el-input-number>
        </div>
        <div class="grade-card" :class="gradeTone">
          <span>考评等级</span>
          <strong>{{ evaluationLevel }}</strong>
          <p>{{ evaluationText }}</p>
        </div>
      </article>
    </section>

    <section class="matrix-section product-card reveal-card">
      <div class="section-headline">
        <p class="mono-label">MODULE MATRIX</p>
        <h2>系统功能模块一览</h2>
      </div>
      <el-table :data="moduleRows" stripe>
        <el-table-column prop="module" label="模块" width="150"></el-table-column>
        <el-table-column prop="ability" label="核心能力"></el-table-column>
        <el-table-column prop="data" label="数据对象"></el-table-column>
        <el-table-column label="入口" width="120">
          <template slot-scope="{ row }">
            <el-button type="text" @click="go(row.to)">进入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="resource-section product-card reveal-card">
      <div class="section-headline">
        <p class="mono-label">LEARNING LINKS</p>
        <h2>技术资源导航</h2>
      </div>
      <ul class="resource-list">
        <li v-for="resource in resources" :key="resource.href">
          <a :href="resource.href" target="_blank" rel="noopener noreferrer">
            <span>{{ resource.name }}</span>
            <small>{{ resource.desc }}</small>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ProjectIntro',
  data() {
    return {
      radius: 5,
      sampleScore: 86,
      capabilities: [
        { title: 'AI 面试中心', icon: 'AI', tone: 'tone-violet', desc: '根据简历和知识库生成个性化面试题，并组织作答流程。', to: '/app/interviews' },
        { title: 'RAG 知识库', icon: 'KG', tone: 'tone-cyan', desc: '管理知识库、文档、Chunk、向量重建与检索状态。', to: '/app/knowledge-bases' },
        { title: '知识库问答', icon: 'QA', tone: 'tone-lime', desc: '通过流式问答体验知识检索、生成与上下文引用。', to: '/app/knowledge-chat' },
        { title: '简历管理', icon: 'CV', tone: 'tone-rose', desc: '维护候选人经历、技能与项目，为面试生成提供上下文。', to: '/app/resumes' }
      ],
      ragSteps: [
        { title: '文档上传', desc: '收集简历、课程资料、项目文档。', tone: 'tone-rose' },
        { title: '文本分块', desc: '将长文档切分为可检索知识片段。', tone: 'tone-orange' },
        { title: '向量化', desc: '使用 embedding model 建立语义索引。', tone: 'tone-violet' },
        { title: '知识检索', desc: '根据问题召回相关 Chunk 与上下文。', tone: 'tone-cyan' },
        { title: '生成评判', desc: '生成题目、回答和结构化评分建议。', tone: 'tone-lime' }
      ],
      moduleRows: [
        { module: '模拟面试', ability: '题目生成、回答收集、AI 评价、报告构建', data: '简历 / 题目 / 面试记录', to: '/app/interviews' },
        { module: '知识库管理', ability: 'CRUD、文档上传、分块、启停、日志、搜索', data: '知识库 / 文档 / Chunk', to: '/app/knowledge-bases' },
        { module: '知识库问答', ability: 'RAG 对话、流式输出、深度思考、停止生成', data: '会话 / 消息 / 检索结果', to: '/app/knowledge-chat' },
        { module: '简历管理', ability: '新增、编辑、删除、详情维护', data: '候选人简历', to: '/app/resumes' }
      ],
      resources: [
        { name: 'Vue 2 Documentation', desc: '组件、路由和响应式基础', href: 'https://v2.vuejs.org/' },
        { name: 'Element UI', desc: '表格、表单、弹窗组件', href: 'https://element.eleme.io/' },
        { name: 'MDN JavaScript', desc: '变量、函数、分支与 DOM 基础', href: 'https://developer.mozilla.org/docs/Web/JavaScript' },
        { name: 'RAG Overview', desc: '检索增强生成技术概览', href: 'https://www.promptingguide.ai/research/rag' },
        { name: 'Spring Framework', desc: '后端服务与接口基础', href: 'https://spring.io/projects/spring-framework' }
      ]
    };
  },
  computed: {
    circleArea() {
      return (Math.PI * this.radius * this.radius).toFixed(2);
    },
    circlePerimeter() {
      return (2 * Math.PI * this.radius).toFixed(2);
    },
    evaluationLevel() {
      if (this.sampleScore >= 90) {
        return '优秀';
      }
      if (this.sampleScore >= 80) {
        return '良好';
      }
      if (this.sampleScore >= 70) {
        return '中等';
      }
      if (this.sampleScore >= 60) {
        return '及格';
      }
      return '不及格';
    },
    gradeTone() {
      if (this.sampleScore >= 90) {
        return 'grade-excellent';
      }
      if (this.sampleScore >= 80) {
        return 'grade-good';
      }
      if (this.sampleScore >= 70) {
        return 'grade-medium';
      }
      if (this.sampleScore >= 60) {
        return 'grade-pass';
      }
      return 'grade-fail';
    },
    evaluationText() {
      const map = {
        优秀: '回答结构清晰，技术深度与表达质量都很突出。',
        良好: '核心知识掌握较好，项目表达完整，可以继续打磨细节。',
        中等: '具备基础理解，建议补充场景化说明和知识链路。',
        及格: '达到基本要求，但需要加强关键概念与表达逻辑。',
        不及格: '当前回答风险较高，建议回到知识库进行系统复习。'
      };
      return map[this.evaluationLevel];
    }
  },
  methods: {
    go(path) {
      this.$router.push(path);
    }
  }
};
</script>

<style scoped>
.project-intro-page {
  min-height: 100%;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  color: var(--text-main);
}

.reveal-card {
  animation: riseIn 680ms var(--ease-product) both;
}

.intro-hero {
  min-height: 460px;
  padding: clamp(28px, 5vw, 56px);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 32px;
  align-items: center;
  overflow: hidden;
}

.hero-kicker { color: var(--accent-violet); }
.flow-section .mono-label { color: var(--accent-cyan); }
.matrix-section .mono-label { color: var(--accent-orange); }
.resource-section .mono-label { color: var(--accent-rose); }
.lab-card:nth-child(1) .mono-label { color: var(--accent-lime); }
.lab-card:nth-child(2) .mono-label { color: var(--accent-orange); }

.hero-copy h1 {
  max-width: 820px;
  margin: 16px 0;
  font-family: var(--font-display);
  font-size: clamp(42px, 7vw, 86px);
  line-height: 0.96;
  letter-spacing: -0.055em;
  color: var(--text-main);
}

.hero-desc {
  max-width: 680px;
  margin: 0;
  font-size: 17px;
  line-height: 1.9;
  color: var(--text-secondary);
}

.hero-actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-visual {
  position: relative;
  min-height: 360px;
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, var(--surface-muted), transparent),
    var(--surface-strong);
  border: 1px solid var(--line);
  overflow: hidden;
}

.signal-grid {
  position: absolute;
  inset: 24px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  opacity: 0.55;
}

.signal-grid span {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  animation: signalPulse 3.6s var(--ease-product) infinite;
}

.signal-grid span:nth-child(5n + 1) { animation-delay: 0.1s; }
.signal-grid span:nth-child(5n + 2) { animation-delay: 0.35s; }
.signal-grid span:nth-child(5n + 3) { animation-delay: 0.6s; }
.signal-grid span:nth-child(5n + 4) { animation-delay: 0.85s; }

.orbital-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(280px, calc(100% - 48px));
  padding: 24px;
  border-radius: var(--radius-xl);
  transform: translate(-50%, -50%);
  background: rgba(var(--bg-page-rgb), 0.92);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-hover);
  text-align: center;
}

.node-tag {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--accent-violet-soft);
  color: var(--accent-violet);
  font-family: var(--font-mono);
  font-weight: 800;
  letter-spacing: 0.12em;
}

.orbital-card strong {
  display: block;
  font-family: var(--font-display);
  font-size: 25px;
  letter-spacing: -0.03em;
}

.orbital-card small {
  display: block;
  margin-top: 8px;
  color: var(--text-secondary);
}

.float-chip {
  position: absolute;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(var(--bg-page-rgb), 0.88);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  box-shadow: var(--shadow-soft);
  animation: floatY 4s var(--ease-product) infinite;
}

.chip-cyan { left: 8%; top: 18%; color: var(--accent-cyan); }
.chip-violet { right: 7%; top: 28%; color: var(--accent-violet); animation-delay: -1.2s; }
.chip-lime { right: 14%; bottom: 18%; color: var(--accent-lime); animation-delay: -2s; }

.capability-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.capability-card {
  padding: 22px;
  cursor: pointer;
}

.capability-card:hover,
.resource-list a:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.capability-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-weight: 900;
}

.capability-card h3,
.lab-card h2,
.section-headline h2 {
  margin: 16px 0 10px;
  font-family: var(--font-display);
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.capability-card p,
.lab-desc {
  color: var(--text-secondary);
  line-height: 1.75;
}

.capability-link {
  display: inline-flex;
  margin-top: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.tone-cyan .capability-icon,
.tone-cyan .flow-index { background: var(--accent-cyan-soft); color: var(--accent-cyan); }
.tone-violet .capability-icon,
.tone-violet .flow-index { background: var(--accent-violet-soft); color: var(--accent-violet); }
.tone-lime .capability-icon,
.tone-lime .flow-index { background: var(--accent-lime-soft); color: var(--accent-lime); }
.tone-orange .flow-index { background: var(--accent-orange-soft); color: var(--accent-orange); }
.tone-rose .capability-icon,
.tone-rose .flow-index { background: var(--accent-rose-soft); color: var(--accent-rose); }

.flow-section,
.matrix-section,
.resource-section,
.lab-card {
  padding: 26px;
}

.section-headline {
  margin-bottom: 20px;
}

.section-headline h2,
.lab-card h2 {
  font-size: clamp(26px, 4vw, 44px);
}

.rag-flow {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  list-style: none;
}

.rag-flow li {
  position: relative;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--surface-strong);
}

.flow-index {
  width: 38px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 900;
}

.rag-flow strong {
  display: block;
  margin-top: 14px;
}

.rag-flow p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.lab-control {
  margin: 22px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-secondary);
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-row div,
.grade-card {
  padding: 18px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  border: 1px solid var(--line);
}

.metric-row span,
.grade-card span {
  display: block;
  color: var(--text-secondary);
  font-size: 13px;
}

.metric-row strong,
.grade-card strong {
  display: block;
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.grade-card p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.grade-excellent strong { color: var(--accent-lime); }
.grade-good strong { color: var(--accent-cyan); }
.grade-medium strong { color: var(--accent-violet); }
.grade-pass strong { color: var(--accent-orange); }
.grade-fail strong { color: var(--accent-rose); }

.resource-list {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  list-style: none;
}

.resource-list a {
  min-height: 120px;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--text-main);
  background: var(--surface-strong);
  text-decoration: none;
  transition: transform var(--duration-normal) var(--ease-product), box-shadow var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product);
}

.resource-list a:hover {
  border-color: var(--accent-cyan);
}

.resource-list span {
  font-weight: 800;
}

.resource-list small {
  color: var(--text-secondary);
  line-height: 1.5;
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes signalPulse {
  0%, 100% { border-color: var(--line); transform: scale(1); }
  50% { border-color: var(--accent-cyan); transform: scale(0.96); }
}

@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 1280px) {
  .intro-hero,
  .capability-grid,
  .rag-flow,
  .resource-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .project-intro-page {
    padding: 18px;
  }

  .intro-hero,
  .capability-grid,
  .rag-flow,
  .lab-grid,
  .resource-list {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 280px;
  }

  .lab-control {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
