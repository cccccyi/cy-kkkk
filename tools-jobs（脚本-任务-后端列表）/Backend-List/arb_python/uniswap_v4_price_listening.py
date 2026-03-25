from web3 import Web3
import time
import json
from typing import Tuple, List, Dict
from decimal import Decimal, getcontext
import requests

# 提升精度
getcontext().prec = 60

# 合约地址
HSK_ADDRESS = Web3.to_checksum_address('0xe7c6bf469e97eeb0bfb74c8dbff5bd47d4c1c98a')
USDC_ADDRESS = Web3.to_checksum_address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
STATE_VIEW_ADDRESS = Web3.to_checksum_address('0x7ffe42c4a5deea5b0fec41c94c136cf115597227')
SUBGRAPH_URL = "https://gateway.thegraph.com/api/b5309b514031153697825cbac32805f9/subgraphs/id/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G"

# StateView ABI（getSlot0和getLiquidity）
STATE_VIEW_ABI = json.loads('''[
    {
        "inputs": [
            {"internalType": "PoolId", "name": "poolId", "type": "bytes32"}
        ],
        "name": "getSlot0",
        "outputs": [
            {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
            {"internalType": "int24", "name": "tick", "type": "int24"},
            {"internalType": "uint24", "name": "protocolFee", "type": "uint24"},
            {"internalType": "uint24", "name": "lpFee", "type": "uint24"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "PoolId", "name": "poolId", "type": "bytes32"}
        ],
        "name": "getLiquidity",
        "outputs": [{"internalType": "uint128", "name": "liquidity", "type": "uint128"}],
        "stateMutability": "view",
        "type": "function"
    }
]''')

# 连接Ethereum
w3 = Web3(Web3.HTTPProvider('https://eth.drpc.org'))  # 替换为Infura/Alchemy

def get_sorted_tokens(tokenA: str, tokenB: str) -> Tuple[str, str]:
    return (min(tokenA, tokenB), max(tokenA, tokenB))

def get_locked_amounts(pool_id: str) -> Tuple[str, str]:
    query = """
    {
      pool(id: "%s") {
        totalValueLockedToken0
        totalValueLockedToken1
      }
    }
    """ % pool_id
    response = requests.post(SUBGRAPH_URL, json={'query': query})
    if response.status_code == 200:
        data = response.json()
        if 'data' in data and 'pool' in data['data'] and data['data']['pool']:
            pool_data = data['data']['pool']
            return pool_data['totalValueLockedToken0'], pool_data['totalValueLockedToken1']
    return "0", "0"

def discover_v4_pools() -> List[Dict]:
    pools = []
    currency0, currency1 = get_sorted_tokens(HSK_ADDRESS, USDC_ADDRESS)
    state_view = w3.eth.contract(address=STATE_VIEW_ADDRESS, abi=STATE_VIEW_ABI)
    
    # 常见fee和tickSpacing组合 (fee: 0.01%, 0.05%, 0.3%, 1%, 3%)
    fee_tick_combos = [(100, 1), (500, 10), (3000, 60), (10000, 200), (30000, 600)]
    hooks = '0x0000000000000000000000000000000000000000'  # 默认无hooks
    
    for fee, tick_spacing in fee_tick_combos:
        pool_key = (currency0, currency1, fee, tick_spacing, hooks)
        types = ['address', 'address', 'uint24', 'int24', 'address']
        encoded = w3.codec.encode(types, pool_key)
        pool_id_bytes = w3.keccak(encoded)
        pool_id = pool_id_bytes.hex()
        try:
            slot0 = state_view.functions.getSlot0(pool_id_bytes).call()
            if slot0[0] != 0:  # sqrtPriceX96 非零表示池存在并初始化
                liquidity = state_view.functions.getLiquidity(pool_id_bytes).call()
                locked_token0, locked_token1 = get_locked_amounts(pool_id)
                pools.append({
                    'key': pool_key,
                    'fee': fee,
                    'tick_spacing': tick_spacing,
                    'hooks': hooks,
                    'liquidity': liquidity,
                    'pool_id': pool_id,
                    'locked_token0': locked_token0,
                    'locked_token1': locked_token1
                })
        except Exception as e:
            print(f"Error for fee {fee}, tick_spacing {tick_spacing}: {e}")
            pass  # 不存在或错误则跳过
    
    # 按流动性降序排序（可选，选择最佳池）
    pools.sort(key=lambda p: p['liquidity'], reverse=True)
    return pools

