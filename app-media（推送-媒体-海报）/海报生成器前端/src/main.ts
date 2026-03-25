import './assets/base.css'
import './assets/box.scss'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import NProgress from 'nprogress'; 
import 'nprogress/nprogress.css'; 
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/dark/css-vars.scss'
import './styles/build.scss'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* 引入图标库组件 */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import all icons, solid图标库的包名为fas、regular图标库的包名为far、brands图标库的包名为fab */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
/* 添加 fas 图标 在网站中的solid分类下面获取*/
library.add(fas)
library.add(far)
library.add(fab)
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';  //持久化

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

NProgress.configure({
    speed: 666, // 进度条动画速度（毫秒），数值越大越慢
    trickleSpeed: 666, // 自动递增的速度（默认 200ms），调大后增长会变慢
    showSpinner: false
  });

router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});

router.afterEach(() => {
  NProgress.done();
});
const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(pinia);
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

