import time
import os
import requests
from web3 import Web3
from decimal import Decimal, getcontext
from eth_account import Account
from web3.exceptions import TransactionNotFound
from uniswap_universal_router_decoder import RouterCodec, FunctionRecipient
from web3.types import Wei

# 提升精度
getcontext().prec = 60

# 导入操作类
from uniswap_v3_ops import UniswapV3Ops
from uniswap_v4_ops import UniswapV4Ops
from hashkey_ops import HashKeyOps

# 配置参数
ARBITRAGE_THRESHOLD = 0.03  # 3% 的基础价格差异阈值
TRADE_AMOUNT_USD = 1  # 每次交易的金额（美元）
CHECK_INTERVAL = 60  # 检查价格的时间间隔（秒）
MIN_PROFIT_THRESHOLD = 0.01  # 最小盈利阈值（美元）

# 加载私钥
private_key_file = "private_key_c85.txt"

# 初始化操作类
def init_operations():
    try:
        # 初始化主网 Uniswap V4 操作类
        mainnet_v3_ops = UniswapV3Ops(private_key_file=private_key_file)
        mainnet_ops = UniswapV4Ops(private_key_file=private_key_file)
        print(f"✅ 已连接到主网，链 ID: {mainnet_ops.w3.eth.chain_id}")
        print(f"   钱包地址: {mainnet_ops.wallet_address}")
        # 初始化 HashKey 链操作类
        hashkey_ops = HashKeyOps(private_key_file=private_key_file)
        print(f"✅ 已连接到 HashKey 链，链 ID: {hashkey_ops.chain_id}")
        print(f"   钱包地址: {hashkey_ops.wallet_address}")
        
        return mainnet_v3_ops, mainnet_ops, hashkey_ops
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        return None, None, None

# 计算价格差异
def calculate_price_diff(mainnet_price, hashkey_price):
    if mainnet_price == 0 or hashkey_price == 0:
        return 0, False
    
    # 计算价格差异百分比
    price_diff = abs(mainnet_price - hashkey_price) / ((mainnet_price + hashkey_price) / 2) * 100
    
    # 判断哪边价格更低
    mainnet_is_lower = mainnet_price < hashkey_price
    
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
def find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, amount_usd):
    best_v3_pool = None
    best_v4_pool = None
    v3_hsk_out = 0
    v4_hsk_out = 0
    
    try:
        # 找出最优 V3 池子
        if v3_pools:
            # 过滤流动性大于0的 V3 池子
            active_v3_pools = [pool for pool in v3_pools if pool.get('liquidity', 0) > 0]
            if active_v3_pools:
                print(f"筛选后有效 V3 池子数量: {len(active_v3_pools)}")
                best_v3_pool, v3_hsk_out = mainnet_v3_ops.find_best_pool_for_swap(active_v3_pools, amount_usd)
                if best_v3_pool:
                    print(f"\n🏆 最优 V3 池子:")
                    print(f"   地址: {best_v3_pool['pool_address']}")
                    print(f"   费率: {best_v3_pool['fee']/10000}%")
                    print(f"   流动性: {best_v3_pool['liquidity']}")
                    print(f"   预期输出 HSK: {v3_hsk_out:.6f}")
            else:
                print("⚠️  没有找到流动性大于0的 V3 池子")
        
        # 找出最优 V4 池子
        if v4_pools:
            # 过滤流动性大于0的 V4 池子
            active_v4_pools = [pool for pool in v4_pools if pool.get('liquidity', 0) > 0]
            if active_v4_pools:
                print(f"筛选后有效 V4 池子数量: {len(active_v4_pools)}")
                best_v4_pool, v4_hsk_out = mainnet_ops.find_best_v4_pool_for_swap(active_v4_pools, amount_usd)
                if best_v4_pool:
                    print(f"\n🏆 最优 V4 池子:")
                    print(f"   ID: {best_v4_pool['pool_id'][:10]}...")
                    print(f"   费率: {best_v4_pool['fee']/10000}%")
                    print(f"   流动性: {best_v4_pool['liquidity']}")
                    print(f"   预期输出 HSK: {v4_hsk_out:.6f}")
            else:
                print("⚠️  没有找到流动性大于0的 V4 池子")
        
        # 比较 V3 和 V4 的最优池子
        if best_v3_pool and best_v4_pool:
            if v3_hsk_out > v4_hsk_out:
                print(f"\n✅ 综合最优池子: V3 ({v3_hsk_out:.6f} HSK 输出) ")
                return best_v3_pool, "v3"
            else:
                print(f"\n✅ 综合最优池子: V4 ({v4_hsk_out:.6f} HSK 输出) ")
                return best_v4_pool, "v4"
        elif best_v3_pool:
            print("\n✅ 综合最优池子: V3 (唯一可用池子)")
            return best_v3_pool, "v3"
        elif best_v4_pool:
            print("\n✅ 综合最优池子: V4 (唯一可用池子)")
            return best_v4_pool, "v4"
        else:
            print("\n❌ 未找到可用池子")
            return None, None
    except Exception as e:
        print(f"❌ 寻找最优池子失败: {e}")
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
            # 注意：这里假设 UniswapV4Ops 的 swap 方法可以接受池参数
            # 如果需要，可以修改 swap 方法以支持指定池子
            receipt = mainnet_ops.swap(amount_usd, buy_hsk=buy_hsk)
        
        return receipt is not None
    except Exception as e:
        print(f"❌ 主网交易失败: {e}")
        return False

