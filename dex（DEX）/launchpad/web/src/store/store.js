// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice'; // 引入我们定义的 userSlice

const store = configureStore({
  reducer: {
    user: userReducer, // 注册用户相关的状态管理
  },
});

export default store;
