import asyncio
import pymysql
import datetime
from telegram import Bot



# Telegram 配置
#TOKEN = "7780468539:AAHilJtUvTPebih0kHiJkn2wTf6kcND9MI4"
TOKEN = "8115050486:AAH33CykVD274-QLIgiX-9qJGcCPMhQs9Uc"
#CHANNEL_ID = "@hashnews1"
CHANNEL_ID = "@hashnewsHongKong"
GROUP_ID = '-1002548885419'
TOPIC_ID_ZH = 5
bot = Bot(token=TOKEN)

# 数据库配置
DB_CONFIG = {
    "host": "82.157.161.88",
    "port": 3306,
    "user": "root",
    "password": "HSXpwd@123",
    "database": "block_chain",
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor
}

async def send_telegram_message(msg):
    try:
        # await bot.send_message(chat_id=CHANNEL_ID, text=msg, parse_mode='HTML')
        await bot.send_message(chat_id=GROUP_ID, message_thread_id=TOPIC_ID_ZH, text=msg, parse_mode='HTML')
        print("✅ 已发送消息")
    except Exception as e:
        print(f"❌ 发送失败: {e}")

async def process_messages():
    # 连接数据库
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            # 获取 tg_status 为 'i' 的记录
            select_sql = "SELECT id, unique_code, title, publish_time, content, detail_content FROM dt_hash_news_list WHERE id>8710 and tg_status = 'i'"
            cursor.execute(select_sql)
            rows = cursor.fetchall()

            for row in rows:
                # 将 Unix 秒时间戳转为 datetime 格式
                dt = datetime.datetime.fromtimestamp(row['publish_time'])
                time_str = dt.strftime("%Y-%m-%d %H:%M:%S")  # 格式化时间
                #msg = f"\U0001f525  <a href='https://hashnews.pro/news?code={row[\"unique_code\"]}'>{row['title']}（{time_str}）</a>\n\n{row['content']}"
                msg = (
                    f"\U0001f525  "
                    f"<a href='https://hashnews.pro/news?code={row['unique_code']}'>"
                    f"<b>{row['title']}（{time_str}）</b></a>\n\n"
                    f"{row['detail_content']}"
                )
                print(msg) 
                await send_telegram_message(msg)

                # 更新该记录为已发送
                update_sql = "UPDATE dt_hash_news_list SET tg_status = 's' WHERE id = %s"
                cursor.execute(update_sql, (row['id'],))

            connection.commit()

    except Exception as e:
        print(e)
        print(f"❌ 数据库操作失败: {e}")
        connection.rollback()
    finally:
        connection.close()

async def main_loop():
    msg = "测试消息"
    print(msg)
    await send_telegram_message(msg)
    return
    while True:
        print("检查是否有新消息待发送...")
        await process_messages()
        await asyncio.sleep(20)  # 间隔 20 秒再次检查

# 启动
asyncio.run(main_loop())
