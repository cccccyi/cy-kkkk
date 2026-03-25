#!/usr/bin/env python
# coding: utf-8

import hashlib
import hmac
import json
import logging
import time
import threading
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GATE_API_KEY")
API_SECRET = os.getenv("GATE_API_SECRET")

# pip install -U websocket_client
from websocket import WebSocketApp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

event = threading.Event()

# 配置参数
CURRENCY_PAIR = 'HSK_USDT'
BUY_THRESHOLD = 0.459  # 价格阈值
BUY_AMOUNT = '3'  # 市价买入金额（USDT），根据需要调整
ORDER_TYPE = 'market'  # 'market' 或 'limit'；对于 limit 需要 price,  查看挂了多少单
'''
DEX 去除滑点， 去除手续费
GATE 上  最后一个挂单数量    （以此数量在 DEX计算）
第二层 - 倒数第二个挂单

设置数量 - 每次200个HSK   (挂单以最高价计算)
'''
ORDER_PLACED = False  # 标志位，避免重复下单
LOGGED_IN = False  # 登录标志

class GateWebSocketApp(WebSocketApp):

    def __init__(self, url, api_key, api_secret, **kwargs):
        super(GateWebSocketApp, self).__init__(url, **kwargs)
        self._api_key = api_key
        self._api_secret = api_secret

    def _send_ping(self):
        while not event.wait(10):
            self.last_ping_tm = time.time()
            if self.sock:
                try:
                    self.sock.ping()
                except Exception as ex:
                    logger.warning("send_ping routine terminated: {}".format(ex))
                    break
                try:
                    self._request("spot.ping", auth_required=False)
                except Exception as e:
                    raise e

    def _request(self, channel, event=None, payload=None, auth_required=True):
        current_time = int(time.time())
        data = {
            "time": current_time,
            "channel": channel,
            "event": event,
            "payload": payload,
        }
        if auth_required:
            message = 'channel=%s&event=%s&time=%d' % (channel, event, current_time)
            data['auth'] = {
                "method": "api_key",
                "KEY": self._api_key,
                "SIGN": self.get_sign(message),
            }
        data = json.dumps(data)
        logger.info('request: %s', data)
        self.send(data)

    def get_sign(self, message):
        h = hmac.new(self._api_secret.encode("utf8"), message.encode("utf8"), hashlib.sha512)
        return h.hexdigest()

    def subscribe(self, channel, payload=None, auth_required=True):
        self._request(channel, "subscribe", payload, auth_required)

    def unsubscribe(self, channel, payload=None, auth_required=True):
        self._request(channel, "unsubscribe", payload, auth_required)


def send_api_request(ws, channel, payload_dict, request_param=''):
    """
    发送 API 事件请求（如登录、下单），使用特殊签名
    """
    ts = int(time.time())
    req_id = str(int(time.time() * 1000)) + '-1'  # 示例格式
    request_param_bytes = request_param.encode('utf-8') if request_param else b''
    
    sign_str = f"api\n{channel}\n{request_param_bytes.decode('utf-8')}\n{ts}"
    sign = hmac.new(ws._api_secret.encode('utf-8'), sign_str.encode('utf-8'), hashlib.sha512).hexdigest()
    
    payload = {
        "api_key": ws._api_key,
        "signature": sign,
        "timestamp": str(ts),
        "req_id": req_id
    }
    if payload_dict:
        payload.update(payload_dict)  # 对于下单，添加其他字段
    
    data = {
        "time": ts,
        "channel": channel,
        "event": "api",
        "payload": payload
    }
    logger.info('发送 API 请求: %s', data)
    ws.send(json.dumps(data))


def place_buy_order(ws):
    global ORDER_PLACED
    if ORDER_PLACED:
        logger.info("订单已下发，跳过重复操作")
        return
    if not LOGGED_IN:
        logger.warning("未登录，无法下单")
        return

    order = {
        "currency_pair": CURRENCY_PAIR,
        "type": ORDER_TYPE,
        "account": "spot",
        "side": "buy",
        "amount": BUY_AMOUNT,  # 对于 market buy，这是 quote 金额 (USDT)
        "time_in_force": "ioc"  # 市价单必须为 ioc 或 fok
        # 如果是 limit，添加 "price": str(price)  # e.g., "0.45"
    }
    request_param_str = json.dumps(order)  # 用于签名 (JSON 字符串)
    send_api_request(ws, "spot.order_place", {"req_param": order}, request_param=request_param_str)
    ORDER_PLACED = True  # 设置标志位
    logger.info("下发买单: %s", order)


def on_message(ws, message):
    # type: (GateWebSocketApp, str) -> None
    logger.info("message received from server: {}".format(message))
    global LOGGED_IN, ORDER_PLACED
    try:
        data = json.loads(message)
        
        # 兼容处理：检查是否有 'header' 层级（API 响应如登录、下单）
        if 'header' in data:
            header = data.get('header', {})
            channel = header.get('channel')
            event_type = header.get('event')
            status = header.get('status')
            result = data.get('data', {}).get('result', {})
            error = data.get('data', {}).get('errs')  # 如果有错误
        else:
            # 非 API 响应（如 trades 更新）
            channel = data.get('channel')
            event_type = data.get('event')
            status = None  # 无 status
            result = data.get('result', {})
            error = data.get('error')  # 如果有错误
        
        if channel == "spot.login" and event_type == "api":
            if status == "200":
                LOGGED_IN = True
                logger.info("登录成功: UID %s", result.get("uid"))
                place_buy_order(ws)
            else:
                logger.error("登录失败: %s", error or data)

        elif channel == "spot.trades" and event_type == "update":
            if result.get("currency_pair") == CURRENCY_PAIR:
                price = float(result.get("price", 0))
                logger.info(f"实时成交价: {price}")
                if price < BUY_THRESHOLD:
                    place_buy_order(ws)

        elif channel == "spot.order_place" and event_type == "api":
            # 处理下单响应
            if status == "200":
                logger.info("下单成功: %s", result)
            else:
                logger.error("下单失败: %s", error or data)
                ORDER_PLACED = False  # 如果失败，重置标志允许重试

    except Exception as e:
        logger.error("消息处理错误: %s", e)


def on_open(ws):
    # type: (GateWebSocketApp) -> None
    logger.info('websocket connected')

    # 发送登录请求 (request_param 为空)
    send_api_request(ws, "spot.login", None, request_param='')

    # 订阅 trades
    ws.subscribe("spot.trades", [CURRENCY_PAIR], False)


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s - %(message)s", level=logging.DEBUG)
    app = GateWebSocketApp("wss://api.gateio.ws/ws/v4/",
                           API_KEY,
                           API_SECRET,
                           on_open=on_open,
                           on_message=on_message)
    app.run_forever(ping_interval=5)