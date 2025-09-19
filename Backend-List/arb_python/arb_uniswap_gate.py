import time
import os
import requests
from web3 import Web3
from decimal import Decimal, getcontext
from eth_account import Account
from web3.exceptions import TransactionNotFound
import asyncio
from uniswap_universal_router_decoder import RouterCodec, FunctionRecipient
from web3.types import Wei
import logging
from datetime import datetime
import threading

# 设置日志记录
log_file = f"arbitrage_log_{datetime.now().strftime('%Y%m%d')}.log"

# 配置logger
logger = logging.getLogger('arbitrage_bot')
logger.setLevel(logging.INFO)

# 创建一个handler，用于写入日志文件
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setLevel(logging.INFO)

# 创建一个handler，用于输出到控制台
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# 定义日志格式
log_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
file_handler.setFormatter(log_formatter)
console_handler.setFormatter(log_formatter)

# 给logger添加handler
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# 创建一个自定义的日志函数，用于替代print
def log(message, level='info'):
    """同时输出日志到控制台和文件"""
    if level == 'info':
        logger.info(message)
    elif level == 'warning':
        logger.warning(message)
    elif level == 'error':
        logger.error(message)
    elif level == 'success':
        # 自定义成功级别，使用info级别记录但添加特殊标记
        logger.info(f"✅ {message}")

# 提升精度
getcontext().prec = 60

# 导入操作类
from uniswap_v3_ops import UniswapV3Ops
from uniswap_v4_ops import UniswapV4Ops
from gate_ops import GateOps

# 配置参数
ARBITRAGE_THRESHOLD = 0.03  # 3% 的基础价格差异阈值
TRADE_AMOUNT_USD = 1  # 每次交易的金额（美元）
CHECK_INTERVAL = 60  # 检查价格的时间间隔（秒）
MIN_PROFIT_THRESHOLD = 0.01  # 最小盈利阈值（美元）
UNISWAP_V3_POOL_ADDRESS = '0x463A60837d50CC8901CD314ae454331260a8FFF9'

# 搬砖配置
PRICE_DIFF_THRESHOLD = 0.002       # 初始价差
YIELD_THRESHOLD = 0.0            # 收益率阈值 2%
TRADE_AMOUNT_HSK = 1               # 设定买入数量 tradeAmountHsk 比如 200

# 上一次价格记录（全局变量）
LAST_MAINNET_PRICE = None
LAST_GATE_PRICE = None

# 加载私钥
private_key_file = "private_key_c85.txt"

# 初始化操作类
def init_operations():
    try:
        # 初始化主网 Uniswap V4 操作类
        mainnet_v3_ops = UniswapV3Ops(private_key_file=private_key_file, rpc_url='https://eth.meowrpc.com')
        mainnet_ops = UniswapV4Ops(private_key_file=private_key_file, rpc_url='https://eth.meowrpc.com')
        print(f"✅ 已连接到主网，链 ID: {mainnet_ops.w3.eth.chain_id}")
        print(f"   钱包地址: {mainnet_ops.wallet_address}")
        
        # 初始化 Gate 交易所操作类
        gate_ops = GateOps()
        print(f"✅ 已初始化 Gate 交易所操作类")
        print(f"   交易对: {gate_ops.currency_pair}")
        
        return mainnet_v3_ops, mainnet_ops, gate_ops
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        return None, None, None

# 计算价格差异
def calculate_price_diff(mainnet_price, gate_price):
    if mainnet_price == 0 or gate_price == 0:
        return 0, False
    
    # 计算价格差异百分比
    price_diff = abs(mainnet_price - gate_price) / ((mainnet_price + gate_price) / 2) * 100
    
    # 判断哪边价格更低
    mainnet_is_lower = mainnet_price < gate_price
    
    return price_diff, mainnet_is_lower