# 在 HashKey 链执行交易
def perform_hashkey_swap(hashkey_ops, amount_usd, buy_whsk=True):
    try:
        print(f"📤 在 HashKey 链执行交易: {'买入 WHSK' if buy_whsk else '卖出 WHSK'} {amount_usd} USD")
        receipt = hashkey_ops.swap(amount_usd, buy_whsk=buy_whsk)
        return receipt is not None
    except Exception as e:
        print(f"❌ HashKey 链交易失败: {e}")
        return False

# 计算价格差异和考虑费率后的实际盈利能力
def calculate_profitability(mainnet_ops, hashkey_ops, mainnet_price, hashkey_price, best_pool=None, pool_type=None):
    if mainnet_price == 0 or hashkey_price == 0:
        return 0, 0, False
    
    # 计算基础价格差异百分比
    price_diff_percent = abs(mainnet_price - hashkey_price) / ((mainnet_price + hashkey_price) / 2) * 100
    
    # 判断哪边价格更低
    mainnet_is_lower = mainnet_price < hashkey_price
    
    # 计算考虑费率后的预期盈利
    try:
        # 获取交易费率
        if best_pool and pool_type == "v3":
            mainnet_fee = best_pool['fee'] / 10000  # 转换为百分比
        else:
            mainnet_fee = 0.003  # 默认0.3%费率
        
        # HashKey链费率（假设固定为0.1%）
        hashkey_fee = 0.001
        
        # 计算考虑双向交易费率后的净价格差异
        # 买入和卖出各一次，所以总费率是两个链费率的总和
        total_fee_percent = (mainnet_fee + hashkey_fee) * 100
        
        # 计算净价格差异（减去交易费率）
        net_price_diff_percent = price_diff_percent - total_fee_percent
        print(f"mainnet_fee: {mainnet_fee},  total_fee_percent: {total_fee_percent}, price_diff_percent: {price_diff_percent},  net_price_diff_percent: ${net_price_diff_percent}")
        
        # 计算预期盈利金额
        if mainnet_is_lower:
            # 主网买入，HashKey卖出
            buy_amount = TRADE_AMOUNT_USD
            buy_cost = buy_amount
            # 扣除主网买入费率
            hsk_bought = buy_amount / mainnet_price * (1 - mainnet_fee)
            # HashKey卖出，扣除卖出费率
            sell_revenue = hsk_bought * hashkey_price * (1 - hashkey_fee)
        else:
            # HashKey买入，主网卖出
            buy_amount = TRADE_AMOUNT_USD
            buy_cost = buy_amount
            # 扣除HashKey买入费率
            whsk_bought = buy_amount / hashkey_price * (1 - hashkey_fee)
            # 主网卖出，扣除卖出费率
            sell_revenue = whsk_bought * mainnet_price * (1 - mainnet_fee)
        
        # 计算净利润
        profit = sell_revenue - buy_cost
        
        return price_diff_percent, net_price_diff_percent, profit, mainnet_is_lower
    except Exception as e:
        print(f"计算盈利能力出错: {e}")
        return price_diff_percent, 0, 0, mainnet_is_lower

