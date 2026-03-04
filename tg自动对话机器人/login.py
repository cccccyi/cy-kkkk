# -*- coding: utf-8 -*-
from telethon import TelegramClient
import sys
import asyncio

# 账号配置列表，每个账号一个字典
accounts = {
    "account1": {
        "name": "xiaohao1",
        "session": "account1",
        "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    "account2": {
        "name": "xiaohao2",
        "session": "account2",
         "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    "account3": {
        "name": "xiaohao3",
        "session": "account3",
         "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    "account4": {
        "name": "xiaohao4",
        "session": "account4",
         "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    # 可以继续添加更多账号
}

async def login(account):
    client = TelegramClient(account["session"], account["api_id"], account["api_hash"])
    async with client:
        print(f"{account['name']} 登录成功，session 已保存为 {account['session']}.session")
        print("以后可以直接用这个 session 来发消息，无需再输入验证码")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python login_user.py <账号编号>")
        print("可用账号: ", ", ".join(accounts.keys()))
        sys.exit(1)

    account_key = sys.argv[1]
    if account_key not in accounts:
        print("指定账号不存在，可用账号: ", ", ".join(accounts.keys()))
        sys.exit(1)

    account = accounts[account_key]
    asyncio.run(login(account))