# 获取并显示所有 V3 和 V4 池子
def discover_all_pools(mainnet_v3_ops, mainnet_ops):
    try:
        # 发现 V3 池子
        print("\n🔍 正在发现所有 HSK/USDC V3 池子...")
        v3_pools = mainnet_v3_ops.discover_v3_pools()
        print(f"✅ 发现 {len(v3_pools)} 个 V3 池子")
        
        if v3_pools:
            for i, pool in enumerate(v3_pools):
                # 增加锁仓价值信息
                locked_token0 = Decimal(pool.get('locked_token0', '0'))
                locked_token1 = Decimal(pool.get('locked_token1', '0'))
                print(f"池 {i+1}: 地址={pool['pool_address']}, 费率={pool['fee']/10000}%, 流动性={pool['liquidity']}, 锁仓 USDC={locked_token0:.6f}, 锁仓 HSK={locked_token1:.6f}")
        
        # 发现 V4 池子
        print("\n🔍 正在发现所有 HSK/USDC V4 池子...")
        v4_pools = mainnet_ops.discover_v4_pools()
        print(f"✅ 发现 {len(v4_pools)} 个 V4 池子")
        
        if v4_pools:
            for i, pool in enumerate(v4_pools):
                # 增加锁仓价值信息
                locked_token0 = Decimal(pool.get('locked_token0', '0'))
                locked_token1 = Decimal(pool.get('locked_token1', '0'))
                print(f"池 {i+1}: ID={pool['pool_id'][:10]}..., 费率={pool['fee']/10000}%, 流动性={pool['liquidity']}, 锁仓 USDC={locked_token0:.6f}, 锁仓 HSK={locked_token1:.6f}")
        
        return v3_pools, v4_pools
    except Exception as e:
        print(f"❌ 发现池子失败: {e}")
        return [], []

# 找出最优的池子
# 找出最优的池子
def find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, amount_usd):
    try:
        # 从传入的 v3_pools 中查找与 UNISWAP_V3_POOL_ADDRESS 匹配的池子
        if v3_pools and UNISWAP_V3_POOL_ADDRESS:
            # 确保地址格式统一（转为小写进行比较）
            target_address = UNISWAP_V3_POOL_ADDRESS.lower()
            
            # 在 v3_pools 中查找匹配的池子
            target_pool = next((pool for pool in v3_pools 
                               if pool.get('pool_address', '').lower() == target_address), None)
            
            if target_pool:
                return target_pool, "v3"
            else:
                print(f"\n❌ 在 v3_pools 中未找到地址为 {UNISWAP_V3_POOL_ADDRESS} 的池子")
                return None, None
        else:
            print("\n❌ v3_pools 为空或 UNISWAP_V3_POOL_ADDRESS 未设置")
            return None, None
    except Exception as e:
        print(f"❌ 获取指定池子失败: {e}")
        return None, None

# 在主网执行交易 (使用最优池子)
def perform_optimized_mainnet_swap(mainnet_v3_ops, mainnet_ops, best_pool, pool_type, amount_usd, buy_hsk=True):
    try:
        print(f"📤 在主网执行交易 (使用 {pool_type} 最优池子): {'买入 HSK' if buy_hsk else '卖出 HSK'} {amount_usd} USD")
        
        if pool_type == "v3":
            # 使用 V3 最优池子
            receipt = mainnet_v3_ops.swap(amount_usd, buy_hsk=buy_hsk, fee=best_pool['fee'])
        else:
            # 使用 V4 最优池子
            receipt = mainnet_ops.swap(amount_usd, buy_hsk=buy_hsk)
        
        return receipt is not None
    except Exception as e:
        print(f"❌ 主网交易失败: {e}")
        return False

# 在 Gate 交易所执行交易
async def perform_gate_swap(gate_ops, amount_usd, buy_hsk=True):
    try:
        print(f"📤 在 Gate 交易所执行交易: {'买入 HSK' if buy_hsk else '卖出 HSK'} {amount_usd} USD")
        
        # 首先确保订单簿已初始化
        if not gate_ops.get_current_order_book():
            await gate_ops.get_order_book()
            if not gate_ops.get_current_order_book():
                print("❌ Gate 交易所订单簿未初始化，无法执行交易")
                return False
        
        # 计算需要交易的数量
        if buy_hsk:
            # 买入HSK，计算需要的HSK数量
            buy_result = gate_ops.calculate_trade_cost(amount_usd, is_buy=True)
            if not buy_result:
                print("❌ 计算买入成本失败")
                return False
            amount_hsk = buy_result['actual_hsk']
            print(f"   预计买入: {amount_hsk:.6f} HSK, 预计花费: {buy_result['actual_usdt']:.6f} USDT")
        else:
            # 卖出HSK，使用固定数量
            amount_hsk = amount_usd  # 简化处理，实际应根据价格转换
        
        # 下单交易
        result = await gate_ops.place_order(amount_hsk, is_buy=buy_hsk)
        if result:
            print(f"✅ Gate 交易所交易成功: {result}")
            return True
        else:
            print("❌ Gate 交易所交易失败")
            return False
    except Exception as e:
        print(f"❌ Gate 交易所交易异常: {e}")
        return False

