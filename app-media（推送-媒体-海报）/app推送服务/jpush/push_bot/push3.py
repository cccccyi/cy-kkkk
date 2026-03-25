# -*- coding: utf-8 -*-
import asyncio
import pymysql
import datetime
from conf import app_key, master_secret
import jpush

# 初始化 JPush
_jpush = jpush.JPush(app_key, master_secret)
_jpush.set_logging("DEBUG")  # 保留极光调试日志

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

last_push_time = None


def simple_truncate_to_bytes(s: str, max_bytes: int = 3584, encoding: str = 'utf-8', suffix: str = '...') -> str:
    """按字节截断字符串，末尾加省略号"""
    encoded = s.encode(encoding)
    if len(encoded) <= max_bytes:
        return s

    suffix_bytes = len(suffix.encode(encoding))
    effective_max = max_bytes - suffix_bytes
    truncated = s
    while len(truncated.encode(encoding)) > effective_max and truncated:
        truncated = truncated[:-1]

    return truncated + suffix


def audience_registration_ids(title, content, uniqCode, registration_ids, batch_index):
    """推送给指定 registration_ids，打印精简信息"""
    push = _jpush.create_push()
    push.audience = jpush.audience({"registration_id": registration_ids})

    ios_msg = jpush.ios(
        alert={"title": title, "body": content},
        badge="+1",
        extras={'newsid': uniqCode}
    )
    android_msg = jpush.android(alert=title)

    push.notification = jpush.notification(android=android_msg, ios=ios_msg)
    push.platform = jpush.all_

    # 仅打印批次号、数量、标题、内容前40字
    print(f"\n📤 正在推送 - 批次 {batch_index}，数量 {len(registration_ids)}")
    print(f"📄 标题: {title}")
    print(f"📝 内容前40字: {content[:40]}...\n")

    return push.send()


def chunk_list(data, size):
    """把列表按 size 分片"""
    for i in range(0, len(data), size):
        yield data[i:i + size]


def process_messages():
    global last_push_time

    current_time = datetime.datetime.now()

    # 连接数据库
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            # 获取待推送新闻
            select_sql = """
                SELECT id, unique_code, title, detail_content, publish_time
                FROM dt_hash_news_list
                WHERE id>=11970 
                AND push_flag='y' AND push_status='i'
                ORDER BY id
            """
            cursor.execute(select_sql)
            rows = cursor.fetchall()

            if len(rows) == 0:
                print("没有待推送的新闻")
                return

            # 获取所有设备 ID
            cursor.execute("SELECT registration_id FROM tb_app_device_list")
            results = cursor.fetchall()
            all_registration_ids = [row['registration_id'] for row in results]

            # 分批，每次 900 个
            registration_batches = list(chunk_list(all_registration_ids, 900))

            for row in rows:
                content = row['detail_content']
                truncated_content = simple_truncate_to_bytes(content, max_bytes=3000)

                push_success = True  # 记录所有批次成功与否

                # 按批次发送
                for idx, batch in enumerate(registration_batches, start=1):
                    try:
                        response = audience_registration_ids(
                            row['title'],
                            truncated_content,
                            row['unique_code'],
                            batch,
                            idx  # 批次号
                        )

                        print(f"✅ 批次 {idx} 推送成功（{len(batch)} 人）")

                    except Exception as e:
                        push_success = False
                        print(f"❌ 批次 {idx} 推送失败: {e}")
                        break

                # 全部批次成功才更新状态
                if push_success:
                    last_push_time = current_time
                    update_sql = "UPDATE dt_hash_news_list SET push_status = 's' WHERE id = %s"
                    cursor.execute(update_sql, (row['id'],))
                    connection.commit()
                    print(f"🎯 新闻 {row['id']} 推送完成并更新状态")

    except Exception as e:
        print(f"❌ 数据库操作失败: {e}")
        connection.rollback()

    finally:
        connection.close()


async def main_loop():
    while True:
        print("检查是否有待推送的新闻...")
        process_messages()
        await asyncio.sleep(10)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main_loop())
    except KeyboardInterrupt:
        print("程序终止")
    finally:
        loop.close()
