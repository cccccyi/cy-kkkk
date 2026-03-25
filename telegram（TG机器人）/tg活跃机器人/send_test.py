from telethon import TelegramClient, errors
import asyncio

# 多个账号信息，列表里每个字典是一个账号
accounts = [
    {
        "session": "account1",
        "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    {
        "session": "account2",
        "api_id": 30778497,
        "api_hash": "33832f8b054cbcacade8a93dfd440c3c"
    },
    # 可以继续添加更多账号
]

# 目标群组
target_group = 'https://t.me/autochat1234567'  # 或 '@groupusername' 或群ID
message = 'Hello，多账号测试消息！'

async def send_with_account(account):
    client = TelegramClient(account["session"], account["api_id"], account["api_hash"])
    try:
        async with client:
            await client.send_message(target_group, message)
            print(f"{account['session']} 消息已发送！")
    except errors.FloodWaitError as e:
        print(f"{account['session']} 被限流，需要等待 {e.seconds} 秒")
    except Exception as e:
        print(f"{account['session']} 发送失败：{e}")

async def main():
    tasks = []
    for account in accounts:
        tasks.append(send_with_account(account))
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
