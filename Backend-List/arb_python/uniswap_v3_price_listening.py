from web3 import Web3
import time
import json
from typing import Tuple, List, Dict
from decimal import Decimal, getcontext
import requests
from web3.exceptions import ContractLogicError

# 提升精度
getcontext().prec = 60

# 合约地址
HSK_ADDRESS = Web3.to_checksum_address('0xe7c6bf469e97eeb0bfb74c8dbff5bd47d4c1c98a')
USDC_ADDRESS = Web3.to_checksum_address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
FACTORY_ADDRESS = Web3.to_checksum_address('0x1F98431c8aD98523631AE4a59f267346ea31F984')
QUOTER_ADDRESS = Web3.to_checksum_address('0x61fFE014bA17989E743c5F6cB21bF9697530B21e')
SUBGRAPH_URL = "https://gateway.thegraph.com/api/b5309b514031153697825cbac32805f9/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"

# Pool ABI（slot0, liquidity, and Swap event）
POOL_ABI = json.loads('''[
    {
        "inputs": [],
        "name": "slot0",
        "outputs": [
            {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
            {"internalType": "int24", "name": "tick", "type": "int24"},
            {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
            {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
            {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
            {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
            {"internalType": "bool", "name": "unlocked", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "liquidity",
        "outputs": [{"internalType": "uint128", "name": "", "type": "uint128"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
            {"indexed": false, "internalType": "int256", "name": "amount0", "type": "int256"},
            {"indexed": false, "internalType": "int256", "name": "amount1", "type": "int256"},
            {"indexed": false, "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
            {"indexed": false, "internalType": "uint128", "name": "liquidity", "type": "uint128"},
            {"indexed": false, "internalType": "int24", "name": "tick", "type": "int24"}
        ],
        "name": "Swap",
        "type": "event"
    }
]''')

# Factory ABI（getPool）
FACTORY_ABI = json.loads('''[
    {
        "inputs": [
            {"internalType": "address", "name": "tokenA", "type": "address"},
            {"internalType": "address", "name": "tokenB", "type": "address"},
            {"internalType": "uint24", "name": "fee", "type": "uint24"}
        ],
        "name": "getPool",
        "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]''')

