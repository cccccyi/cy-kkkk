// stores/news.js
import { defineStore } from 'pinia';

export const useNewsStore = defineStore('news', {
  state: () => ({
    primaryCategory: '全部',
    // 从 localStorage 中读取 pushFlag 的值，如果存在则为 'y'，否则为空字符串 ''
    pushFlag: localStorage.getItem('pushFlag') || '',
    refresh: false,
    m1:[],
    m2:[],
    m3:[],
  }),
  actions: {
    setPrimaryCategory(primaryCategory) {
      this.primaryCategory = primaryCategory;
    },
    setPushFlag(pushFlag) {
      // 设置 pushFlag 的值，并保存到 localStorage
      this.pushFlag = pushFlag;
      localStorage.setItem('pushFlag', pushFlag);
    },
    setRefresh(val) {
      this.refresh = val;
    },
    setM1(val) {
      this.m1 = val;
    }
  }
});