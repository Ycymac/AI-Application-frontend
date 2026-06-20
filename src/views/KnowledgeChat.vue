<template>
  <div class="chat-page">
    <aside class="conversation-panel">
      <div class="side-head">
        <span class="side-title">知识库问答</span>
        <button type="button" class="new-chat-btn" @click="startNewConversation">＋ 新建对话</button>
      </div>

      <div v-loading="conversationLoading" class="conversation-list">
        <button
          v-for="item in conversations"
          :key="item.conversationId"
          type="button"
          class="conversation-item"
          :class="{ active: item.conversationId === currentConversationId }"
          @click="openConversation(item)"
        >
          <div class="conversation-title">{{ item.title || '新对话' }}</div>
          <div class="conversation-meta">
            <span class="conversation-time">{{ formatDateTime(item.lastTime) }}</span>
            <span class="conversation-tools">
              <span class="tool-link" @click.stop="renameCurrentConversation(item)">重命名</span>
              <el-popconfirm title="确认删除该会话吗？" @confirm="removeConversation(item)">
                <span slot="reference" class="tool-link danger" @click.stop>删除</span>
              </el-popconfirm>
            </span>
          </div>
        </button>
        <div v-if="!conversationLoading && !conversations.length" class="empty-block">还没有会话，先发起一条提问。</div>
      </div>
    </aside>

    <section class="chat-panel">
      <header class="chat-head">
        <div class="chat-head-main">
          <span class="chat-dot"></span>
          <h1>{{ currentTitle }}</h1>
        </div>
        <label class="think-toggle">
          <el-switch v-model="deepThinking"></el-switch>
          <span>{{ deepThinking ? '深度思考' : '标准模式' }}</span>
        </label>
      </header>

      <div ref="messageList" class="message-list">
        <div v-if="!messages.length" class="chat-placeholder">
          <div class="placeholder-icon">AI</div>
          <h3>准备好了，随时开始</h3>
          <p>从知识库开始提问，系统会自动创建会话并流式返回答案。</p>
        </div>

        <div
          v-for="item in orderedMessages"
          :key="buildMessageKey(item)"
          class="message-row"
          :class="item.role"
        >
          <div class="message-bubble" :class="{ pending: item.pending }">
            <div v-if="item.pending" class="waiting-shell">
              <div class="beam-loader">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="waiting-copy">
                <h3>正在检索知识库</h3>
                <p>正在整理相关内容并生成回答，请稍候。</p>
              </div>
            </div>
            <div v-if="item.thinking" class="thinking-block">{{ item.thinking }}</div>
            <div
              v-if="shouldRenderMarkdown(item)"
              class="message-content markdown-content"
              v-html="renderMarkdown(item.content)"
            ></div>
            <div v-else class="message-content plain-content">{{ item.content }}</div>
            <div v-if="!item.pending" class="message-time">{{ formatDateTime(item.createTime) }}</div>
          </div>
        </div>
      </div>

      <div class="composer">
        <el-input
          v-model.trim="question"
          type="textarea"
          :rows="3"
          resize="none"
          maxlength="1000"
          show-word-limit
          placeholder="输入你的问题，回车发送，Shift + 回车换行"
          @keydown.native="handleKeydown"
        ></el-input>
        <div class="composer-actions">
          <el-button v-if="streaming" plain @click="stopStreaming">停止生成</el-button>
          <el-button type="primary" :loading="sending" @click="sendQuestion">发送</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import {
  deleteConversation,
  fetchConversationMessages,
  fetchConversations,
  renameConversation,
  stopRagChat,
  streamRagChat
} from '@/services/api';

