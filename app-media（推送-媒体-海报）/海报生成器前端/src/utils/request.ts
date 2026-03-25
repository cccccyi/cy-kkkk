import axios from 'axios';

// 创建 axios 实例
const axiosInstance = axios.create({
  timeout: 10000, // 请求超时设置
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 在这里可以添加 token 等认证信息
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 添加响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response.data, // 直接返回数据
  (error) => Promise.reject(error)
);

// 封装 GET 请求
axiosInstance.get = (url, data) => {
  return axiosInstance.request({
    method: 'get',
    url,
    params: data, // 使用 params 传递查询参数
  });
};

// 封装 POST 请求
axiosInstance.post = (url, data) => {
  return axiosInstance.request({
    method: 'post',
    url,
    data, // 使用 data 传递请求体
  });
};

export default axiosInstance;