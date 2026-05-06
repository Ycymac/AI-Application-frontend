import {
  AUTH_EXPIRED_MESSAGE,
  agentHttp,
  handleAuthFailure,
  knowledgeHttp,
  ragHttp,
  userHttp
} from './http';
import store from '@/store';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function requestFirst(method, urls, payload, config = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      const client = url.client;
      const path = url.path;
      if (method === 'get') {
        return await client.get(path, { params: payload, ...config });
      }
      if (method === 'post') {
        return await client.post(path, payload, config);
      }
      if (method === 'put') {
        return await client.put(path, payload, config);
      }
      if (method === 'patch') {
        return await client.patch(path, payload, config);
      }
      if (method === 'delete') {
        return await client.delete(path, { data: payload, ...config });
      }
      throw new Error(`Unsupported request method: ${method}`);
    } catch (error) {
      lastError = error;
      const message = (error && error.message) || '';
      const shouldContinue = /404|not found|Cannot POST|Cannot GET/i.test(message);
      if (!shouldContinue) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Request failed');
}

function parseSseEventBlock(block) {
  const lines = block.split(/\r?\n/);
  let event = 'message';
  const dataLines = [];

  lines.forEach(line => {
    if (!line) {
      return;
    }
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      return;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  });

  const rawData = dataLines.join('\n');
  let data = rawData;

  if (rawData && rawData !== '[DONE]') {
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      data = rawData;
    }
  }

  return { event, data, rawData };
}

export function login(payload) {
  return userHttp.post('/api/user/service/login', payload);
}

export function signUp(payload) {
  return userHttp.post('/api/user/service/sign/up', payload);
}

export function logout(payload) {
  return userHttp.post('/api/user/service/logout', payload);
}

export function fetchResumeNames() {
  return userHttp.get('/api/interviewee/form/search/name/list');
}

export function fetchResumeDetail(id) {
  return userHttp.post('/api/interviewee/form/search/by/id', { id });
}

export function createResume(payload) {
  return userHttp.post('/api/interviewee/form/add', payload);
}

export function updateResume(payload) {
  return userHttp.put('/api/interviewee/form/update', payload);
}

export function deleteResume(id) {
  return userHttp.delete('/api/interviewee/form/delete', {
    data: { id }
  });
}

export function generateInterviewQuestions(payload) {
  return requestFirst('post', [
    { client: agentHttp, path: '/api/agent/questions' },
    { client: agentHttp, path: '/api/agent/interview/questions/generate' },
    { client: agentHttp, path: '/api/agent/interview/question/generate' },
    { client: agentHttp, path: '/api/agent/interview/start' }
  ], payload);
}

export function evaluateInterviewAnswers(payload) {
  return requestFirst('post', [
    { client: agentHttp, path: '/api/agent/evaluations' },
    { client: agentHttp, path: '/api/agent/interview/evaluate' },
    { client: agentHttp, path: '/api/agent/interview/answers/evaluate' },
    { client: agentHttp, path: '/api/agent/interview/review' }
  ], payload);
}

export function generateInterviewReport(payload) {
  return requestFirst('post', [
    { client: agentHttp, path: '/api/agent/report' },
    { client: agentHttp, path: '/api/agent/interview/report/generate' },
    { client: agentHttp, path: '/api/agent/interview/report' },
    { client: agentHttp, path: '/api/agent/interview/summary' }
  ], payload);
}

export function fetchInterviewRecords() {
  return requestFirst('get', [
    { client: agentHttp, path: '/record/service/search/record' },
    { client: agentHttp, path: '/api/agent/interview/record/list' },
    { client: agentHttp, path: '/api/agent/interview/report/list' },
    { client: agentHttp, path: '/api/agent/interview/session/list' }
  ]);
}

export function fetchInterviewReport(id) {
  return requestFirst('post', [
    { client: agentHttp, path: '/record/service/click/record' },
    { client: agentHttp, path: '/api/agent/interview/report/detail' },
    { client: agentHttp, path: '/api/agent/interview/report/search/by/id' },
    { client: agentHttp, path: '/api/agent/interview/session/detail' }
  ], { id });
}

export function fetchKnowledgeBasePage(params) {
  return knowledgeHttp.get('/api/knowledge/knowledge-base', { params });
}

export function fetchKnowledgeBaseDetail(kbId) {
  return knowledgeHttp.get(`/api/knowledge/knowledge-base/${kbId}`);
}

export function createKnowledgeBase(payload) {
  return knowledgeHttp.post('/api/knowledge/knowledge-base', payload);
}

export function updateKnowledgeBase(payload) {
  return knowledgeHttp.put('/api/knowledge/knowledge-base', payload);
}

export function renameKnowledgeBase(payload) {
  return knowledgeHttp.put('/api/knowledge/knowledge-base/rename', payload);
}

export function deleteKnowledgeBase(kbId) {
  return knowledgeHttp.delete(`/api/knowledge/knowledge-base/${kbId}`);
}

export function fetchKnowledgeDocuments(kbId, params) {
  return knowledgeHttp.get(`/knowledge-base/${kbId}/docs`, { params });
}

