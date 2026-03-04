# -*- coding: utf-8 -*-
import asyncio
import pymysql
import datetime
from conf import app_key, master_secret
import jpush

_jpush = jpush.JPush(app_key, master_secret)
_jpush.set_logging("DEBUG")

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

# 记录最后推送时间（初始为 None）
last_push_time = None


def simple_truncate_to_bytes(s: str, max_bytes: int = 3584, encoding: str = 'utf-8', suffix: str = '...') -> str:
    """
    简单截断字符串，使其编码后的字节长度不超过 max_bytes。
    如果超过，从末尾逐步移除字符，并添加后缀。
    建议 max_bytes 设为 3000 以留缓冲（考虑其他payload部分）。
    """
    encoded = s.encode(encoding)
    if len(encoded) <= max_bytes:
        return s
    
    # 预留后缀空间
    suffix_bytes = len(suffix.encode(encoding))
    effective_max = max_bytes - suffix_bytes
    
    # 逐步截断
    truncated = s
    while len(truncated.encode(encoding)) > effective_max and truncated:
        truncated = truncated[:-1]  # 移除最后一个字符
    
    return truncated + suffix if len(truncated) < len(s) else truncated

def audience_registration_ids(title, content, uniqCode, registration_ids):
    push = _jpush.create_push()

    registration_ids = {"registration_id": registration_ids}
    push.audience = jpush.audience(
                registration_ids
            )
    ios_msg = jpush.ios(alert={"title": title, "body": content}, badge="+1", extras={'newsid': uniqCode})
    android_msg = jpush.android(alert=title)
    push.notification = jpush.notification(android=android_msg, ios=ios_msg)
    push.platform = jpush.all_
    print (push.payload)
    return push.send()

def process_messages():
    global last_push_time
    # 检查上次推送时间
    current_time = datetime.datetime.now()
    # if last_push_time is not None:
    #     time_diff = (current_time - last_push_time).total_seconds()
    #     if time_diff < 900:  # 小于 15 分钟（900 秒）
    #         print(f"距离上次推送仅 {time_diff:.2f} 秒，需等待 {900 - time_diff:.2f} 秒")
    #         return

    # 连接数据库
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            registration_ids = []
            # 获取 tg_status 为 'i' 的记录
            select_sql = "SELECT id, unique_code, title, detail_content, publish_time FROM dt_hash_news_list WHERE id>=11970 and push_flag = 'y' and push_status='i' order by id"
            cursor.execute(select_sql)
            rows = cursor.fetchall()
            if len(rows) > 0:
                sql = "SELECT registration_id FROM tb_app_device_list"
                cursor.execute(sql)
                # 获取所有结果
                results = cursor.fetchall()
                # 提取 registration_id 并存储到列表
                registration_ids = [row['registration_id'] for row in results]

            # registration_ids = ["1114a897939547f45a3"]
            for row in rows:
                # 将 Unix 秒时间戳转为 datetime 格式
                dt = datetime.datetime.fromtimestamp(row['publish_time'])
                time_str = dt.strftime("%Y-%m-%d %H:%M:%S")  # 格式化时间
                content = row['detail_content']
                truncated_content = simple_truncate_to_bytes(content, max_bytes=3000)
                response = audience_registration_ids(row['title'], truncated_content, row['unique_code'], registration_ids)
                payload = response.payload
                if payload['msg_id'] is not None:
                    last_push_time = current_time
                    # 更新该记录为已发送
                    update_sql = "UPDATE dt_hash_news_list SET push_status = 's' WHERE id = %s"
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
        print("检查是否有待推送的新闻...")
        process_messages()
        await asyncio.sleep(10)  # 间隔 30 秒再次检查

# 启动
# asyncio.run(main_loop())

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main_loop())
    except KeyboardInterrupt:
        print("程序终止")
    finally:
        loop.close()
