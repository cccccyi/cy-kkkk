# file: tg_sender.py
from telethon import TelegramClient, errors
import asyncio

# 原脚本里的账号列表
accounts = {
    "account1": {  
        "session": "account1",
        "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    "account2": {
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

async def _send(account_key, target_group, message):
    if account_key not in accounts:
        print(f"账号 {account_key} 不存在！")
        return

    account = accounts[account_key]
    client = TelegramClient(account["session"], account["api_id"], account["api_hash"])
    try:
        async with client:
            await client.send_message(target_group, message)
            print(f"[{account_key}] 消息已发送")
    except errors.FloodWaitError as e:
        print(f"[{account_key}] 被限流，需要等待 {e.seconds} 秒")
    except Exception as e:
        print(f"[{account_key}] 发送失败：{e}")

# 对外同步接口
def send_message(account_key, target_group, message):
    asyncio.run(_send(account_key, target_group, message))
