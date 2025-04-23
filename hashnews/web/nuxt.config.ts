import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true, // 启用服务器端渲染
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: [
    './assets/output/font.css',
    './assets/output/fontkai.css',
    './assets/iconfont/iconfont.css',
    './assets/base.css',       // 引入 base.css
    './assets/box.scss',       // 引入 box.scss
    './styles/dark/css-vars.scss',  // 其他全局样式文件
    './styles/build.scss',// 其他全局样式文件
    'element-plus/dist/index.css' , // 引入 Element Plus 样式
    'element-plus/theme-chalk/dark/css-vars.css'  // 引入 Element Plus 样式
  ],
  plugins: [
    '~/plugins/element-plus.ts',    // 引入 Element Plus 插件
    '~/plugins/pinia.ts',
  ], 
  modules: ['@vesp/nuxt-fontawesome', 'nuxt-swiper','@nuxtjs/device'],
  devServer: {
    host: '0.0.0.0',
    port: 3000 // 可以根据需要修改端口号
  },
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
      ]
    }
  }
})
    