def get_price_from_v4(state_view, pool_key):
    types = ['address', 'address', 'uint24', 'int24', 'address']
    encoded = w3.codec.encode(types, pool_key)
    pool_id = w3.keccak(encoded)
    slot0 = state_view.functions.getSlot0(pool_id).call()
    sqrt_price_x96 = slot0[0]
    
    # 计算价格 (USDC per HSK)
    dec0 = 6  # USDC
    dec1 = 18  # HSK
    sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
    hsk_per_usdc = sqrt_price ** 2 * Decimal(10 ** (dec0 - dec1))
    usdc_per_hsk = 1 / hsk_per_usdc if hsk_per_usdc != 0 else Decimal(0)
    # 如果 currency0 == HSK (但由于排序，通常不会)，则反转
    if pool_key[0].lower() == HSK_ADDRESS.lower():
        usdc_per_hsk = hsk_per_usdc
    return float(usdc_per_hsk)

# 最优池子计算
def simulate_swap_exact_input_single(state_view, pool_key, amount_in_wei, buy_hsk=True):
    """
    模拟在 V4 池子中进行精确输入的兑换
    state_view: StateView 合约实例
    pool_key: 池子的 key (currency0, currency1, fee, tick_spacing, hooks)
    amount_in_wei: 输入代币的数量（以 wei 为单位）
    buy_hsk: True 表示用 USDC 买入 HSK，False 表示用 HSK 卖出获取 USDC
    返回: 预期输出的代币数量（以 wei 为单位）
    """
    try:
        # 编码 pool_key 并计算 pool_id
        types = ['address', 'address', 'uint24', 'int24', 'address']
        encoded = w3.codec.encode(types, pool_key)
        pool_id = w3.keccak(encoded)
        
        # 获取当前价格
        slot0 = state_view.functions.getSlot0(pool_id).call()
        sqrt_price_x96 = slot0[0]
        
        # 计算价格相关参数
        dec0 = 6  # USDC 小数位
        dec1 = 18  # HSK 小数位
        
        # 计算当前价格 (token1 / token0)
        sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
        price_token1_per_token0 = sqrt_price ** 2
        
        # 确定代币顺序
        currency0, currency1, fee, _, _ = pool_key
        token0_is_usdc = currency0.lower() == USDC_ADDRESS.lower()
        
        if buy_hsk:
            # 用 USDC 买入 HSK
            if token0_is_usdc:
                # USDC 是 token0，HSK 是 token1
                # 价格是 HSK per USDC
                price = price_token1_per_token0 * Decimal(10 ** (dec0 - dec1))
                # 计算输出数量（HSK）
                amount_out_wei = int(Decimal(amount_in_wei) * price)
            else:
                # HSK 是 token0，USDC 是 token1
                # 价格是 USDC per HSK，取倒数得到 HSK per USDC
                price = Decimal(1) / (price_token1_per_token0 * Decimal(10 ** (dec1 - dec0)))
                # 计算输出数量（HSK）
                amount_out_wei = int(Decimal(amount_in_wei) * price)
        else:
            # 用 HSK 卖出获取 USDC
            if token0_is_usdc:
                # USDC 是 token0，HSK 是 token1
                # 价格是 HSK per USDC，取倒数得到 USDC per HSK
                price = Decimal(1) / (price_token1_per_token0 * Decimal(10 ** (dec0 - dec1)))
                # 计算输出数量（USDC）
                amount_out_wei = int(Decimal(amount_in_wei) * price)
            else:
                # HSK 是 token0，USDC 是 token1
                # 价格是 USDC per HSK
                price = price_token1_per_token0 * Decimal(10 ** (dec1 - dec0))
                # 计算输出数量（USDC）
                amount_out_wei = int(Decimal(amount_in_wei) * price)
        
        return amount_out_wei
    except Exception as e:
        print(f"模拟交易错误: {e}")
        return 0