# 检查并执行套利
def check_and_execute_arbitrage(mainnet_v3_ops, mainnet_ops, hashkey_ops, v3_pools, v4_pools):
    try:
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
        
        # hashkey 获取价格
        hashkey_price, _, _ = hashkey_ops.get_price()
        print(f"🔍 价格检查: 主网 HSK={mainnet_price:.10f} USD, HashKey WHSK={hashkey_price:.10f} USD")
        
        # 计算考虑费率后的盈利能力
        price_diff_percent, net_price_diff_percent, expected_profit, mainnet_is_lower = calculate_profitability(
            mainnet_v3_ops if pool_type == "v3" else mainnet_ops, 
            hashkey_ops, 
            mainnet_price, 
            hashkey_price, 
            best_pool, 
            pool_type
        )
        
        # 打印详细信息
        print(f"📊 套利分析: 基础价格差异={price_diff_percent:.4f}%, 净价格差异={net_price_diff_percent:.4f}%, 预期盈利=${expected_profit:.6f}")
        
        # 检查是否达到套利阈值（同时考虑净价格差异和预期盈利）
        if net_price_diff_percent >= ARBITRAGE_THRESHOLD * 100 and expected_profit >= MIN_PROFIT_THRESHOLD:
            print(f"💹 发现套利机会! 净价格差异: {net_price_diff_percent:.4f}% (阈值: {ARBITRAGE_THRESHOLD*100:.2f}%), 预期盈利: ${expected_profit:.6f}")
            
            # 如果没有找到最优池子，再次尝试查找
            if not best_pool:
                best_pool, pool_type = find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, TRADE_AMOUNT_USD)
            
            # 如果注释掉下面的 return 语句，则会实际执行套利交易
            return
            
            if best_pool and mainnet_is_lower:
                # 主网价格低，从主网买入，HashKey 链卖出
                print(f"执行套利: 从主网买入 HSK ({mainnet_price:.10f}), 从 HashKey 链卖出 WHSK ({hashkey_price:.10f})")
                print(f"交易费率: 主网 {mainnet_fee*100:.2f}%, HashKey 0.30%")
                
                # 先在主网买入 HSK (使用最优池子)
                mainnet_result = perform_optimized_mainnet_swap(mainnet_v3_ops, mainnet_ops, best_pool, pool_type, TRADE_AMOUNT_USD, buy_hsk=True)
                if mainnet_result:
                    # 然后在 HashKey 链卖出 WHSK
                    hashkey_result = perform_hashkey_swap(hashkey_ops, TRADE_AMOUNT_USD, buy_whsk=False)
                    if hashkey_result:
                        print(f"✅ 套利交易完成！预期盈利: ${expected_profit:.6f}")
                    else:
                        print("❌ HashKey 链卖出交易失败")
                else:
                    print("❌ 主网买入交易失败")
            elif best_pool:
                # HashKey 链价格低，从 HashKey 链买入，主网卖出
                print(f"执行套利: 从 HashKey 链买入 WHSK ({hashkey_price:.10f}), 从主网卖出 HSK ({mainnet_price:.10f})")
                print(f"交易费率: HashKey 0.30%, 主网 {mainnet_fee*100:.2f}%")
                
                # 先在 HashKey 链买入 WHSK
                hashkey_result = perform_hashkey_swap(hashkey_ops, TRADE_AMOUNT_USD, buy_whsk=True)
                if hashkey_result:
                    # 然后在主网卖出 HSK (使用最优池子)
                    mainnet_result = perform_optimized_mainnet_swap(mainnet_v3_ops, mainnet_ops, best_pool, pool_type, TRADE_AMOUNT_USD, buy_hsk=False)
                    if mainnet_result:
                        print(f"✅ 套利交易完成！预期盈利: ${expected_profit:.6f}")
                    else:
                        print("❌ 主网卖出交易失败")
                else:
                    print("❌ HashKey 链买入交易失败")
            else:
                print("❌ 未找到最优池子，无法执行套利交易")
        else:
            reasons = []
            if net_price_diff_percent < ARBITRAGE_THRESHOLD * 100:
                reasons.append(f"净价格差异未达到阈值 ({net_price_diff_percent:.4f}% < {ARBITRAGE_THRESHOLD*100:.2f}%)")
            if expected_profit < MIN_PROFIT_THRESHOLD:
                reasons.append(f"预期盈利不足 ({expected_profit:.6f} < {MIN_PROFIT_THRESHOLD})")
            print(f"未满足套利条件: {', '.join(reasons)}")
    except Exception as e:
        print(f"❌ 套利检查执行错误: {e}")

