#!/usr/bin/env python
# coding: utf-8

import hashlib
import hmac
import json
import logging
import time
import os
from decimal import Decimal, getcontext
import asyncio
from collections import defaultdict
from sortedcontainers import SortedList
import aiohttp
from dotenv import load_dotenv

# 提升精度
getcontext().prec = 60

# 加载环境变量
load_dotenv()
API_KEY = os.getenv("GATE_API_KEY")
API_SECRET = os.getenv("GATE_API_SECRET")

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 交易对和常量
CURRENCY_PAIR = 'HSK_USDT'
REST_API_URL = 'https://api.gateio.ws/api/v4'
WS_URL = 'wss://api.gateio.ws/ws/v4/'

class SimpleRingBuffer(object):
    """简单的环形缓冲区，用于缓存订单簿更新"""
    def __init__(self, size: int):
        self.max = size
        self.data = []
        self.cur = 0

    class __Full:
        # 避免IDE警告提示
        max: int
        data: list
        cur: int

        def append(self, x):
            self.data[self.cur] = x
            self.cur = (self.cur + 1) % self.max

        def __iter__(self):
            for i in itertools.chain(range(self.cur, self.max), range(self.cur)):
                yield self.data[i]

        def get(self, idx):
            return self.data[(self.cur + idx) % self.max]

        def __getitem__(self, item):
            if isinstance(item, int):
                return self.get(item)
            return (self.data[self.cur:] + self.data[:self.cur]).__getitem__(item)

        def __len__(self):
            return self.max

    def __iter__(self):
        for i in self.data:
            yield i

    def append(self, x):
        self.data.append(x)
        if len(self.data) == self.max:
            self.cur = 0
            # 永久地将self的类从非满改为满
            self.__class__ = self.__Full

    def get(self, idx):
        return self.data[idx]

    def __getitem__(self, item):
        return self.data.__getitem__(item)

    def __len__(self):
        return len(self.data)

class OrderBookEntry(object):
    """订单簿条目类"""
    def __init__(self, price, amount):
        self.price = Decimal(price)
        self.amount = Decimal(amount)

    def __eq__(self, other):
        return self.price == other.price

    def __lt__(self, other):
        return self.price < other.price

    def __str__(self):
        return f'(价格: {self.price}, 数量: {self.amount})'

