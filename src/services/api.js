import http from './http';

export function login(payload) {
  return http.post('/api/user/service/login', payload);
}

export function signUp(payload) {
  return http.post('/api/user/service/sign/up', payload);
}

export function logout(payload) {
  return http.post('/api/user/service/logout', payload);
}

export function fetchResumeNames() {
  return http.get('/api/interviewee/form/search/name/list');
}

export function fetchResumeDetail(id) {
  return http.post('/api/interviewee/form/search/by/id', { id });
}

export function createResume(payload) {
  return http.post('/api/interviewee/form/add', payload);
}

export function updateResume(payload) {
  return http.put('/api/interviewee/form/update', payload);
}

export function deleteResume(id) {
  return http.delete('/api/interviewee/form/delete', {
    data: { id }
  });
}
