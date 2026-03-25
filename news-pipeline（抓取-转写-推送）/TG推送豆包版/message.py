import logging
from openai import OpenAI
from telegram import Update
from telegram.ext import Application, MessageHandler, filters
from telegram.error import Forbidden
import pymysql
from pymysql.err import Error
from datetime import datetime
from zhconv import convert

openai_api_key = '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'
client = OpenAI(api_key=openai_api_key)
# Bot Token（Hashnews bot）
TOKEN = "8115050486:AAH33CykVD274-QLIgiX-9qJGcCPMhQs9Uc"
# Bot Token (fuDouble_bot)
# TOKEN = "8238218424:AAH0d6G6Dy9jHr-HeXIo7UXMRmZAOwYXakw"

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

async def ban_user(chat, user_id):
    try:
        await chat.ban_member(user_id)
        logger.info(f"User {user_id} banned from {chat.title}")
    except Forbidden:
        logger.error("Bot 没有权限踢人，请确保机器人是管理员并且有 'Ban Users' 权限。")
    except Exception as e:
        logger.error(f"Error banning user {user_id}: {e}")

def contains_traditional_chinese(text: str) -> bool:
    for ch in text:
        if '\u4e00' <= ch <= '\u9fff':  # 是中文
            if ch != convert(ch, 'zh-cn'):  # 如果转换成简体后不一样，说明是繁体
                return True
    return False

# 定义不符合规范的规则（自定义这里）
def is_non_compliant(message):
    print(message)
    # 转发消息直接不合规
    if message.forward_origin:
        return True
    
    message_text = message.text
    if message_text is None:
        return False
    
    forbidden_words = ['私聊', '专属客服']  # 禁止词列表
    if any(word in message_text.lower() for word in forbidden_words):
        return True
    if 'http' in message_text or 'www.' in message_text:  # 包含链接
        return True
    # 判断是否包含繁体
    if contains_traditional_chinese(message_text):
        return True
    return False

# 消息处理函数
async def handle_message(update: Update, context):
    message = update.effective_message
    if not message:
        print(message)
        return
    chat = message.chat or update.effective_chat
    chat_id = chat.id
    chat_title = chat.title
    message_id = message.id
    user = message.from_user
    user_id = user.id if user else None
    username = user.username if user else 'Unknown'
    timestamp = datetime.fromtimestamp(message.date.timestamp())  # 转换为 datetime

    # 提取话题 ID
    topic_id = message.message_thread_id if message.is_topic_message else None  # None 如果非话题消息

    # 判断消息类型并提取内容
    if message.text:
        content = message.text
        msg_type = 'text'
    elif message.photo:
        content = f"Photo ID: {message.photo[-1].file_id}"  # 存储最大尺寸图片 ID
        msg_type = 'photo'
    elif message.video:
        content = f"Video ID: {message.video.file_id}, Duration: {message.video.duration}s"
        msg_type = 'video'
    elif message.document:
        content = f"Document: {message.document.file_name}, ID: {message.document.file_id}"
        msg_type = 'document'
    elif message.voice:
        content = f"Voice ID: {message.voice.file_id}, Duration: {message.voice.duration}s"
        msg_type = 'voice'
    elif message.sticker:
        content = f"Sticker Emoji: {message.sticker.emoji}, ID: {message.sticker.file_id}"
        msg_type = 'sticker'
    elif message.location:
        content = f"Location: Lat {message.location.latitude}, Lon {message.location.longitude}"
        msg_type = 'location'
    elif message.contact:
        content = f"Contact: {message.contact.first_name}, Phone: {message.contact.phone_number}"
        msg_type = 'contact'
    else:
        content = 'Unknown content'
        msg_type = 'other'

    # 记录日志
    if message:
        logger.info(f"Received message in group {chat.title} (ID: {chat.id}) from {user.username} (Topic ID: {topic_id}): {content}")
        logger.info(message)
        # 插入数据库
        # insert_message_to_db(chat_id, chat_title, message_id, user_id, username, msg_type, content, timestamp, topic_id)

    # 判断消息是否合法应该删除
    if is_non_compliant(message):
        try:
            await message.delete()  # 删除消息
            await ban_user(chat, user.id)
            logger.info(f"Deleted non-compliant message from {message.from_user.username}")
        except Exception as e:
            logger.error(f"Error deleting message: {e}")
        return
    """
    # 生成回复，发送消息
    if message.text:
        # 使用 OpenAI 生成回复
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # 或其他模型，如 "gpt-4"
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": message.text}
                ],
                temperature=0.7,
                max_tokens=150
            )
            # 提取回复内容
            reply = response.choices[0].message.content.strip()
            # 发送回复
            # await update.message.reply_text(reply)
            await update.effective_chat.send_message(text=reply)
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            # await update.message.reply_text("抱歉，处理您的消息时出错。")
    """

def main():
    # 创建 Application
    application = Application.builder().token(TOKEN).build()
    # 添加消息处理器，监听所有文本消息（排除命令以避免重复）
    application.add_handler(MessageHandler(filters.ALL & ~filters.COMMAND, handle_message))
    # 开始轮询（polling）监听消息
    application.run_polling()

if __name__ == '__main__':
    main()
