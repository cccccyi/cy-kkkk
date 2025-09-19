# 项目集合仓库

本仓库包含多个子项目，每个项目都有独立的功能和目标。以下为各项目的基本信息：
- v3-subgraph   Uniswap V3版本的子图代码
- swap-server-api  AntSwap 接口服务
- media-backend    媒体后端接口服务
- block-media    媒体后台管理相关代码

- crawler_center_server     PHP实现的接口服务，自动化任务采集存储，任务获取接口 （任务执行的中心端）
- yy_schedule               任务执行客户端调度
- selfdriver                浏览器自动化任务/浏览器采集执行引擎  （任务执行单位）
- block_data    PHP程序，后端脚本服务， AI处理采集到的信息/X发帖任务控制/X推文处理/告警
- yy_blockchain_crawler     模拟采集相关代码

- 

---

## 📂 项目列表

### 1. v3-subgraph

* **路径**：`/v3-subgraph`
* **简介**：子图是存储链上数据的工具，通过子图可以实现方便检索相关链上数据的功能
* **主要技术**：仿照官方Uniswap V3 子图实现
* **快速开始**：

  ```bash
    Uniswap V3 子图的官方工程 https://github.com/Uniswap/v3-subgraph
    因为我们的合约是仿照 Uniswap V3 部署的， 合约相关的代码仿照官方的视线
    子图托管工具： https://thegraph.com/，  参考 thegraph 中部署子图的流程即可
  ```

---

### 2. swap-server-api

* **路径**：`/swap-server-api`
* **简介**：这是一个后端接口应用，用于 AntDesign。
* **主要技术**：NestJS
* **快速开始**：

  ```bash
  依赖： 
    postgresql 数据库
    redis 缓存
    部署好的子图地址
  ```

---

### 3. media-backend

* **路径**：`/media-backend`
* **简介**：这是一个后端接口应用，用于 媒体网站（APP） 数据接口服务。
* **主要技术**：NestJs
* **快速开始**：

  ```bash
  依赖：
    采集完的数据， Mysql数据库
  ```

---

- block-media    媒体后台管理相关代码
### 3. block-media

* **路径**：`/block-media`
* **简介**：媒体后台管理系统， 呈现采集，新闻列表等数据， X账号管理等功能， 采集目标管理等。
* **主要技术**：Element-ui  VUE2
* **快速开始**：

---

### 3. crawler_center_server

* **路径**：`/crawler_center_server`
* **简介**：PHP实现的接口服务，自动化任务采集存储，任务获取接口 （任务执行的中心端）
* **主要技术**：PHP
* **快速开始**：

  ```bash
  依赖：
    依赖 Apache 实现的 web 接口
  ```

---

- yy_schedule               
### 3. yy_schedule

* **路径**：`/yy_schedule`
* **简介**：任务执行客户端调度。
* **主要技术**：nodejs 实现
* **快速开始**：

  ```bash
  依赖：
    在 自动化/采集 端部署， 与 crawler_center_server 交互，实现相关任务的获取及调度。
  ```

---


### 3. selfdriver

* **路径**：`/selfdriver`
* **简介**：浏览器自动化任务/浏览器采集执行引擎  （任务执行单位）
* **主要技术** Electron 
* **快速开始**：

  ```bash
  Electron 实现的一种浏览器自动化的引擎， 支持浏览器的各种动作自动化（如：打开链接、点击、滚动、输入等 ... 通过增加解析逻辑实现浏览器浏览的同步采集）
  ```

---

### 3. block_data

* **路径**：`/block_data`
* **简介**：PHP程序，后端脚本服务， AI处理采集到的信息/X发帖任务控制/X推文处理
* **主要技术**：PHP
* **快速开始**：

  ```bash
    后端处理脚本， 实现采集结果的处理， 报警等功能
  ```

---


### 3. yy_blockchain_crawler

* **路径**：`/yy_blockchain_crawler`
* **简介**：模拟采集相关代码
* **主要技术**：nodejs
* **快速开始**：

  ```bash
  依赖：
    对可进行模拟采集的目标进行模拟采集， 如 panews， coinmarket 等
  ```

---

## 📖 使用说明

1.  每个目录都是独立执行的
2.  理解相应项目功能后部署

---

## 📝 贡献

欢迎提交 Pull Request 或开 Issue 讨论改进建议。


