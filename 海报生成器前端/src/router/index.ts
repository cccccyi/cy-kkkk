import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/list.vue'),
      meta: { title: '排行榜生成器' },
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('../views/news.vue'),
    },
    {
      path: '/news-detail',
      name: 'news-detail',
      component: () => import('../views/news-detail.vue'),
      meta: { title: '数据' },
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../views/list.vue'),
      meta: { title: '数据列表' },
    },
    {
      path: '/newsfocus',
      name: 'newsfocus',
      component: () => import('../views/newsfocus.vue'),
    },
    {
      path: '/deepsearch',
      name: 'deepsearch',
      component: () => import('../views/deepsearch.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的滚动位置（例如用户在返回上一页时）
    if (savedPosition) {
      return savedPosition
    } else {
      // 每次路由跳转后，滚动到页面顶部
      return { top: 0 }
    }
  }
})
router.afterEach((to) => {
  // 动态设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = 'HashNews - ';  // 默认标题
  }
});
export default router
