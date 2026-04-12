import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store';
import AuthPage from '@/views/AuthPage.vue';
import MainLayout from '@/views/MainLayout.vue';
import ResumeManager from '@/views/ResumeManager.vue';

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
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'resumes',
          name: 'resumes',
          component: ResumeManager
        }
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/auth');
    return;
  }

  if (to.matched.some(record => record.meta.guestOnly) && isAuthenticated) {
    next('/app/resumes');
    return;
  }

  next();
});

export default router;