# 获取 Gate 交易所的价格
def get_gate_price(gate_ops):
    try:
        # 确保订单簿已初始化
        if not gate_ops.get_current_order_book():
            # 使用同步方式获取订单簿
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(gate_ops.get_order_book())
            loop.close()
        
        order_book = gate_ops.get_current_order_book()
        if not order_book or len(order_book['asks']) == 0 or len(order_book['bids']) == 0:
            print("❌ Gate 交易所订单簿为空")
            return 0, 0, 0
        
        # 使用最佳卖价作为当前价格
        best_ask = order_book['asks'][0].price
        best_bid = order_book['bids'][0].price
        mid_price = (best_ask + best_bid) / Decimal('2')
        
        return float(mid_price), float(best_ask), float(best_bid)
    except Exception as e:
        print(f"❌ 获取 Gate 交易所价格失败: {e}")
        return 0, 0, 0

# 计算价格差异和考虑费率后的实际盈利能力
def calculate_profitability(mainnet_ops, gate_ops, mainnet_price, gate_price, best_pool=None, pool_type=None):
    if mainnet_price == 0 or gate_price == 0:
        return 0, 0, 0, False
    
    # 计算基础价格差异百分比
    price_diff_percent = abs(mainnet_price - gate_price) / ((mainnet_price + gate_price) / 2) * 100
    
    # 判断哪边价格更低
    mainnet_is_lower = mainnet_price < gate_price
    
    # 计算考虑费率后的预期盈利
    try:
        # 获取交易费率
        if best_pool and pool_type == "v3":
            mainnet_fee = best_pool['fee'] / 10000  # 转换为百分比
        else:
            mainnet_fee = 0.003  # 默认0.3%费率
        
        # Gate交易所费率
        gate_fee = 0.002  # Gate默认交易费率0.2%
        
        # 计算考虑双向交易费率后的净价格差异
        total_fee_percent = (mainnet_fee + gate_fee) * 100
        
        # 计算净价格差异（减去交易费率）
        net_price_diff_percent = price_diff_percent - total_fee_percent
        print(f"mainnet_fee: {mainnet_fee}, gate_fee: {gate_fee}, total_fee_percent: {total_fee_percent}, price_diff_percent: {price_diff_percent}, net_price_diff_percent: ${net_price_diff_percent}")
        
        # 计算预期盈利金额
        if mainnet_is_lower:
            # 主网买入，Gate卖出
            buy_amount = TRADE_AMOUNT_USD
            buy_cost = buy_amount
            # 扣除主网买入费率
            hsk_bought = buy_amount / mainnet_price * (1 - mainnet_fee)
            # Gate卖出，扣除卖出费率
            sell_revenue = hsk_bought * gate_price * (1 - gate_fee)
        else:
            # Gate买入，主网卖出
            buy_amount = TRADE_AMOUNT_USD
            buy_cost = buy_amount
            # 扣除Gate买入费率
            hsk_bought = buy_amount / gate_price * (1 - gate_fee)
            # 主网卖出，扣除卖出费率
            sell_revenue = hsk_bought * mainnet_price * (1 - mainnet_fee)
        
        # 计算净利润
        profit = sell_revenue - buy_cost
        
        return price_diff_percent, net_price_diff_percent, profit, mainnet_is_lower
    except Exception as e:
        print(f"计算盈利能力出错: {e}")
        return price_diff_percent, 0, 0, mainnet_is_lower

