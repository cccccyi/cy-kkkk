# 本地自动回复 API

运行前将 `.env.example` 复制为本地 `.env`，然后通过 shell 或进程管理器加载环境变量。
`API_AUTH_TOKEN` 必须是至少 32 字符的随机值；未配置时服务会拒绝启动。

```bash
cp .env.example .env
# 填写 .env 后加载它
set -a; . ./.env; set +a
npm start
```

服务默认只监听 `127.0.0.1`。`CORS_ORIGINS` 使用逗号分隔允许的浏览器来源；
不配置时不允许浏览器跨域。所有推文读写接口都必须携带
`Authorization: Bearer <token>`。

数据库连接必须通过 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD` 和
`DB_NAME` 提供。OpenAI 密钥只配置在服务端的 `OPENAI_API_KEY`；浏览器脚本会调用
受 Bearer 认证保护的 `/generateReply`，不会再持有第三方密钥。可用
`OPENAI_MODEL` 覆盖默认模型。

配套的两个油猴脚本从各自的 Tampermonkey 本地存储读取 `API_AUTH_TOKEN`。安装后分别
从脚本菜单选择“配置本地 API 令牌”，输入与服务端相同的值；不要把 token 写回脚本源码。
