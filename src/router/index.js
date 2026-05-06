import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store';
import AuthPage from '@/views/AuthPage.vue';
import InterviewCenter from '@/views/InterviewCenter.vue';
import IntentNodeManager from '@/views/IntentNodeManager.vue';
import KnowledgeBaseManager from '@/views/KnowledgeBaseManager.vue';
import KnowledgeChat from '@/views/KnowledgeChat.vue';
import ResumeManager from '@/views/ResumeManager.vue';
import WorkspaceLayout from '@/views/WorkspaceLayout.vue';

Vue.use(Router);

const router = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: () => (store.getters.isAuthenticated ? '/app/resumes' : '/auth')
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage,
      meta: { guestOnly: true }
    },
    {
      path: '/app',
      component: WorkspaceLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'resumes',
          name: 'resumes',
          component: ResumeManager
        },
        {
          path: 'interviews',
          name: 'interviews',
          component: InterviewCenter
        },
        {
          path: 'knowledge-bases',
          name: 'knowledge-bases',
          component: KnowledgeBaseManager,
          meta: { requiresManagePermission: true }
        },
        {
          path: 'intent-nodes',
          name: 'intent-nodes',
          component: IntentNodeManager,
          meta: { requiresManagePermission: true }
        },
        {
          path: 'knowledge-chat',
          name: 'knowledge-chat',
          component: KnowledgeChat
        }
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const isBasicUser = store.getters.isBasicUser;

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/auth');
    return;
  }

  if (to.matched.some(record => record.meta.guestOnly) && isAuthenticated) {
    next('/app/resumes');
    return;
  }

  if (to.matched.some(record => record.meta.requiresManagePermission) && isBasicUser) {
    next('/app/resumes');
    return;
  }

  next();
});

export default router;