# QuoterV2 ABI (only quoteExactInputSingle)
QUOTER_ABI = json.loads('''[
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "address", "name": "tokenIn", "type": "address"},
                    {"internalType": "address", "name": "tokenOut", "type": "address"},
                    {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                    {"internalType": "uint24", "name": "fee", "type": "uint24"},
                    {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                ],
                "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "quoteExactInputSingle",
        "outputs": [
            {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
            {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
            {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
            {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
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
    """ % pool_id.lower()
    response = requests.post(SUBGRAPH_URL, json={'query': query})
    if response.status_code == 200:
        data = response.json()
        if 'data' in data and 'pool' in data['data'] and data['data']['pool']:
            pool_data = data['data']['pool']
            return pool_data['totalValueLockedToken0'], pool_data['totalValueLockedToken1']
    return "0", "0"

def discover_v3_pools() -> List[Dict]:
    pools = []
    token0, token1 = get_sorted_tokens(HSK_ADDRESS, USDC_ADDRESS)
    factory = w3.eth.contract(address=FACTORY_ADDRESS, abi=FACTORY_ABI)
    
    # 常见fee tiers (0.01%, 0.05%, 0.3%, 1%)
    fee_tiers = [100, 500, 3000, 10000]
    
    for fee in fee_tiers:
        try:
            pool_address = factory.functions.getPool(token0, token1, fee).call()
            if pool_address != '0x0000000000000000000000000000000000000000':
                pool_contract = w3.eth.contract(address=pool_address, abi=POOL_ABI)
                slot0 = pool_contract.functions.slot0().call()
                if slot0[0] != 0:  # sqrtPriceX96 非零表示池初始化
                    liquidity = pool_contract.functions.liquidity().call()
                    locked_token0, locked_token1 = get_locked_amounts(pool_address)
                    pools.append({
                        'pool_address': pool_address,
                        'fee': fee,
                        'liquidity': liquidity,
                        'locked_token0': locked_token0,
                        'locked_token1': locked_token1
                    })
        except Exception as e:
            print(f"Error for fee {fee}: {e}")
            pass  # 不存在或错误则跳过
    
    # 按流动性降序排序（可选，选择最佳池）
    pools.sort(key=lambda p: p['liquidity'], reverse=True)
    return pools

def compute_price(sqrt_price_x96: int) -> float:
    dec0 = 6  # USDC
    dec1 = 18  # HSK
    sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
    hsk_per_usdc = sqrt_price ** 2 * Decimal(10 ** (dec0 - dec1))
    usdc_per_hsk = Decimal(1) / hsk_per_usdc if hsk_per_usdc != 0 else Decimal(0)
    return float(usdc_per_hsk)

def quote_exact_input_single(amount_in_wei: int, fee: int) -> int:
    quoter = w3.eth.contract(address=QUOTER_ADDRESS, abi=QUOTER_ABI)
    
    # 使用正确的参数结构 - 确保符合 QuoterV2 合约的要求
    params = {
        'tokenIn': USDC_ADDRESS,
        'tokenOut': HSK_ADDRESS,
        'amountIn': amount_in_wei,
        'fee': fee,
        'sqrtPriceLimitX96': 0
    }
    
    try:
        # 使用 call 方法直接调用，而不是通过 build_transaction 和 eth.call
        # 这是 Web3.py 与合约交互的更标准方式
        amount_out, sqrt_price_x96_after, initialized_ticks_crossed, gas_estimate = quoter.functions.quoteExactInputSingle(
            (
                params['tokenIn'],
                params['tokenOut'],
                params['amountIn'],
                params['fee'],
                params['sqrtPriceLimitX96']
            )
        ).call()
        return amount_out
    except Exception as e:
        print(f"Quoter 调用错误: {e}")
        # 添加更详细的错误处理
        try:
            # 尝试备选方案 - 使用 build_transaction 和 eth.call 的方式
            calldata = quoter.functions.quoteExactInputSingle((
                params['tokenIn'],
                params['tokenOut'],
                params['amountIn'],
                params['fee'],
                params['sqrtPriceLimitX96']
            )).build_transaction({
                'from': w3.eth.accounts[0] if w3.eth.accounts else '0x0000000000000000000000000000000000000000',
                'gas': 2000000
            })['data']
            
            result = w3.eth.call({
                'to': QUOTER_ADDRESS,
                'data': calldata,
                'gas': 2000000
            })
            
            # 手动解码结果
            if result:
                decoded = w3.codec.decode(['uint256', 'uint160', 'uint32', 'uint256'], result)
                return decoded[0]
            return 0
        except Exception as inner_e:
            print(f"备选方案也失败: {inner_e}")
            return 0

def find_best_pool_for_swap(v3_pools: List[Dict], amount_in_usdc: float) -> Tuple[Dict, float]:
    best_pool = None
    max_out = 0
    amount_in_wei = int(amount_in_usdc * 10**6)  # USDC 6 decimals
    for pool in v3_pools:
        print(pool)
        try:
            amount_out_wei = quote_exact_input_single(amount_in_wei, pool['fee'])
            print(f"amount_out_wei: {amount_out_wei}")
            if amount_out_wei > max_out:
                max_out = amount_out_wei
                best_pool = pool
        except Exception as e:
            print(f"Error quoting for pool {pool['pool_address']}: {e}")
    hsk_out = max_out / 10**18 if max_out > 0 else 0  # HSK 18 decimals
    return best_pool, hsk_out

# 主逻辑：发现V3池并监测
v3_pools = discover_v3_pools()
if not v3_pools:
    print("未发现HSK/USDC的V3池。请确认池是否存在。")
else:
    print("发现的V3池:")
    for p in v3_pools:
        print(f"Pool Address: {p['pool_address']}\n  Fee: {p['fee']/10000}%  Liquidity: {p['liquidity']}\n  Locked Token0 (USDC): {p['locked_token0']}\n  Locked Token1 (HSK): {p['locked_token1']}\n")
    
    pool_contracts = [w3.eth.contract(address=p['pool_address'], abi=POOL_ABI) for p in v3_pools]
    
    # Swap topic
    swap_topic = w3.keccak(text="Swap(address,address,int256,int256,uint160,uint128,int24)").hex()
    
    # 初始化价格
    current_prices = []
    for contract in pool_contracts:
        slot0 = contract.functions.slot0().call()
        sqrt_price_x96 = slot0[0]
        price = compute_price(sqrt_price_x96)
        current_prices.append(price)
    
    # 初始打印
    print("\n----- 初始价格 -----")
    for i, (pool, price) in enumerate(zip(v3_pools, current_prices)):
        pool_address = pool['pool_address']
        locked_token0, locked_token1 = get_locked_amounts(pool_address)
        print(f"""池 {i+1}/{len(v3_pools)} (Address: {pool_address}):  - 当前HSK/USDC价格 (V3, Fee {pool['fee']/10000}%): {price:.6f} USDC per HSK""")
    
    # 初始最优池计算（示例：1000 USDC 输入）
    example_amount = 1000.0
    best_pool, hsk_out = find_best_pool_for_swap(v3_pools, example_amount)
    if best_pool:
        print(f"\n----- 初始最优池 (输入 {example_amount} USDC) -----")
        print(f"最佳池地址: {best_pool['pool_address']}, 费率: {best_pool['fee']/10000}%, 预期输出 HSK: {hsk_out:.2f}")
    
    last_block = w3.eth.block_number
    
    while True:
        current_block = w3.eth.block_number
        
        if current_block > last_block:
            print(f"current_block: {current_block}，last_block: {last_block}")
            price_updated = False
            for i, (pool, contract) in enumerate(zip(v3_pools, pool_contracts)):
                pool_address = pool['pool_address']
                try:
                    logs = w3.eth.get_logs({
                        "fromBlock": last_block + 1,
                        "toBlock": current_block,
                        "address": pool_address,
                        "topics": [[swap_topic]]
                    })
                    if logs:
                        price_updated = True
                        print("\n----- 开始新轮价格查询 -----\n")
                        last_log = logs[-1]
                        event = contract.events.Swap().process_log(last_log)
                        sqrt_price_x96 = event['args']['sqrtPriceX96']
                        price = compute_price(sqrt_price_x96)
                        current_prices[i] = price
                        locked_token0, locked_token1 = get_locked_amounts(pool_address)
                        print(f"""池 {i+1}/{len(v3_pools)} (Address: {pool_address}):  - 当前HSK/USDC价格 (V3, Fee {pool['fee']/10000}%): {price:.6f} USDC per HSK""")
                        print("价格已通过Swap事件更新")
                        print("\n----- 本轮价格查询结束 -----\n")
                except Exception as e:
                    print(f"查询池 {i+1} 错误: {e}")
            
            # 如果价格更新，重新计算最优池
            if price_updated:
                best_pool, hsk_out = find_best_pool_for_swap(v3_pools, example_amount)
                if best_pool:
                    print(f"\n----- 更新后最优池 (输入 {example_amount} USDC) -----")
                    print(f"最佳池地址: {best_pool['pool_address']}, 费率: {best_pool['fee']/10000}%, 预期输出 HSK: {hsk_out:.2f}")
            
            last_block = current_block
        
        time.sleep(1)  # 每秒检查一次