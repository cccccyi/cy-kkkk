// src/store/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

// 创建一个切片（slice）
const userSlice = createSlice({
  name: 'user', // 这个切片的名字
  initialState: {
    address: localStorage.getItem('address'), // 初始化的钱包地址为空
    isCting:false,
  },
  reducers: {
    setAddress(state, action) {
      state.address = action.payload; // 更新地址
    },
    setisCting(state, action) {
        state.isCting = action.payload;
    },
  },
});

export const { setAddress,setisCting } = userSlice.actions; // 导出 action，用于修改状态
export default userSlice.reducer; // 导出 reducer，用于配置 Store
