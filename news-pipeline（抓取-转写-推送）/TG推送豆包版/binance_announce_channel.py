import re
import hashlib
from urllib.parse import urlparse, urlunparse
import pymysql
from pymysql.err import Error
from datetime import datetime
from telethon import TelegramClient, events

# 替换成你在 my.telegram.org 申请的 API ID 和 HASH
api_id = 24782983
api_hash = '6ccf2ea47ff4d011b362bd4a3d50d56e'

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

# 这里 session_name 用于保存登录状态，首次运行会让你输入验证码
client = TelegramClient('binance_channel_session_001', api_id, api_hash)

def clean_binance_url(url):
    # 1. 判断是否是合法的 Binance 公告链接
    pattern = r"^https://www\.binance\.com/[a-zA-Z-]+/support/announcement/detail/[0-9a-z]+"
    if not re.match(pattern, url):
        return None
    # 2. 解析 URL
    parsed = urlparse(url)
    # 去掉 query 参数（?后面的内容）
    clean_path = parsed.path
    # 3. en → zh-CN
    clean_path = clean_path.replace("/en/", "/zh-CN/")
    # 重新拼接 URL
    new_url = urlunparse((parsed.scheme, parsed.netloc, clean_path, "", "", ""))
    return new_url
    
def save_to_db(url):
    """保存 URL 到数据库"""
    if not url:
        return
    url_md5 = hashlib.md5(url.encode("utf-8")).hexdigest()
    sql = """
        INSERT INTO dt_news_list (new_url, new_url_md5, site, new_type)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE new_url=new_url
    """
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute(sql, (url, url_md5, "binance", "announce"))
        conn.commit()
        print(f"✅ 插入成功: {url}")
    except Error as e:
        print(f"❌ 数据库错误: {e}")
    finally:
        conn.close()    

@client.on(events.NewMessage(chats=['binance_announcements']))
#@client.on(events.NewMessage(chats=['hashnewsHongKong']))
async def handler(event):
    msg = event.message
    
    text = msg.text
    urls = []
    if msg.entities:
        for entity in msg.entities:
            if hasattr(entity, 'url') and entity.url:
                urls.append(entity.url)
            else:
                # 普通链接
                urls.append(text[entity.offset:entity.offset + entity.length])

    print("提取到的链接：", urls)
    for url in urls:
        url = clean_binance_url(url)
        if clean_url:
            save_to_db(url)

async def main():
    # 获取最近 2 条历史消息
    async for message in client.iter_messages('binance_announcements', limit=2):
        if not message.text:
            continue
        text = message.text
        urls = []
        if message.entities:
            for entity in message.entities:
                if hasattr(entity, 'url') and entity.url:
                    urls.append(entity.url)
                else:
                    # 普通链接
                    urls.append(text[entity.offset:entity.offset + entity.length])

        print("提取到的链接:", urls)
        print("-" * 50)
        for url in urls:
            url = clean_binance_url(url)
            save_to_db(url)

with client:
    #client.loop.run_until_complete(main())
    client.run_until_disconnected()