export function fetchKnowledgeDocumentDetail(docId) {
  return knowledgeHttp.get(`/knowledge-base/docs/${docId}`);
}

export function uploadKnowledgeDocument(kbId, payload) {
  return knowledgeHttp.post(`/knowledge-base/${kbId}/docs/upload`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function updateKnowledgeDocument(docId, payload) {
  return knowledgeHttp.put(`/knowledge-base/docs/${docId}`, payload);
}

export function deleteKnowledgeDocument(docId) {
  return knowledgeHttp.delete(`/knowledge-base/docs/${docId}`);
}

export function startKnowledgeDocumentChunk(docId) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunk`);
}

export function toggleKnowledgeDocumentEnabled(docId, enabled) {
  return knowledgeHttp.patch(`/knowledge-base/docs/${docId}/enable${buildQuery({ value: enabled })}`);
}

export function searchKnowledgeDocuments(params) {
  return knowledgeHttp.get('/knowledge-base/docs/search', { params });
}

export function fetchKnowledgeDocumentChunkLogs(docId, params) {
  return knowledgeHttp.get(`/knowledge-base/docs/${docId}/chunk-logs`, { params });
}

export function fetchKnowledgeChunks(docId, params) {
  return knowledgeHttp.get(`/knowledge-base/docs/${docId}/chunks`, { params });
}

export function deleteKnowledgeChunk(docId, chunkId) {
  return knowledgeHttp.delete(`/knowledge-base/docs/${docId}/chunks/${chunkId}`);
}

export function enableKnowledgeChunk(docId, chunkId) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunks/${chunkId}/enable`);
}

export function disableKnowledgeChunk(docId, chunkId) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunks/${chunkId}/disable`);
}

export function batchEnableKnowledgeChunks(docId, payload) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunks/batch-enable`, payload || {});
}

export function batchDisableKnowledgeChunks(docId, payload) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunks/batch-disable`, payload || {});
}

export function rebuildKnowledgeChunks(docId) {
  return knowledgeHttp.post(`/knowledge-base/docs/${docId}/chunks/rebuild`);
}

export function fetchIntentNodes() {
  return ragHttp.get('/api/rag/intent-node');
}

export function createIntentNode(payload) {
  return ragHttp.post('/api/rag/intent-node', payload);
}

export function updateIntentNode(id, payload) {
  return ragHttp.put(`/api/rag/intent-node/${id}`, payload);
}

export function deleteIntentNode(id) {
  return ragHttp.delete(`/api/rag/intent-node/${id}`);
}

export function batchEnableIntentNodes(payload) {
  return ragHttp.post('/api/rag/intent-node/batch/enable', payload);
}

export function batchDisableIntentNodes(payload) {
  return ragHttp.post('/api/rag/intent-node/batch/disable', payload);
}

export function batchDeleteIntentNodes(payload) {
  return ragHttp.post('/api/rag/intent-node/batch/delete', payload);
}

export function fetchConversations() {
  return ragHttp.get('/conversations');
}

export function renameConversation(conversationId, payload) {
  return ragHttp.put(`/conversations/${conversationId}`, payload);
}

export function deleteConversation(conversationId) {
  return ragHttp.delete(`/conversations/${conversationId}`);
}

export function fetchConversationMessages(conversationId) {
  return ragHttp.get(`/conversations/${conversationId}/messages`);
}

export function stopRagChat(taskId) {
  return ragHttp.post(`/rag/v3/stop${buildQuery({ taskId })}`);
}

export async function streamRagChat(params, handlers = {}) {
  const controller = new AbortController();
  const token = store.state.auth && store.state.auth.token;
  const response = await fetch(`${ragHttp.defaults.baseURL}/rag/v3/chat${buildQuery(params)}`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: token ? `Bearer ${token}` : ''
    },
    signal: controller.signal
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok || !response.body || contentType.includes('application/json')) {
    let message = '聊天请求失败';
    let payload = null;
    try {
      if (contentType.includes('application/json')) {
        payload = await response.json();
        message = payload.message || payload.msg || message;
      } else {
        const rawText = await response.text();
        message = rawText || response.statusText || message;
      }
    } catch (error) {
      message = response.statusText || message;
    }

    if (handleAuthFailure({
      status: response.status,
      code: payload && payload.code,
      message,
      config: { url: '/rag/v3/chat' }
    })) {
      throw new Error(AUTH_EXPIRED_MESSAGE);
    }

    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const done = (async () => {
    let streamDone = false;
    while (!streamDone) {
      const chunk = await reader.read();
      streamDone = chunk.done;
      const value = chunk.value;
      if (streamDone) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';

      blocks.forEach(block => {
        if (!block.trim()) {
          return;
        }
        const parsed = parseSseEventBlock(block);
        if (handlers.onEvent) {
          handlers.onEvent(parsed);
        }
      });
    }

    if (buffer.trim()) {
      const parsed = parseSseEventBlock(buffer);
      if (handlers.onEvent) {
        handlers.onEvent(parsed);
      }
    }
  })();

  return {
    abort: () => controller.abort(),
    done
  };
}
