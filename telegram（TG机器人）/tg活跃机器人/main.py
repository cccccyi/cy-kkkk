import json
import random
import time
from pathlib import Path
from tg_sender import send_message

JSON_FILE = Path(__file__).parent / "chat1202.json"
MIN_DELAY = 10
MAX_DELAY = 310

def set_delay(min_sec, max_sec):
    global MIN_DELAY, MAX_DELAY
    MIN_DELAY = min_sec
    MAX_DELAY = max_sec

def send_messages_from_json():
    if not JSON_FILE.exists():
        print(f"{JSON_FILE} 不存在！")
        return

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for idx, item in enumerate(data):
        if item.get("state") != 0:
            continue

        user = item.get("user")
        msg = item.get("msg")
        group = "https://t.me/hashnewsgroup"

        print(f"准备发送: {user} -> {msg}")
        try:
            send_message(user, group, msg)
            data[idx]["state"] = 1
            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[{user}] 发送成功，已更新 state=1")
        except Exception as e:
            print(f"[{user}] 发送失败: {e}")

        # 随机延迟
        delay = random.randint(MIN_DELAY, MAX_DELAY)
        print(f"等待 {delay} 秒后发送下一条消息...")
        time.sleep(delay)

if __name__ == "__main__":
    send_messages_from_json()