export default {
  name: 'KnowledgeChat',
  computed: {
    orderedMessages() {
      return this.messages;
    }
  },
  data() {
    return {
      conversationLoading: false,
      sending: false,
      streaming: false,
      awaitingFirstResponse: false,
      deepThinking: false,
      question: '',
      conversations: [],
      currentConversationId: '',
      currentTitle: '新对话',
      messages: [],
      messageOrderSeed: 0,
      currentTaskId: '',
      activeStream: null
    };
  },
  created() {
    this.loadConversations();
  },
  methods: {
    async loadConversations() {
      this.conversationLoading = true;
      try {
        const result = await fetchConversations();
        this.conversations = (result.data || []).slice().sort((a, b) => {
          return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
        });
      } catch (error) {
        this.$message.error(error.message || '获取会话列表失败');
      } finally {
        this.conversationLoading = false;
      }
    },
    async openConversation(item) {
      this.currentConversationId = item.conversationId;
      this.currentTitle = item.title || '新对话';
      try {
        await this.reloadConversationMessages(item.conversationId);
      } catch (error) {
        this.$message.error(error.message || '获取会话消息失败');
      }
    },
    startNewConversation() {
      this.currentConversationId = '';
      this.currentTitle = '新对话';
      this.messages = [];
      this.messageOrderSeed = 0;
      this.currentTaskId = '';
    },
    async renameCurrentConversation(item) {
      try {
        const { value } = await this.$prompt('请输入新的会话标题', '重命名会话', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: item.title
        });
        await renameConversation(item.conversationId, { title: value });
        this.$message.success('会话已重命名');
        if (item.conversationId === this.currentConversationId) {
          this.currentTitle = value;
        }
        await this.loadConversations();
      } catch (error) {
        if (error === 'cancel') {
          return;
        }
        this.$message.error(error.message || '重命名失败');
      }
    },
    async removeConversation(item) {
      try {
        await deleteConversation(item.conversationId);
        this.$message.success('会话已删除');
        if (item.conversationId === this.currentConversationId) {
          this.startNewConversation();
        }
        await this.loadConversations();
      } catch (error) {
        this.$message.error(error.message || '删除会话失败');
      }
    },
    handleKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.sendQuestion();
      }
    },
    async sendQuestion() {
      if (!this.question || this.sending || this.streaming) {
        return;
      }
      const question = this.question;
      this.question = '';
      this.sending = true;
      this.streaming = true;

      const userMessage = this.createLocalMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
        createTime: new Date(),
        thinking: ''
      });
      const assistantMessage = this.createLocalMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        createTime: new Date(),
        thinking: '',
        pending: true
      });
      this.messages.push(userMessage, assistantMessage);
      this.$nextTick(this.scrollToBottom);
      this.awaitingFirstResponse = true;

      try {
        this.activeStream = await streamRagChat({
          question,
          conversationId: this.currentConversationId,
          deepThinking: this.deepThinking
        }, {
          onEvent: payload => this.consumeSseEvent(payload, assistantMessage)
        });
        await this.activeStream.done;
        await this.loadConversations();
        if (this.currentConversationId) {
          await this.reloadConversationMessages(this.currentConversationId);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          assistantMessage.content = assistantMessage.content || '请求失败，请稍后重试。';
          this.$message.error(error.message || '发送消息失败');
        }
      } finally {
        this.awaitingFirstResponse = false;
        assistantMessage.pending = false;
        this.sending = false;
        this.streaming = false;
        this.activeStream = null;
      }
    },
    consumeSseEvent(payload, assistantMessage) {
      if (payload.event === 'meta') {
        this.currentConversationId = payload.data.conversationId;
        this.currentTaskId = payload.data.taskId;
        return;
      }
      if (payload.event === 'message') {
        if (payload.data && payload.data.delta) {
          this.markAssistantResponded(assistantMessage);
        }
        if (payload.data.type === 'think') {
          assistantMessage.thinking += payload.data.delta || '';
        } else {
          assistantMessage.content += payload.data.delta || '';
        }
        this.$nextTick(this.scrollToBottom);
        return;
      }
      if (payload.event === 'finish') {
        this.markAssistantResponded(assistantMessage);
        if (payload.data && payload.data.title) {
          this.currentTitle = payload.data.title;
        }
        return;
      }
      if (payload.event === 'done') {
        this.markAssistantResponded(assistantMessage);
        this.$nextTick(this.scrollToBottom);
      }
    },
    markAssistantResponded(assistantMessage) {
      if (!assistantMessage || !assistantMessage.pending) {
        return;
      }
      assistantMessage.pending = false;
      this.awaitingFirstResponse = false;
    },
    async stopStreaming() {
      try {
        if (this.currentTaskId) {
          await stopRagChat(this.currentTaskId);
        }
        if (this.activeStream) {
          this.activeStream.abort();
        }
      } catch (error) {
        this.$message.error(error.message || '停止生成失败');
      } finally {
        this.streaming = false;
        this.sending = false;
      }
    },
    scrollToBottom() {
      const element = this.$refs.messageList;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    },
    buildMessageKey(item) {
      return [item.id, item.role, item.createTime, item.localOrder]
        .filter(value => value !== undefined && value !== null && value !== '')
        .join('-');
    },
    createLocalMessage(message) {
      return {
        thinking: '',
        pending: false,
        ...message,
        localOrder: this.messageOrderSeed++
      };
    },
    async reloadConversationMessages(conversationId) {
      const result = await fetchConversationMessages(conversationId);
      this.messageOrderSeed = 0;
      this.messages = this.normalizeMessages(result.data || []);
      this.$nextTick(this.scrollToBottom);
    },
    normalizeMessages(messages) {
      const normalized = messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createTime: message.createTime,
        thinking: message.thinking || ''
      }));

      if (this.shouldReverseMessages(normalized)) {
        normalized.reverse();
      }

      return normalized
        .map(message => this.createLocalMessage({
          id: message.id,
          role: message.role,
          content: message.content,
          createTime: message.createTime,
          thinking: message.thinking || ''
        }));
    },
    shouldReverseMessages(messages) {
      if (messages.length < 2) {
        return false;
      }

      const firstTimestamp = this.parseMessageTime(messages[0].createTime);
      const lastTimestamp = this.parseMessageTime(messages[messages.length - 1].createTime);
      if (firstTimestamp && lastTimestamp && firstTimestamp > lastTimestamp) {
        return true;
      }

      const firstNumericId = this.parseNumericId(messages[0].id);
      const lastNumericId = this.parseNumericId(messages[messages.length - 1].id);
      return firstNumericId !== null && lastNumericId !== null && firstNumericId > lastNumericId;
    },
    parseMessageTime(value) {
      if (!value) {
        return 0;
      }
      const date = new Date(value);
      const timestamp = date.getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    parseNumericId(value) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const numericId = Number(value);
      return Number.isNaN(numericId) ? null : numericId;
    },
    shouldRenderMarkdown(item) {
      return item && item.role !== 'user';
    },
    renderMarkdown(content = '') {
      if (!content) {
        return '';
      }

      const lines = String(content).replace(/\r\n/g, '\n').split('\n');
      const html = [];
      let listType = '';

      const closeList = () => {
        if (listType) {
          html.push(`</${listType}>`);
          listType = '';
        }
      };

      const openList = type => {
        if (listType === type) {
          return;
        }
        closeList();
        html.push(`<${type}>`);
        listType = type;
      };

      const pushParagraph = line => {
        closeList();
        html.push(`<p>${this.renderInlineMarkdown(line)}</p>`);
      };

      lines.forEach(line => {
        if (!line.trim()) {
          closeList();
          return;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          closeList();
          const level = Math.min(headingMatch[1].length, 4);
          html.push(`<h${level}>${this.renderInlineMarkdown(headingMatch[2])}</h${level}>`);
          return;
        }

        const unorderedMatch = line.match(/^\s*[-*+]\s+(.+)$/);
        if (unorderedMatch) {
          openList('ul');
          html.push(`<li>${this.renderInlineMarkdown(unorderedMatch[1])}</li>`);
          return;
        }

        const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (orderedMatch) {
          openList('ol');
          html.push(`<li>${this.renderInlineMarkdown(orderedMatch[1])}</li>`);
          return;
        }

        pushParagraph(line);
      });

      closeList();
      return html.join('');
    },
    renderInlineMarkdown(text = '') {
      return this.escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    },
    escapeHtml(value = '') {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
.chat-page { height: 100vh; overflow: hidden; display: grid; grid-template-columns: 280px minmax(0, 1fr); background: var(--bg-page); color: var(--text-main); }

/* Sidebar — ChatGPT-style conversation list */
.conversation-panel { height: 100vh; min-height: 0; padding: 16px 12px; display: flex; flex-direction: column; background: var(--surface-strong); border-right: 1px solid var(--line); }
.side-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.side-title { font-family: var(--font-display); font-size: 15px; font-weight: 650; letter-spacing: -0.02em; color: var(--text-main); }
.new-chat-btn { padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface-card); color: var(--text-main); font-size: 13px; font-weight: 600; cursor: pointer; transition: background var(--duration-fast) var(--ease-product), border-color var(--duration-fast) var(--ease-product); }
.new-chat-btn:hover { background: var(--surface-muted); border-color: var(--line-strong); }
.conversation-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 4px; overflow: auto; }
.conversation-item { width: 100%; padding: 10px 12px; border: 1px solid transparent; border-radius: var(--radius-md); text-align: left; background: transparent; color: var(--text-secondary); cursor: pointer; transition: background var(--duration-fast) var(--ease-product), color var(--duration-fast) var(--ease-product); }
.conversation-item:hover { background: var(--surface-muted); }
.conversation-item.active { background: var(--surface-muted); color: var(--text-main); border-color: var(--line); }
.conversation-title { font-size: 14px; font-weight: 600; color: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conversation-meta { margin-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.conversation-time { color: var(--text-tertiary); font-size: 11px; }
.conversation-tools { display: inline-flex; gap: 10px; opacity: 0; transition: opacity var(--duration-fast) var(--ease-product); }
.conversation-item:hover .conversation-tools,
.conversation-item.active .conversation-tools { opacity: 1; }
.tool-link { font-size: 11px; color: var(--text-tertiary); cursor: pointer; }
.tool-link:hover { color: var(--text-main); }
.tool-link.danger:hover { color: var(--accent-rose); }

/* Chat panel */
.chat-panel { height: 100vh; min-height: 0; display: flex; flex-direction: column; min-width: 0; background: var(--bg-page); }
.chat-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--line); }
.chat-head-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.chat-dot { width: 8px; height: 8px; border-radius: var(--radius-pill); background: var(--accent-lime); flex: 0 0 auto; }
.chat-head h1 { margin: 0; font-family: var(--font-display); font-size: 17px; font-weight: 650; letter-spacing: -0.02em; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.think-toggle { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; flex: 0 0 auto; }

.message-list { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 18px; padding: 24px clamp(16px, 8vw, 120px); }
.message-row { display: flex; }
.message-row.user { justify-content: flex-end; }
.message-bubble { max-width: 80%; padding: 14px 16px; border-radius: var(--radius-lg); background: var(--surface-card); border: 1px solid var(--line); color: var(--text-main); line-height: 1.8; }
.message-bubble.pending { min-width: min(420px, 100%); }
.message-row.user .message-bubble { background: var(--text-main); border-color: var(--text-main); color: var(--bg-page); }
.message-content { overflow-wrap: anywhere; word-break: break-word; }
.plain-content, .thinking-block { white-space: pre-wrap; }
.message-time { margin-top: 8px; color: var(--text-tertiary); font-size: 11px; }
.message-row.user .message-time { color: rgba(255, 255, 255, 0.5); }

.markdown-content /deep/ h1, .markdown-content /deep/ h2, .markdown-content /deep/ h3, .markdown-content /deep/ h4 { margin: 16px 0 8px; color: var(--text-main); line-height: 1.45; font-weight: 750; }
.markdown-content /deep/ h1:first-child, .markdown-content /deep/ h2:first-child, .markdown-content /deep/ h3:first-child, .markdown-content /deep/ h4:first-child { margin-top: 0; }
.markdown-content /deep/ h1 { font-size: 20px; }
.markdown-content /deep/ h2 { font-size: 18px; }
.markdown-content /deep/ h3 { font-size: 16px; }
.markdown-content /deep/ h4 { font-size: 15px; }
.markdown-content /deep/ p { margin: 0 0 10px; }
.markdown-content /deep/ p:last-child { margin-bottom: 0; }
.markdown-content /deep/ ul, .markdown-content /deep/ ol { margin: 8px 0 14px; padding-left: 22px; }
.markdown-content /deep/ li { margin: 4px 0; padding-left: 2px; }
.markdown-content /deep/ strong { color: var(--text-main); font-weight: 750; }
.markdown-content /deep/ code { padding: 2px 5px; border-radius: var(--radius-xs); background: var(--surface-muted); color: var(--accent-violet); font-family: var(--font-mono); font-size: 0.92em; }
.thinking-block { margin-bottom: 10px; padding: 12px; border-radius: var(--radius-md); background: var(--surface-muted); color: var(--text-secondary); font-size: 13px; }

.waiting-shell { display: flex; align-items: center; gap: 18px; min-width: 0; }
.waiting-copy h3 { margin: 0; color: var(--text-main); font-size: 16px; }
.waiting-copy p { margin: 6px 0 0; color: var(--text-secondary); line-height: 1.7; }
.beam-loader { width: 96px; display: grid; gap: 8px; flex: 0 0 auto; }
.beam-loader span { display: block; height: 8px; border-radius: var(--radius-pill); background: linear-gradient(90deg, transparent, var(--text-tertiary), transparent); background-size: 220% 100%; animation: beamMove 1.3s linear infinite; }
.beam-loader span:nth-child(2) { animation-delay: 0.14s; }
.beam-loader span:nth-child(3) { animation-delay: 0.28s; }

.composer { flex: 0 0 auto; display: flex; flex-direction: column; gap: 12px; padding: 16px clamp(16px, 8vw, 120px) 22px; border-top: 1px solid var(--line); }
.composer-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.chat-placeholder { margin: auto; max-width: 420px; text-align: center; color: var(--text-secondary); }
.placeholder-icon { width: 66px; height: 66px; margin: 0 auto 16px; border-radius: var(--radius-lg); display: grid; place-items: center; background: var(--surface-muted); color: var(--text-secondary); font-family: var(--font-mono); font-size: 20px; font-weight: 800; }
.chat-placeholder h3 { margin: 0; color: var(--text-main); font-family: var(--font-display); letter-spacing: -0.02em; }
.chat-placeholder p { margin: 8px 0 0; line-height: 1.7; }
.empty-block { padding: 16px 12px; color: var(--text-tertiary); font-size: 13px; line-height: 1.7; }

@keyframes beamMove {
  0% { background-position: 100% 50%; }
  100% { background-position: -100% 50%; }
}

@media (max-width: 900px) {
  .chat-page { height: auto; min-height: 100vh; grid-template-columns: 1fr; overflow: visible; }
  .conversation-panel, .chat-panel { height: auto; }
  .message-list, .composer { padding-left: 16px; padding-right: 16px; }
  .message-bubble { max-width: 100%; }
  .message-bubble.pending { min-width: 0; }
  .waiting-shell { align-items: flex-start; }
}
</style>