def find_best_v4_pool_for_swap(v4_pools, amount_in_usdc):
    """
    寻找最优的 V4 池子进行兑换
    v4_pools: 发现的 V4 池子列表
    amount_in_usdc: 输入的 USDC 数量
    返回: (最佳池子, 预期输出的 HSK 数量)
    """
    if not v4_pools:
        return None, 0
        
    best_pool = None
    max_out = 0
    amount_in_wei = int(amount_in_usdc * 10**6)  # USDC 6 位小数
    state_view = w3.eth.contract(address=STATE_VIEW_ADDRESS, abi=STATE_VIEW_ABI)
    
    print(f"评估 {len(v4_pools)} 个 V4 池子，输入 {amount_in_usdc} USDC")
    
    for pool in v4_pools:
        try:
            pool_key = pool['key']
            fee = pool['fee']
            
            # 模拟交易，计算预期输出
            amount_out_wei = simulate_swap_exact_input_single(state_view, pool_key, amount_in_wei, buy_hsk=True)
            
            print(f"池 ID: {pool['pool_id'][:10]}..., 费率: {fee/10000}%, 预期输出: {amount_out_wei/10**18:.6f} HSK")
            
            # 更新最优池子
            if amount_out_wei > max_out:
                max_out = amount_out_wei
                best_pool = pool
        except Exception as e:
            print(f"评估池子 {pool['pool_id'][:10]}... 错误: {e}")
    
    # 转换为 HSK 数量（18 位小数）
    hsk_out = max_out / 10**18 if max_out > 0 else 0
    return best_pool, hsk_out

# 主逻辑：发现V4池并监测
v4_pools = discover_v4_pools()
if not v4_pools:
    print("未发现HSK/USDC的V4池。请检查hooks或确认池是否存在。")
else:
    print("发现的V4池:")
    for p in v4_pools:
        print(f"Pool ID: {p['pool_id']}  Fee: {p['fee']/10000}%\n  Tick Spacing: {p['tick_spacing']}\n  Liquidity: {p['liquidity']}\n  Hooks: {p['hooks']}\n  Locked USDC: {p['locked_token0']}\n  Locked HSK: {p['locked_token1']}\n")
    
    state_view = w3.eth.contract(address=STATE_VIEW_ADDRESS, abi=STATE_VIEW_ABI)
    
    # 计算初始最优池子（示例：1000 USDC 输入）
    example_amount = 1000.0
    best_pool, hsk_out = find_best_v4_pool_for_swap(v4_pools, example_amount)
    if best_pool:
        print(f"\n----- 初始最优池 (输入 {example_amount} USDC) -----")
        print(f"最佳池 ID: {best_pool['pool_id']}\n  费率: {best_pool['fee']/10000}%\n  预期输出 HSK: {hsk_out:.6f}\n")
    
    while True:
        print("\n----- 开始新轮价格查询 -----")
        # 循环所有发现的池子获取价格
        for i, pool in enumerate(v4_pools):
            pool_key = pool['key']
            pool_id = pool['pool_id']
            try:
                price = get_price_from_v4(state_view, pool_key)
                locked_token0, locked_token1 = get_locked_amounts(pool_id)
                print(f"""池 {i+1}/{len(v4_pools)} - 当前HSK/USDC价格 (V4, Fee {pool_key[2]/10000}%): {price:.6f} USDC per HSK""")
            except Exception as e:
                print(f"查询池 {i+1} 错误: {e}")
        
        # 每5轮查询后重新计算最优池子
        if i % 5 == 0:
            best_pool, hsk_out = find_best_v4_pool_for_swap(v4_pools, example_amount)
            if best_pool:
                print(f"\n----- 更新后最优池 (输入 {example_amount} USDC) -----")
                print(f"最佳池 ID: {best_pool['pool_id']}\n  费率: {best_pool['fee']/10000}%\n  预期输出 HSK: {hsk_out:.6f}\n")
        
        time.sleep(10)  # 每10秒查询一次
