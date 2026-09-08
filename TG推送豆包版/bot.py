import asyncio
import os

def require_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value
import pymysql
import datetime
from telegram.ext import ApplicationBuilder, CommandHandler

# Telegram 配置
TOKEN = require_env('TELEGRAM_BOT_TOKEN')
#CHANNEL_ID = "@hashnews1"
CHANNEL_ID = "@hashnewsHongKong"
GROUP_ID = '-1002548885419'
TOPIC_ID_ZH = 5
TOPIC_ID_EN = 9
application = None

# 数据库配置
DB_CONFIG = {
    "host": "154.219.101.126",
    "port": 3076,
    "user": "block_chain",
    "password": require_env('DB_PASSWORD'),
    "database": "block_chain",
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor
}

async def send_telegram_message(msg, msg_en):
    try:
        from telegram import Bot
        bot = Bot(token=TOKEN)
        await bot.send_message(chat_id=CHANNEL_ID, text=msg, parse_mode='HTML')
        print("✅ 已发送消息")
    except Exception as e:
        print(f"❌ 发送失败: {e}")

async def process_messages():
    # 连接数据库
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            # 获取 tg_sent 为 0 的记录
            select_sql = "SELECT id, rewritten_title, rewritten_desc, created_at FROM panews_flash WHERE tg_sent = 0"
            cursor.execute(select_sql)
            rows = cursor.fetchall()
            for row in rows:
                # 格式化时间
                time_str = row['created_at'].strftime("%Y-%m-%d %H:%M:%S") if hasattr(row['created_at'], 'strftime') else str(row['created_at'])
                # 构建消息，只包含标题和内容，去掉所有超链接
                msg = (
                    f"\U0001f525  "
                    f"<b>{row['rewritten_title']}（{time_str}）</b>\n\n"
                    f"{row['rewritten_desc']}\n"
                )
                print(msg)
                # 只发送中文消息，因为数据来自 panews_flash 表
                await send_telegram_message(msg, "")
                # 更新该记录为已发送
                update_sql = "UPDATE panews_flash SET tg_sent = 1 WHERE id = %s"
                cursor.execute(update_sql, (row['id'],))
            connection.commit()
    except Exception as e:
        print(e)
        print(f"❌ 数据库操作失败: {e}")
        connection.rollback()
    finally:
        connection.close()

async def main_loop():
    while True:
        print("检查是否有新消息待发送...")
        await process_messages()
        await asyncio.sleep(5)  # 间隔 20 秒再次检查

# 启动
asyncio.run(main_loop())
