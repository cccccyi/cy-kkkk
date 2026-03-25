import random
import logging
from openai import OpenAI
from telethon import TelegramClient, events
import pymysql
from pymysql.err import Error
from datetime import datetime

# 替换为你的值
openai_api_key = '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'
# 多个 TG 账号配置（使用列表存储，每个账号包括 api_id, api_hash, session_name, prompt）
tg_accounts = [
    {
        # @hsx4224 账号  183手机号注册
        'api_id': 24782983,
        'api_hash': '6ccf2ea47ff4d011b362bd4a3d50d56e',
        'session_name': 'tg_session_001',
        'prompt': '你是一位运营Telegram平台区块链媒体账号的社交媒体专家。已知对方账号最新发布的一条消息,生成一条合适的评论。'
                  '### **要求**'
                  '1. **符合我方财经Web3类账号的风格，专业深度**。'
                  '2. **贴合对方消息内容，与对方就内容进行互动，表达正面，支持鼓励**。'
                  '3. **语言风趣幽默或搞笑，可以适当使用网络流行词语，控制在8字以内。'
                  '4. **避免AI感（如过于正式或模板化表达），模仿人类日常用语**。'
                  '5. **如果对方推文有关政治内容，则只随机回复三个表情**，可以使用空格。'
                  '6. **不要使用标点符号 不要使用疑问句**。'
    },
    {
        # @coinchong 账号 167手机号注册
        'api_id': 18948044,
        'api_hash': '6031891fcc935cebfe7bcffeb7263761',
        'session_name': 'tg_session_coinchong',
        'prompt': '你是一位运营Telegram平台区块链媒体账号的社交媒体专家。已知对方账号最新发布的一条消息,生成一条合适的评论。'
                  '### **要求**'
                  '1. **符合我方财经Web3类账号的风格，专业深度**。'
                  '2. **贴合对方消息内容，与对方就内容进行互动，善于使用辛辣且幽默语言风格**。'
                  '3. **语言风趣幽默或搞笑，可以适当使用网络流行词语，控制在8字以内。'
                  '4. **避免AI感（如过于正式或模板化表达），模仿人类日常用语**。'
                  '5. **如果对方推文有关政治内容，则只随机回复三个表情**，可以使用空格。'
                  '6. **不要使用标点符号 不要使用疑问句**。'
        # 'prompt': '你是一个虚拟货币，加密圈的理性，强势派，善于使用辛辣且幽默语言风格，消息长度不超过20字。'  # 另一个固定风格
    },
    # 添加更多账号...
]
# 指定监听的群组 ID（替换为实际值）
# 测试群组001  -1002820520896
# 哈世链闻交流群   -1002548885419
group_ids = [-1002820520896, -1002548885419]

openai_client = OpenAI(api_key=openai_api_key)
# 创建多个客户端
clients = []
for acc in tg_accounts:
    client = TelegramClient(acc['session_name'], acc['api_id'], acc['api_hash'])
    clients.append({'client': client, 'prompt': acc['prompt']})


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

# 设置日志（可选，便于调试）
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库插入函数
def insert_message_to_db(chat_id, chat_title, message_id, user_id, username, message_type, content, timestamp, topic_id):
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            query = """
            INSERT INTO dt_telegram_messages 
            (chat_id, chat_title, message_id, user_id, username, message_type, content, timestamp, topic_id) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (chat_id, chat_title, message_id, user_id, username, message_type, content, timestamp, topic_id)
            cursor.execute(query, values)
        conn.commit()
        logger.info(f"Message {message_id} inserted into DB successfully.")
    except Error as e:
        logger.error(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

# 生成回复使用 OpenAI
def generate_reply(prompt, message_content):
    response = openai_client.chat.completions.create(
        model="gpt-4o",  # 或使用 gpt-4 等模型
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": message_content}
        ],
        temperature=0.7,
        max_tokens=150
    )
    return response.choices[0].message.content.strip()

# 事件处理函数
async def handler(event):
    # 提取字段
    chat_id = event.chat_id
    message_id = event.message.id
    # 获取聊天标题
    chat = await event.get_chat()
    chat_title = chat.title if hasattr(chat, 'title') else None
    # 获取发送者
    sender = await event.get_sender()
    user_id = sender.id if sender else None
    username = sender.username if sender else None
    # 消息类型
    if event.message.text:
        message_type = 'text'
    elif event.message.photo:
        message_type = 'photo'
    elif event.message.video:
        message_type = 'video'
    elif event.message.document:
        message_type = 'document'
    else:
        message_type = 'other'
    # 内容
    content = event.message.text or str(event.message.media) or ''
    # 时间戳（转换为字符串或 Unix 时间戳，根据需要）
    timestamp = datetime.fromtimestamp(event.message.date.timestamp())  # Unix 时间戳
    # 主题 ID
    topic_id = None
    if event.message.reply_to and event.message.reply_to.forum_topic:
        topic_id = event.message.reply_to.reply_to_top_id or event.message.reply_to.reply_to_msg_id
    logger.info(
        f"Received message in group {chat.title} (ID: {chat.id}) from {username} (Topic ID: {topic_id}): {content}")
    # 插入数据库
    insert_message_to_db(chat_id, chat_title, message_id, user_id, username, message_type, content, timestamp, topic_id)

    # 生成回复，发送消息
    # 'hashnewsHongKong'
    if message_type == 'text' and content and username not in ['HashNewsHKbot', 'hsx4224', 'coinchong']:
        # 随机选择一个账号（客户端）进行回复
        selected = random.choice(clients)
        selected_client = selected['client']
        selected_prompt = selected['prompt']

        # 使用 OpenAI 生成回复
        reply = generate_reply(selected_prompt, content)
        # 发送回复
        if topic_id and topic_id != 1:
            await selected_client.send_message(event.chat_id, reply, reply_to=topic_id)
        else:
            await selected_client.send_message(event.chat_id, reply)

# 选择第一个客户端作为监听客户端
main_client = clients[0]['client']
@main_client.on(events.NewMessage(chats=group_ids))
async def main_handler(event):
    await handler(event)

# 启动所有客户端
for cl in clients:
    cl['client'].start()

client.run_until_disconnected()