# 检查并执行套利
async def check_and_execute_arbitrage(mainnet_v3_ops, mainnet_ops, gate_ops, v3_pools, v4_pools):
    global LAST_MAINNET_PRICE, LAST_GATE_PRICE
    
    # 首先获取并显示最新余额信息
    print("\n📊 当前余额信息:")
    # 获取主网余额
    mainnet_balances = mainnet_ops.get_balance()
    print(f"主网: USDC={mainnet_balances['usdc']:.6f}, HSK={mainnet_balances['hsk']:.6f}")
    # 获取Gate交易所余额
    gate_balances = await gate_ops.get_balance()
    if gate_balances:
        print(f"Gate: USDC={gate_balances['usdt']:.6f}, HSK={gate_balances['hsk']:.6f}")
    else:
        print("❌ 无法获取Gate交易所余额")
    
    # 先找出最优池子
    best_pool, pool_type = find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, TRADE_AMOUNT_USD)
    
    # uniswap 获取价格 - 优先使用最优池子的价格
    if best_pool and pool_type == "v3":
        mainnet_price, _, _ = mainnet_v3_ops.get_price(best_pool)
        mainnet_fee = best_pool['fee'] / 10000  # 转换为百分比
    elif best_pool and pool_type == "v4":
        mainnet_price, _, _ = mainnet_ops.get_price(best_pool)
        mainnet_fee = best_pool['fee'] / 10000  # 假设V4池子也有类似的fee结构
    else:
        mainnet_price, _, _ = mainnet_v3_ops.get_price()
        mainnet_fee = 0.003  # 默认0.3%费率
    
    # Gate 获取价格
    gate_price, _, _ = get_gate_price(gate_ops)
    
    # 新增：检查价格是否发生变化
    if LAST_MAINNET_PRICE is not None and LAST_GATE_PRICE is not None:
        # 检查主网价格是否变化超过0.01%
        mainnet_price_changed = abs(mainnet_price - LAST_MAINNET_PRICE) / max(mainnet_price, LAST_MAINNET_PRICE) > 0.0001
        # 检查Gate价格是否变化超过0.01%
        gate_price_changed = abs(gate_price - LAST_GATE_PRICE) / max(gate_price, LAST_GATE_PRICE) > 0.0001
        
        # 如果价格没有变化，跳过套利检查
        if not mainnet_price_changed and not gate_price_changed:
            # print("ℹ️  价格未发生变化，跳过后续套利检查")
            return
    
    # 更新上一次价格记录
    LAST_MAINNET_PRICE = mainnet_price
    LAST_GATE_PRICE = gate_price
    
    if mainnet_price > 0 and gate_price > 0:
        # 计算价格差异百分比
        price_diff = abs(mainnet_price - gate_price) / max(mainnet_price, gate_price)  # 使用较高价格作为基数
        log(f"价格检查: 主网 HSK={mainnet_price:.10f} USD, Gate HSK={gate_price:.10f} USD, 当前价差: {price_diff:.6f} ({price_diff*100:.2f}%)")
        
        # 如果价格差异未达，直接返回
        if price_diff < PRICE_DIFF_THRESHOLD:
            print(f"⚠️ 价格差异 ({price_diff*100:.2f}%) 未达到阈值 ({PRICE_DIFF_THRESHOLD*100:.2f}%)，跳过套利检查")
            return
    else:
        print("❌ 获取价格失败，无法计算差异")
        return
    
    # 搬砖条件判断
    if gate_price < mainnet_price:
        # Gate 的价格低，从 Gate 买入 HSK， Uniswap 卖出 HSK
        # 在 Gate 上模拟交易，计算买入 tradeAmountHsk 数量的 HSK 需要花费的 USD allExpenseUsd
        gate_buy_result = gate_ops.calculate_trade_cost(TRADE_AMOUNT_HSK, is_buy=True)
        if not gate_buy_result:
            print("❌ Gate 买入模拟失败")
            return
        all_expense_usd = gate_buy_result['actual_usdt']
        
        # 在 Uniswap 上模拟交易，计算卖出 tradeAmountHsk 数量的 HSK 能得到的所有 USD allGetUsd
        if pool_type == "v3":
            uniswap_sell_result = mainnet_v3_ops.simulate_swap(TRADE_AMOUNT_HSK, buy_hsk=False, fee=best_pool['fee'])
        else:
            uniswap_sell_result = mainnet_ops.simulate_swap(TRADE_AMOUNT_HSK, buy_hsk=False)
        if not uniswap_sell_result:
            print("❌ Uniswap 卖出模拟失败")
            return
        all_get_usd = uniswap_sell_result['amount_out']  # 假设 simulate_swap 返回 {'amount_out': value}
        
        # 计算收益率
        yield_rate = (all_get_usd - all_expense_usd) / all_expense_usd
        
        log(f"📈 潜在收益率 (Gate 买入, Uniswap 卖出): {yield_rate:.4f}")
        
        # 若收益率大于设置的值 则执行交易
        if yield_rate > YIELD_THRESHOLD:
            print("✅ 收益率超过阈值，执行套利")
            # 执行 Gate 买入
            buy_success = await perform_gate_swap(gate_ops, float(TRADE_AMOUNT_HSK), buy_hsk=True)
            if not buy_success:
                print("❌ Gate 买入失败，套利中止")
                return
            # 执行 Uniswap 卖出
            sell_success = perform_optimized_mainnet_swap(mainnet_v3_ops, mainnet_ops, best_pool, pool_type, float(TRADE_AMOUNT_HSK), buy_hsk=False)
            if not sell_success:
                print("❌ Uniswap 卖出失败")
        else:
            print("⚠️ 收益率不足，不执行套利")
    
    elif gate_price > mainnet_price:
        # Gate 的价格高，从 Uniswap 买入 HSK， Gate 卖出 HSK
        # 注意: 注释中是“从 Uniswap 上卖出， Gate 上买入”，但根据价格高低：
        # 如果 Gate 价格高（卖价高），应该在 Uniswap 买入（低价买），在 Gate 卖出（高价卖）
        # 注释说：若 Gate 的价格高， 则从 Uniswap 上卖出， Gate 上买入
        # 这似乎有误？如果 Gate 价格高，意味着 Gate 上 HSK 贵，应该在 Uniswap（低）买入，在 Gate（高）卖出。
        # 但注释说“从 Uniswap 上卖出， Gate 上买入”，那是从 Uniswap 卖出（低价卖？），Gate 买入（高价买？），那是反套利。
        # 可能注释错误。逻辑应是低买高卖。
        # 修正为：如果 Gate > Mainnet，Mainnet 低：在 Mainnet 买入，在 Gate 卖出。
        
        # 在 Uniswap 上模拟交易，计算买入 tradeAmountHsk 数量的 HSK 需要花费的 USD allExpenseUsd
        if pool_type == "v3":
            uniswap_buy_result = mainnet_v3_ops.simulate_swap(TRADE_AMOUNT_HSK, buy_hsk=True, fee=best_pool['fee'])
        else:
            uniswap_buy_result = mainnet_ops.simulate_swap(TRADE_AMOUNT_HSK, buy_hsk=True)
        if not uniswap_buy_result:
            print("❌ Uniswap 买入模拟失败")
            return
        all_expense_usd = uniswap_buy_result['amount_in']  # 假设 simulate_swap 返回 {'amount_in': value} for buy
        
        # 在 Gate 上模拟交易，计算卖出 tradeAmountHsk 数量的 HSK 能得到的所有 USD allGetUsd
        gate_sell_result = gate_ops.calculate_trade_cost(TRADE_AMOUNT_HSK, is_buy=False)
        if not gate_sell_result:
            print("❌ Gate 卖出模拟失败")
            return
        all_get_usd = gate_sell_result['actual_usdt']
        # 计算收益率
        yield_rate = (all_get_usd - all_expense_usd) / all_expense_usd
        
        log(f"📈 潜在收益率 (Uniswap 买入, Gate 卖出): {yield_rate:.4f}")
        
        # 若收益率大于 2% 则执行交易
        if yield_rate > YIELD_THRESHOLD:
            print("✅ 收益率超过阈值，执行套利")
            # 执行 Uniswap 买入
            buy_success = perform_optimized_mainnet_swap(mainnet_v3_ops, mainnet_ops, best_pool, pool_type, float(TRADE_AMOUNT_HSK), buy_hsk=True)
            if not buy_success:
                print("❌ Uniswap 买入失败，套利中止")
                return
            # 执行 Gate 卖出
            sell_success = await perform_gate_swap(gate_ops, float(TRADE_AMOUNT_HSK), buy_hsk=False)
            if not sell_success:
                print("❌ Gate 卖出失败")
        else:
            print("⚠️ 收益率不足，不执行套利")
    
    else:
        print("⚖️ 价格相同，无套利机会")