class GateOps:
    """Gate交易所操作类"""
    def __init__(self, api_key=None, api_secret=None, currency_pair=CURRENCY_PAIR):
        self.api_key = api_key or API_KEY
        self.api_secret = api_secret or API_SECRET
        self.currency_pair = currency_pair
        self.trading_fee_rate = Decimal('0.002')  # 默认交易费率0.2%
        
        # 订单簿相关属性
        self._order_book = None  # 当前订单簿
        self._ob_update_queue = asyncio.Queue(maxsize=500)  # 订单簿更新队列
        self._ob_update_buffer = SimpleRingBuffer(size=500)  # 订单簿更新缓存
        self._ws_connection = None  # WebSocket连接
        self._running = False  # 运行状态标志
        
        # 检查API密钥
        if not self.api_key or not self.api_secret:
            logger.warning("API密钥未设置，将无法执行需要身份验证的操作")
    
    async def start_ws(self):
        """启动WebSocket连接并开始维护订单簿"""
        if self._running:
            logger.info("WebSocket已经在运行中")
            return
        
        self._running = True
        
        # 启动订单簿维护任务
        asyncio.create_task(self._maintain_order_book())
        
        # 连接WebSocket
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(WS_URL) as ws:
                    self._ws_connection = ws
                    logger.info("WebSocket连接已建立")
                    
                    # 订阅订单簿更新频道
                    subscribe_msg = {
                        "time": int(time.time()),
                        "channel": "spot.order_book_update",
                        "event": "subscribe",
                        "payload": [self.currency_pair, "100ms"]
                    }
                    await ws.send_json(subscribe_msg)
                    logger.info(f"已订阅 {self.currency_pair} 订单簿更新频道")
                    
                    # 处理WebSocket消息
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await self._handle_ws_message(msg.data)
                        elif msg.type == aiohttp.WSMsgType.CLOSED:
                            logger.warning("WebSocket连接已关闭")
                            break
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            logger.error(f"WebSocket错误: {ws.exception()}")
                            break
        except Exception as e:
            logger.error(f"WebSocket连接发生错误: {e}")
        finally:
            self._running = False
            self._ws_connection = None
    
    async def stop_ws(self):
        """停止WebSocket连接"""
        if not self._running or not self._ws_connection:
            logger.info("WebSocket未运行")
            return
        
        try:
            # 取消订阅
            unsubscribe_msg = {
                "time": int(time.time()),
                "channel": "spot.order_book_update",
                "event": "unsubscribe",
                "payload": [self.currency_pair, "100ms"]
            }
            await self._ws_connection.send_json(unsubscribe_msg)
            await asyncio.sleep(0.5)  # 给时间发送取消订阅消息
            
            # 关闭连接
            await self._ws_connection.close()
            self._running = False
            self._ws_connection = None
            logger.info("WebSocket连接已停止")
        except Exception as e:
            logger.error(f"停止WebSocket连接时发生错误: {e}")
    
    async def _handle_ws_message(self, message):
        """处理WebSocket消息"""
        try:
            data = json.loads(message)
            
            # 检查是否是订单簿更新消息
            if data.get('channel') == 'spot.order_book_update' and data.get('event') == 'update':
                result = data.get('result', {})
                if result.get('s') == self.currency_pair:
                    # 缓存更新并放入队列
                    self._cache_order_book_update(result)
                    await self._ob_update_queue.put(result)
        except Exception as e:
            logger.error(f"处理WebSocket消息时发生错误: {e}")


    async def get_balance(self, currency=None):
        """获取指定币种的余额，默认获取USDT和HSK余额
        参数:
            currency: 指定的币种，如'USDT'或'HSK'，为空则返回所有支持币种余额
        返回:
            dict: 包含币种和对应余额的字典
        """
        if not self.api_key or not self.api_secret:
            logger.error("API密钥未设置，无法获取账户余额")
            return None

        # 发送获取余额请求
        result = await self._send_private_request('spot/accounts', method='GET')
        
        # 检查结果类型和状态
        if not result:
            logger.error("获取余额失败，返回结果为空")
            return None
        
        # 检查是否为错误响应
        if isinstance(result, dict) and 'message' in result:
            logger.error(f"获取余额失败: {result['message']}")
            return None
        
        # 确保结果是可迭代的列表
        if not isinstance(result, list):
            logger.error(f"获取余额失败，返回格式错误: {result}")
            return None
        
        # 处理返回的余额数据
        balances = {}
        for item in result:
            if not isinstance(item, dict):
                continue
            
            coin = item.get('currency')
            available = float(item.get('available', 0))
            frozen = float(item.get('frozen', 0))
            total = available + frozen
            
            balances[coin] = {
                'available': available,
                'frozen': frozen,
                'total': total
            }
        
        # 如果指定了币种，只返回该币种的余额
        if currency:
            if currency in balances:
                return balances[currency]
            else:
                logger.warning(f"未找到币种 {currency} 的余额")
                return {'available': 0, 'frozen': 0, 'total': 0}
        
        # 特别提取USDT和HSK的可用余额，方便搬砖操作使用
        usdt_balance = balances.get('USDT', {'available': 0, 'frozen': 0, 'total': 0})
        hsk_balance = balances.get('HSK', {'available': 0, 'frozen': 0, 'total': 0})
        
        return {
            'usdt': usdt_balance['available'],
            'hsk': hsk_balance['available'],
            'all_balances': balances
        }
    
    def _cache_order_book_update(self, ws_update):
        """缓存订单簿更新"""
        if len(self._ob_update_buffer) > 0:
            last_id = self._ob_update_buffer[-1]['u']
            if ws_update['u'] < last_id:
                # 忽略旧消息
                return
            if ws_update['U'] != last_id + 1:
                # 更新消息不连续，重建缓存
                self._ob_update_buffer = SimpleRingBuffer(size=100)
        self._ob_update_buffer.append(ws_update)
    
    async def _maintain_order_book(self):
        """维护本地订单簿"""
        while self._running:
            # 构建基础订单簿
            self._order_book = await self._construct_base_order_book()
            if not self._order_book:
                await asyncio.sleep(1)  # 构建失败，等待后重试
                continue
            
            logger.info(f"成功构建基础订单簿，ID: {self._order_book['update_id']}")
            
            # 处理订单簿更新
            while self._running:
                try:
                    # 从队列获取更新，设置超时以便检查运行状态
                    update = await asyncio.wait_for(self._ob_update_queue.get(), timeout=1.0)
                    self._update_order_book(update)
                    self._ob_update_queue.task_done()
                except asyncio.TimeoutError:
                    # 超时，检查运行状态
                    continue
                except ValueError as e:
                    logger.error(f"更新订单簿失败: {e}")
                    # 重建订单簿
                    break
                except Exception as e:
                    logger.error(f"处理订单簿更新时发生错误: {e}")
    
    async def _construct_base_order_book(self):
        """构建基础订单簿"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f'{REST_API_URL}/spot/order_book'
                params = {'currency_pair': self.currency_pair, 'limit': 100, 'with_id': 'true'}
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"获取基础订单簿失败: {await response.text()}")
                        return None
                    
                    data = await response.json()
                    
                    # 构建订单簿数据结构
                    asks = SortedList([OrderBookEntry(price, amount) for price, amount in data['asks']])
                    bids = SortedList([OrderBookEntry(price, amount) for price, amount in data['bids']], key=lambda x: -x.price)
                    
                    order_book = {
                        'asks': asks,
                        'bids': bids,
                        'update_id': data.get('id'),
                        'timestamp': data.get('time')
                    }
                    
                    # 使用缓存的更新来恢复本地订单簿
                    for update in self._ob_update_buffer:
                        try:
                            self._update_order_book(update, order_book)
                        except ValueError:
                            # 更新失败，停止应用缓存
                            break
                    
                    return order_book
        except Exception as e:
            logger.error(f"构建基础订单簿时发生错误: {e}")
            return None
    
    def _update_order_book(self, ws_update, order_book=None):
        """更新订单簿"""
        if order_book is None:
            order_book = self._order_book
            if not order_book:
                raise ValueError("订单簿未初始化")
        
        # 检查更新的ID是否有效
        if ws_update['u'] < order_book['update_id'] + 1:
            # 忽略旧消息
            return
        if ws_update['U'] > order_book['update_id'] + 1:
            raise ValueError(f"基础订单簿ID {order_book['update_id']} 落后于更新范围 {ws_update['U']}-{ws_update['u']}")
        
        # 更新卖单
        for ask in ws_update['a']:
            price, amount = Decimal(ask[0]), Decimal(ask[1])
            entry = OrderBookEntry(price, amount)
            
            if amount == Decimal('0'):
                # 数量为0，移除价格
                if entry in order_book['asks']:
                    order_book['asks'].remove(entry)
            else:
                # 更新或添加价格
                if entry in order_book['asks']:
                    # 找到并更新数量
                    idx = order_book['asks'].index(entry)
                    order_book['asks'][idx].amount = amount
                else:
                    # 添加新价格
                    order_book['asks'].add(entry)
        
        # 更新买单
        for bid in ws_update['b']:
            price, amount = Decimal(bid[0]), Decimal(bid[1])
            entry = OrderBookEntry(price, amount)
            
            if amount == Decimal('0'):
                # 数量为0，移除价格
                if entry in order_book['bids']:
                    order_book['bids'].remove(entry)
            else:
                # 更新或添加价格
                if entry in order_book['bids']:
                    # 找到并更新数量
                    idx = order_book['bids'].index(entry)
                    order_book['bids'][idx].amount = amount
                else:
                    # 添加新价格
                    order_book['bids'].add(entry)
        
        # 更新订单簿ID
        order_book['update_id'] = ws_update['u']
        order_book['timestamp'] = ws_update.get('T')
        
        # 检查订单簿价格重叠
        if len(order_book['asks']) > 0 and len(order_book['bids']) > 0:
            if order_book['asks'][0].price <= order_book['bids'][0].price:
                raise ValueError(f"价格重叠，最低卖价 {order_book['asks'][0].price} 不大于最高买价 {order_book['bids'][0].price}")
    
    def get_current_order_book(self):
        """获取当前维护的订单簿副本"""
        return self._order_book
    
    async def get_order_book(self, limit=100):
        """获取当前订单簿（REST API方式）"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f'{REST_API_URL}/spot/order_book'
                params = {'currency_pair': self.currency_pair, 'limit': limit}
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"获取订单簿失败: {await response.text()}")
                        return None
                    
                    data = await response.json()
                    
                    # 构建订单簿数据结构
                    asks = SortedList([OrderBookEntry(price, amount) for price, amount in data['asks']])
                    # 卖单按价格从低到高排序
                    bids = SortedList([OrderBookEntry(price, amount) for price, amount in data['bids']], key=lambda x: -x.price)
                    # 买单按价格从高到低排序
                    
                    self._order_book = {
                        'asks': asks,
                        'bids': bids,
                        'timestamp': data.get('time'),
                        'update_id': data.get('id')
                    }
                    
                    return self._order_book
        except Exception as e:
            logger.error(f"获取订单簿时发生错误: {e}")
            return None
    
    def calculate_trade_cost(self, amount_hsk, is_buy=True):
        """
        计算买入/卖出指定数量HSK所花费的交易费和得到的目标代币
        参数:
            amount_hsk: 要买入/卖出的HSK数量
            is_buy: 是否为买入操作
            
        返回:
            dict: 包含总成本、交易费和实际获得的代币数量
        """
        if not self._order_book:
            logger.error("订单簿未初始化，请先调用get_order_book或启动WebSocket连接")
            return None
        
        try:
            amount = Decimal(amount_hsk)
            remaining_amount = amount
            total_cost = Decimal('0')
            order_book_side = self._order_book['asks'] if is_buy else self._order_book['bids']
            
            # 计算滑点成本
            for entry in order_book_side:
                if remaining_amount <= 0:
                    break
                
                entry_amount = Decimal(entry.amount)
                trade_amount = min(remaining_amount, entry_amount)
                if is_buy:
                    # 买入HSK，花费USDT
                    cost = trade_amount * entry.price
                    total_cost += cost
                else:
                    # 卖出HSK，获得USDT
                    revenue = trade_amount * entry.price
                    total_cost += revenue
                
                remaining_amount -= trade_amount
            
            if remaining_amount > 0:
                logger.warning(f"订单簿深度不足，无法完全成交 {remaining_amount} HSK")
            
            # 计算交易费
            trading_fee = total_cost * self.trading_fee_rate
            
            # 计算实际获得的代币数量
            if is_buy:
                # 买入HSK，实际获得的HSK数量（扣除滑点后的数量）
                actual_hsk = amount
                actual_usdt = total_cost + trading_fee  # 总成本（包括交易费）
            else:
                # 卖出HSK，实际获得的USDT数量（扣除交易费）
                actual_usdt = total_cost - trading_fee
                actual_hsk = amount
            
            return {
                'total_cost': float(total_cost),
                'trading_fee': float(trading_fee),
                'actual_hsk': float(actual_hsk),
                'actual_usdt': float(actual_usdt),
                'filled': float(amount - remaining_amount),
                'remaining': float(remaining_amount)
            }
        except Exception as e:
            logger.error(f"计算交易成本时发生错误: {e}")
            return None
    
    async def place_order(self, amount, price=None, is_buy=True, order_type='market'):
        """
        实现交易下单
        
        参数:
            amount: 交易数量
            price: 限价单价格，市价单可不填
            is_buy: 是否为买入操作
            order_type: 订单类型 'market' 或 'limit'
            
        返回:
            dict: 订单结果
        """
        if not self.api_key or not self.api_secret:
            logger.error("API密钥未设置，无法下单")
            return None
        
        try:
            # 构建订单参数
            order_params = {
                "currency_pair": self.currency_pair,
                "type": order_type,
                "account": "spot",
                "side": "buy" if is_buy else "sell",
                "amount": str(amount)  # 对于市价单，这是基础货币数量
            }
            
            # 如果是限价单，添加价格
            if order_type == 'limit' and price:
                order_params["price"] = str(price)
                order_params["time_in_force"] = "gtc"  # 有效直到取消
            else:
                # 市价单必须为ioc或fok
                order_params["time_in_force"] = "ioc"
            
            # 发送下单请求
            result = await self._send_private_request('spot/orders', method='POST', params=order_params)
            
            if result and 'orderId' in result:
                logger.info(f"下单成功: {result}")
                return result
            else:
                logger.error(f"下单失败: {result}")
                return None
        except Exception as e:
            logger.error(f"下单时发生错误: {e}")
            return None
    
    async def _send_private_request(self, endpoint, method='GET', params=None):
        """发送需要身份验证的API请求"""
        try:
            url = f'{REST_API_URL}/{endpoint}'
            ts = str(int(time.time()))  # Unix seconds

            method_upper = method.upper()
            path = f'/api/v4/{endpoint}'

            # Query string: for GET with params, build unencoded string (assume params dict order)
            query_string = ''
            request_params = params or {}
            if method_upper == 'GET' and request_params:
                # Sort keys for consistent order (Gate.io doesn't specify, but safer)
                sorted_params = sorted(request_params.items())
                query_string = '&'.join(f"{k}={v}" for k, v in sorted_params)

            # Body: for non-GET, JSON string; for GET, empty
            body = json.dumps(request_params) if method_upper != 'GET' and request_params else ''

            # Hex SHA512 of body (or empty)
            body_hash = hashlib.sha512(body.encode('utf-8')).hexdigest()

            # Signing string
            sign_str = f"{method_upper}\n{path}\n{query_string}\n{body_hash}\n{ts}"

            # Signature: hex HMAC-SHA512
            sign = hmac.new(self.api_secret.encode('utf-8'), sign_str.encode('utf-8'), hashlib.sha512).hexdigest()

            headers = {
                'Content-Type': 'application/json',
                'KEY': self.api_key,
                'SIGN': sign,
                'TIMESTAMP': ts
            }

            async with aiohttp.ClientSession() as session:
                if method_upper == 'GET':
                    async with session.get(url, headers=headers, params=request_params) as response:
                        return await response.json()
                else:
                    async with session.request(method_upper, url, headers=headers, data=body) as response:
                        return await response.json()
        except Exception as e:
            logger.error(f"发送私有请求时发生错误: {e}")
            return None