# 主循环
def perform_arbitrage():
    print("🚀 跨链套利机器人启动中...")
    # 初始化操作类
    mainnet_v3_ops, mainnet_ops, hashkey_ops = init_operations()
    if not mainnet_ops or not hashkey_ops or not mainnet_v3_ops:
        print("❌ 初始化失败，无法继续")
        return
    
    # 显示初始余额
    print("\n💰 初始余额:")
    mainnet_balances = mainnet_ops.get_balance()
    print(f"主网: USDC={mainnet_balances['usdc']:.6f}, HSK={mainnet_balances['hsk']:.6f}")
    hashkey_balances = hashkey_ops.get_balance()
    print(f"HashKey: USDT={hashkey_balances['usdt']:.6f}, WHSK={hashkey_balances['whsk']:.6f}")
    
    # 发现所有池子
    v3_pools, v4_pools = discover_all_pools(mainnet_v3_ops, mainnet_ops)
    
    # 如果没有发现池子，使用默认池子继续
    if not v3_pools and not v4_pools:
        print("\n⚠️ 未发现任何池子，将使用默认配置继续")
    
    # 在发现池子后立即定义最优池子
    print("\n🔍 正在寻找初始最优池子...")
    best_pool, pool_type = find_best_pools(mainnet_v3_ops, mainnet_ops, v3_pools, v4_pools, TRADE_AMOUNT_USD)
    # 显示初始最优池子信息
    if best_pool:
        print(f"\n🌟 初始最优池子: {pool_type.upper()}{' (地址:' + best_pool['pool_address'] + ')' if pool_type == 'v3' else ' (ID:' + best_pool['pool_id'][:10] + '...)'}, 费率: {best_pool['fee']/10000}%")
    else:
        print("\n❌ 未能定义初始最优池子")
    
    # 主循环
    try:
        while True:
            print("\n🔄 开始新一轮套利检查...")
            check_and_execute_arbitrage(mainnet_v3_ops, mainnet_ops, hashkey_ops, v3_pools, v4_pools)
            
            # 等待下一次检查
            print(f"⏱️ 等待 {CHECK_INTERVAL} 秒后再次检查价格...")
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        print("\n🛑 机器人已停止")
    except Exception as e:
        print(f"\n❌ 机器人发生未预期错误: {e}")

if __name__ == "__main__":
    perform_arbitrage()