import threading

# 添加一个全局变量来追踪是否正在执行套利检查
is_arbitrage_checking = False

# 价格变动的回调函数
async def on_price_change(mainnet_v3_ops, mainnet_ops, gate_ops, v3_pools, v4_pools):
    global is_arbitrage_checking
    
    # 避免重复执行套利检查
    if is_arbitrage_checking:
        print("ℹ️  已有套利检查在运行，跳过本次检查")
        return
    
    try:
        is_arbitrage_checking = True
        print("\n🔄 检测到价格变动，开始套利检查...")
        await check_and_execute_arbitrage(mainnet_v3_ops, mainnet_ops, gate_ops, v3_pools, v4_pools)
    finally:
        is_arbitrage_checking = False

# 创建一个包装函数，用于在单独的线程中运行价格监控
def run_price_monitor(mainnet_v3_ops, best_pool, event_loop, mainnet_ops, gate_ops, v3_pools, v4_pools):
    # 创建一个只包含指定最优池子的列表
    target_pools = [best_pool] if best_pool else []
    
    # 定义回调函数
    def price_change_callback(updated_best_pool, pool_type, current_prices):
        # 使用主事件循环来调用异步函数
        asyncio.run_coroutine_threadsafe(
            on_price_change(mainnet_v3_ops, mainnet_ops, gate_ops, v3_pools, v4_pools),
            event_loop
        )
    
    # 开始监控价格
    try:
        mainnet_v3_ops.monitor_prices(
            pools=target_pools,
            example_amount=TRADE_AMOUNT_USD,
            check_interval=1,
            price_change_callback=price_change_callback
        )
    except Exception as e:
        print(f"价格监控线程出错: {e}")

