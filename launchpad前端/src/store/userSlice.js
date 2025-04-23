// src/store/userSlice.js
import { createSlice } from '@reduxjs/toolkit';
// 创建一个切片（slice）
//alert(localStorage.getItem('isTable'));
const userSlice = createSlice({
  name: 'user', // 这个切片的名字
  initialState: {
    address: localStorage.getItem('address'), // 初始化的钱包地址为空
    isCting:false,
    isTable: localStorage.getItem('isTable')==null?true:JSON.parse(localStorage.getItem('isTable')),
    deploy_token_addr:'',//部署代币地址
    token_buy_receiving_addr:'',//买币地址
    token_sell_addr:'',//卖币地址
  },
  reducers: {
    setAddress(state, action) {
      state.address = action.payload; // 更新地址
    },
    setisCting(state, action) {
        state.isCting = action.payload;
    },
    setisTable(state, action) {
        localStorage.setItem('isTable',action.payload)
        state.isTable = action.payload;
    },
    setDeploy_token_addr(state, action) {
      state.deploy_token_addr = action.payload; // 更新部署代币地址
    },
    setToken_buy_receiving_addr(state, action) {
      state.token_buy_receiving_addr = action.payload; // 更新买币地址
    },
    setToken_sell_addr(state, action) {
      state.token_sell_addr = action.payload; // 更新卖币地址
    },
  },
});
export const { 
  setAddress,
  setisCting,
  setisTable,
  setDeploy_token_addr,
  setToken_buy_receiving_addr,
  setToken_sell_addr
} = userSlice.actions; // 导出 action，用于修改状态
export default userSlice.reducer; // 导出 reducer，用于配置 Store