# 导入itertools用于SimpleRingBuffer
import itertools

# 示例使用
async def main():
    # 初始化GateOps实例
    gate_ops = GateOps()
    # 启动WebSocket连接，开始维护实时订单簿
    print("启动WebSocket连接，开始维护实时订单簿...")
    ws_task = asyncio.create_task(gate_ops.start_ws())
    # 等待订单簿初始化
    await asyncio.sleep(3)
    
    try:
        balances = await gate_ops.get_balance()
        if balances:
            print(f"\n账户余额:")
            print(f"USDT可用余额: {balances['usdt']:.6f}")
            print(f"HSK可用余额: {balances['hsk']:.6f}")
        # 循环获取并显示当前订单簿
        for _ in range(1):  # 显示1次
            order_book = gate_ops.get_current_order_book()
            if order_book:
                print(f"\n最新订单簿 (ID: {order_book['update_id']}):")
                
                # 显示完整买单簿
                print("\n==== 买单簿 ====")
                for i, bid in enumerate(order_book['bids'][:10]):  # 显示前10个买单
                    print(f"买{i+1}: {bid}")
                print(f"总计 {len(order_book['bids'])} 个买单")
                # 显示完整卖单簿
                print("\n==== 卖单簿 ====")
                for i, ask in enumerate(order_book['asks'][:10]):  # 显示前10个卖单
                    print(f"卖{i+1}: {ask}")
                print(f"总计 {len(order_book['asks'])} 个卖单")
                
                # 计算买入1个HSK的成本
                buy_result = gate_ops.calculate_trade_cost(1, is_buy=True)
                if buy_result:
                    print(f"\n买入1 HSK: 总成本={buy_result['actual_usdt']:.6f} USDT, 交易费={buy_result['trading_fee']:.6f} USDT")
            else:
                print("订单簿尚未初始化")
            
            await asyncio.sleep(2)
    finally:
        # 停止WebSocket连接
        print("\n停止WebSocket连接...")
        # 先取消任务，再关闭WebSocket连接
        if ws_task and not ws_task.done():
            ws_task.cancel()
            try:
                await ws_task
            except asyncio.CancelledError:
                pass
        # 确保WebSocket连接已关闭
        try:
            await gate_ops.stop_ws()
        except Exception as e:
            print(f"关闭WebSocket连接时发生错误: {e}")

if __name__ == '__main__':
    # 使用更稳健的事件循环处理方式
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("程序被用户中断")
    except Exception as e:
        print(f"程序运行出错: {e}")