# 异步主循环
async def perform_arbitrage_async():
    print("🚀 跨交易所套利机器人启动中...")
    # 初始化操作类
    mainnet_v3_ops, mainnet_ops, gate_ops = init_operations()
    if not mainnet_ops or not gate_ops or not mainnet_v3_ops:
        print("❌ 初始化失败，无法继续")
        return
    # 启动Gate的WebSocket连接，先获取实时订单簿
    print("\n🔄 启动Gate交易所WebSocket连接...")
    ws_task = asyncio.create_task(gate_ops.start_ws())
    # 等待订单簿初始化
    await asyncio.sleep(3)
    
    # 显示初始余额
    print("\n💰 初始余额:")
    mainnet_balances = mainnet_ops.get_balance()
    print(f"主网: USDC={mainnet_balances['usdc']:.6f}, HSK={mainnet_balances['hsk']:.6f}")
    # 获取并显示Gate交易所余额
    print("正在获取Gate交易所余额...")
    gate_balances = await gate_ops.get_balance()
    if gate_balances:
        print(f"Gate: USDT={gate_balances['usdt']:.6f}, HSK={gate_balances['hsk']:.6f}")
    else:
        print("❌ 无法获取Gate交易所余额")
    
    # 发现所有池子
    v3_pools, v4_pools = discover_all_pools(mainnet_v3_ops, mainnet_ops)
    # 如果没有发现池子，使用默认池子继续
    if not v3_pools and not v4_pools:
        print("\n⚠️ 未发现任何池子，将使用默认配置继续")

    # 在发现池子后立即定义最优池子
    print("\n🔍 正在寻找初始最优池子...")
    best_pool, pool_type = find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, TRADE_AMOUNT_USD)
    '''
    # 启动价格监控线程，只监控最优池子
    if best_pool and pool_type == "v3":
        print(f"\n👁️  启动最优池子 ({best_pool['pool_address']}) 价格监控...")
        # 获取当前事件循环
        loop = asyncio.get_event_loop()
        # 创建并启动价格监控线程
        monitor_thread = threading.Thread(
            target=run_price_monitor,
            args=(mainnet_v3_ops, best_pool, loop, mainnet_ops, gate_ops, v3_pools, v4_pools),
            daemon=True
        )
        monitor_thread.start()
    '''
    # 主循环 - 保持程序运行，价格监控线程会在后台运行
    try:
        # 保持程序运行（也可以添加定期检查逻辑）
        while True:
            print("\n🔄 执行套利检查...")
            await check_and_execute_arbitrage(mainnet_v3_ops, mainnet_ops, gate_ops, v3_pools, v4_pools)
            await asyncio.sleep(3)  # 每分钟检查一次状态，确保程序不会退出
    except KeyboardInterrupt:
        print("\n🛑 机器人已停止")
    except Exception as e:
        print(f"\n❌ 机器人发生未预期错误: {e}")
    finally:
        # 停止WebSocket连接
        print("\n🔌 关闭Gate交易所WebSocket连接...")
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

# 主函数
def perform_arbitrage():
    try:
        asyncio.run(perform_arbitrage_async())
    except KeyboardInterrupt:
        print("程序被用户中断")
    except Exception as e:
        print(f"程序运行出错: {e}")

if __name__ == "__main__":
    perform_arbitrage()