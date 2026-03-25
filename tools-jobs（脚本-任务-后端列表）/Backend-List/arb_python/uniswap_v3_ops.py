import time
import os
from typing import Dict, List, Tuple
import requests
import json
from web3 import Web3
from web3.types import Wei
from eth_account import Account
from decimal import Decimal, getcontext
from web3.exceptions import TransactionNotFound

# 提升精度
getcontext().prec = 60

class UniswapV3Ops:
    def __init__(self, rpc_url='https://eth.drpc.org', private_key=None, private_key_file=None):
        # 连接到主网
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError("无法连接到主网 RPC 提供者")
        
        # 加载私钥
        if private_key:
            self.private_key = private_key
        elif private_key_file:
            try:
                with open(private_key_file, 'r') as f:
                    self.private_key = f.read().strip()
            except FileNotFoundError:
                raise FileNotFoundError(f"私钥文件 {private_key_file} 不存在")
        else:
            raise ValueError("必须提供私钥或私钥文件路径")
        
        if not self.private_key:
            raise ValueError("私钥为空")
        
        self.account = Account.from_key(self.private_key)
        self.wallet_address = self.account.address
        
        # 配置 Uniswap V3 相关参数
        self._setup_uniswap_params()
        
    def _setup_uniswap_params(self):
        # Uniswap V3 池子地址（USDC/HSK 0.3% 费率池）
        self.pool_address = Web3.to_checksum_address("0x934f27e9d9c0d8fc9a446ba7b4b850b16d145d6a")
        # Uniswap V3 SwapRouter地址
        self.swap_router_address = Web3.to_checksum_address("0xE592427A0AEce92De3Edee1F18E0157C05861564")
        # Factory 合约地址
        self.factory_address = Web3.to_checksum_address("0x1F98431c8aD98523631AE4a59f267346ea31F984")
        # Quoter 合约地址
        self.quoter_address = Web3.to_checksum_address("0x61fFE014bA17989E743c5F6cB21bF9697530B21e")
        # 子图 URL
        self.subgraph_url = "https://gateway.thegraph.com/api/b5309b514031153697825cbac32805f9/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
        # 代币地址
        self.usdc_address = Web3.to_checksum_address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")  # USDC
        self.hsk_address = Web3.to_checksum_address("0xE7C6BF469e97eEB0bFB74C8dbFF5BD47D4C1C98a")  # HSK
        # 代币小数位
        self.usdc_decimals = 6
        self.hsk_decimals = 18
        # SwapRouter ABI（使用 flat params 版本，以修复 BscScan 显示问题）
        self.swap_router_abi = [
            {
                "inputs": [
                    {
                        "components": [
                            {"internalType": "address", "name": "tokenIn", "type": "address"},
                            {"internalType": "address", "name": "tokenOut", "type": "address"},
                            {"internalType": "uint24", "name": "fee", "type": "uint24"},
                            {"internalType": "address", "name": "recipient", "type": "address"},
                            {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                            {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
                            {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                        ],
                        "internalType": "struct ISwapRouter.ExactInputSingleParams",
                        "name": "params",
                        "type": "tuple"
                    }
                ],
                "name": "exactInputSingle",
                "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
            }
        ]
        
        # ERC20 ABI（用于approve）
        self.erc20_abi = [
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"},
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function",
            },
            {
                "constant": True,
                "inputs": [
                    {"name": "_owner", "type": "address"},
                    {"name": "_spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            }
        ]
        
        # Swap事件签名和主题
        self.swap_event_sig = "Swap(address,address,int256,int256,uint160,uint128,int24)"
        self.swap_topic = self.w3.keccak(text=self.swap_event_sig).hex()
        
        # 池子合约 ABI 片段（用于获取价格）
        self.pool_abi = [
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
            }
        ]
        
        # Factory ABI（getPool）
        self.factory_abi = json.loads('''[
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
        self.quoter_abi = json.loads('''[
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
        
        # 创建合约实例
        self.swap_router_contract = self.w3.eth.contract(address=self.swap_router_address, abi=self.swap_router_abi)
        self.usdc_contract = self.w3.eth.contract(address=self.usdc_address, abi=self.erc20_abi)
        self.hsk_contract = self.w3.eth.contract(address=self.hsk_address, abi=self.erc20_abi)
        self.pool_contract = self.w3.eth.contract(address=self.pool_address, abi=self.pool_abi)
        self.factory_contract = self.w3.eth.contract(address=self.factory_address, abi=self.factory_abi)
        self.quoter_contract = self.w3.eth.contract(address=self.quoter_address, abi=self.quoter_abi)
    
    def get_price(self, pool=None):
        """获取当前 HSK/USDC 价格，可以指定特定池子"""
        try:
            # 确定要使用的池子合约
            if pool and 'pool_address' in pool:
                # 使用指定的池子
                pool_contract = self.w3.eth.contract(address=pool['pool_address'], abi=self.pool_abi)
            else:
                # 使用默认池子
                pool_contract = self.pool_contract
            
            # 调用 slot0 函数获取当前价格信息
            slot0 = pool_contract.functions.slot0().call()
            sqrt_price_x96 = slot0[0]
            tick = slot0[1]
            # 调用 liquidity 检查流动性
            liquidity = pool_contract.functions.liquidity().call()
            if liquidity == 0:
                return False, tick, liquidity
            
            # 计算价格
            decimals0 = self.usdc_decimals  # token0 = USDC
            decimals1 = self.hsk_decimals   # token1 = HSK
            sqrt_price = Decimal(sqrt_price_x96) / Decimal(2**96)
            # price = token1 / token0 = HSK per USDC
            hsk_per_usdc = (sqrt_price ** 2) * Decimal(10**(decimals0 - decimals1))
            # 要 HSK/USDC (1 HSK = X USDC)，计算 1 / hsk_per_usdc = USDC per HSK
            hsk_usdc_price = 1 / hsk_per_usdc if hsk_per_usdc != 0 else 0

            return float(hsk_usdc_price), tick, liquidity
        except Exception as e:
            print(f"获取价格出错: {e}")
            return 0.0, 0, 0
    
    def get_price_from_subgraph(self):
        """从 Uniswap V3 子图中获取当前 HSK/USDC 价格"""
        try:
            # Uniswap V3 子图 GraphQL 端点
            subgraph_url = "https://gateway.thegraph.com/api/b5309b514031153697825cbac32805f9/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
            # GraphQL 查询
            query = """
            query {
              pools(where: {
                id: "%s"
              }) {
                id
                token0 {
                  symbol
                  decimals
                }
                token1 {
                  symbol
                  decimals
                }
                sqrtPrice
                liquidity
                tick
              }
            }
            """ % self.pool_address.lower()  # 子图中地址是小写的
            
            # 发送请求
            headers = {'Content-Type': 'application/json'}
            response = requests.post(subgraph_url, json={'query': query}, headers=headers)
            response.raise_for_status()  # 如果请求失败，抛出异常
            # 解析响应
            data = response.json()
            #print(json.dumps(data))
            
            # 检查是否有数据返回
            if not data.get('data') or not data['data'].get('pools') or len(data['data']['pools']) == 0:
                print("子图中未找到该池子的数据")
                return 0.0
            
            # 提取池子数据
            pool_data = data['data']['pools'][0]
            sqrt_price = int(pool_data['sqrtPrice'])
            tick = int(pool_data['tick'])
            liquidity = int(pool_data['liquidity'])
            
            # 获取代币信息
            token0_decimals = int(pool_data['token0']['decimals'])
            token1_decimals = int(pool_data['token1']['decimals'])
            
            # 确定 HSK 是 token0 还是 token1
            # 比较地址的小写形式以避免大小写问题
            hsk_is_token0 = pool_data['token0']['symbol'].upper() == 'HSK' or pool_data['token0']['symbol'].upper() == 'WHSK' or pool_data['token0']['symbol'].upper() == 'WETH'
            
            # 计算价格
            if hsk_is_token0:
                # HSK 是 token0，USDC 是 token1
                raw_price = (sqrt_price ** 2) / (2 ** 192)
                hsk_price_in_usdc = raw_price * (10 ** token0_decimals) / (10 ** token1_decimals)
            else:
                # HSK 是 token1，USDC 是 token0
                raw_price = (2 ** 192) / (sqrt_price ** 2)
                hsk_price_in_usdc = raw_price * (10 ** token1_decimals) / (10 ** token0_decimals)
            
            print(f"从子图获取价格: HSK={hsk_price_in_usdc:.10f} USDC, Tick={tick}, Liquidity={liquidity}")
            return float(hsk_price_in_usdc)
        except Exception as e:
            print(f"从子图获取价格出错: {e}")
            return 0.0
    
    def swap(self, amount_in_usd, buy_hsk=True, amount_out_min=0, fee=3000):
        """
        执行 swap 交易
        amount_in_usd: 交易金额（美元）
        buy_hsk: True 表示用 USDC 买入 HSK，False 表示用 HSK 卖出获取 USDC
        amount_out_min: 最小输出数量（防止滑点）
        fee: 池子费率，默认 3000 (0.3%)
        """
        try:
            # 将 USD 金额转换为代币数量
            if buy_hsk:
                # 用 USDC 买入 HSK
                amount_in = self.w3.to_wei(amount_in_usd, 'mwei')  # USDC 有 6 位小数
                token_in = self.usdc_address
                token_out = self.hsk_address
                token_in_contract = self.usdc_contract
            else:
                # 用 HSK 买入 USDC
                # 先获取当前价格
                price, _, _ = self.get_price()
                if price == 0:
                    print("无法获取当前价格，无法计算交易数量")
                    return None
                amount_in_hsk = amount_in_usd / price
                amount_in = self.w3.to_wei(amount_in_hsk, 'ether')  # HSK 有 18 位小数
                token_in = self.hsk_address
                token_out = self.usdc_address
                token_in_contract = self.hsk_contract

            # 检查余额
            balance = token_in_contract.functions.balanceOf(self.wallet_address).call()
            if balance < amount_in:
                print(f"余额不足: 需要 {amount_in}, 可用 {balance}")
                return None

            # 检查并批准代币到 SwapRouter
            erc20_allowance = token_in_contract.functions.allowance(self.wallet_address, self.swap_router_address).call()
            if erc20_allowance < amount_in:
                print(f"批准 {token_in} 到 SwapRouter...")
                approve_tx = token_in_contract.functions.approve(self.swap_router_address, 2**256 - 1).build_transaction({
                    'from': self.wallet_address,
                    'gas': 100000,
                    'gasPrice': self.w3.eth.gas_price,
                    'nonce': self.w3.eth.get_transaction_count(self.wallet_address),
                })
                signed_approve = self.w3.eth.account.sign_transaction(approve_tx, self.private_key)
                approve_hash = self.w3.eth.send_raw_transaction(signed_approve.rawTransaction)
                receipt = self.w3.eth.wait_for_transaction_receipt(approve_hash, timeout=600)
                if receipt.status != 1:
                    print("批准交易失败")
                    return None

            # 执行 swap 交易
            deadline = int(time.time()) + 600  # 10分钟后过期
            
            # 构建交易
            tx = self.swap_router_contract.functions.exactInputSingle({
                'tokenIn': token_in,
                'tokenOut': token_out,
                'fee': fee,
                'recipient': self.wallet_address,
                'deadline': deadline,
                'amountIn': amount_in,
                'amountOutMinimum': amount_out_min,
                'sqrtPriceLimitX96': 0
            }).build_transaction({
                'from': self.wallet_address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.wallet_address),
            })
            
            # 签名并发送
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            print(f"交易已发送: {tx_hash.hex()}")

            # 等待确认
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=600)
            if receipt.status == 1:
                print(f"Swap 成功! Status: {receipt.status}")
                return receipt
            else:
                print(f"Swap 失败! Status: {receipt.status}")
                return None
        except Exception as e:
            print(f"交易执行错误: {e}")
            return None
            
    def get_balance(self, token_address=None):
        """获取指定代币的余额，默认获取 USDC 和 HSK 余额"""
        try:
            if token_address:
                token_contract = self.w3.eth.contract(address=token_address, abi=self.erc20_abi)
                balance = token_contract.functions.balanceOf(self.wallet_address).call()
                return balance
            else:
                usdc_balance = self.usdc_contract.functions.balanceOf(self.wallet_address).call()
                hsk_balance = self.hsk_contract.functions.balanceOf(self.wallet_address).call()
                return {
                    'usdc': usdc_balance / 10**self.usdc_decimals,
                    'hsk': hsk_balance / 10**self.hsk_decimals
                }
        except Exception as e:
            print(f"获取余额出错: {e}")
            return 0 if token_address else {'usdc': 0, 'hsk': 0}

    def get_sorted_tokens(self, tokenA: str, tokenB: str) -> Tuple[str, str]:
        """对两个代币地址进行排序，确保一致的顺序"""
        return (min(tokenA, tokenB), max(tokenA, tokenB))
        
    def get_locked_amounts(self, pool_id: str) -> Tuple[str, str]:
        """从子图获取池子锁定的代币数量"""
        query = """
        {
          pool(id: "%s") {
            totalValueLockedToken0
            totalValueLockedToken1
          }
        }
        """ % pool_id.lower()
        response = requests.post(self.subgraph_url, json={'query': query})
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and 'pool' in data['data'] and data['data']['pool']:
                pool_data = data['data']['pool']
                return pool_data['totalValueLockedToken0'], pool_data['totalValueLockedToken1']
        return "0", "0"
        
    def discover_v3_pools(self) -> List[Dict]:
        """发现所有HSK/USDC的V3池子"""
        pools = []
        token0, token1 = self.get_sorted_tokens(self.hsk_address, self.usdc_address)
        
        # 常见fee tiers (0.01%, 0.05%, 0.3%, 1%)
        fee_tiers = [100, 500, 3000, 10000]
        
        for fee in fee_tiers:
            try:
                pool_address = self.factory_contract.functions.getPool(token0, token1, fee).call()
                if pool_address != '0x0000000000000000000000000000000000000000':
                    pool_contract = self.w3.eth.contract(address=pool_address, abi=self.pool_abi)
                    slot0 = pool_contract.functions.slot0().call()
                    if slot0[0] != 0:  # sqrtPriceX96 非零表示池初始化
                        liquidity = pool_contract.functions.liquidity().call()
                        locked_token0, locked_token1 = self.get_locked_amounts(pool_address)
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
        
        # 按流动性降序排序
        pools.sort(key=lambda p: p['liquidity'], reverse=True)
        return pools
        
    def compute_price(self, sqrt_price_x96: int) -> float:
        """根据sqrtPriceX96计算USDC/HSK价格"""
        dec0 = self.usdc_decimals  # USDC
        dec1 = self.hsk_decimals   # HSK
        sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
        hsk_per_usdc = sqrt_price ** 2 * Decimal(10 ** (dec0 - dec1))
        usdc_per_hsk = Decimal(1) / hsk_per_usdc if hsk_per_usdc != 0 else Decimal(0)
        return float(usdc_per_hsk)
        
    def quote_exact_input_single(self, amount_in_wei: int, fee: int) -> int:
        """获取指定金额在特定费率池中的预期输出量"""
        try:
            # 使用正确的参数结构 - 确保符合 QuoterV2 合约的要求
            params = {
                'tokenIn': self.usdc_address,
                'tokenOut': self.hsk_address,
                'amountIn': amount_in_wei,
                'fee': fee,
                'sqrtPriceLimitX96': 0
            }
            
            # 使用 call 方法直接调用，而不是通过 build_transaction 和 eth.call
            amount_out, sqrt_price_x96_after, initialized_ticks_crossed, gas_estimate = self.quoter_contract.functions.quoteExactInputSingle(
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
                calldata = self.quoter_contract.functions.quoteExactInputSingle((
                    params['tokenIn'],
                    params['tokenOut'],
                    params['amountIn'],
                    params['fee'],
                    params['sqrtPriceLimitX96']
                )).build_transaction({
                    'from': self.wallet_address,
                    'gas': 2000000
                })['data']
                
                result = self.w3.eth.call({
                    'to': self.quoter_address,
                    'data': calldata,
                    'gas': 2000000
                })
                
                # 手动解码结果
                if result:
                    decoded = self.w3.codec.decode(['uint256', 'uint160', 'uint32', 'uint256'], result)
                    return decoded[0]
                return 0
            except Exception as inner_e:
                print(f"备选方案也失败: {inner_e}")
                return 0
        
    def find_best_pool_for_swap(self, v3_pools: List[Dict], amount_in_usdc: float) -> Tuple[Dict, float]:
        """找出最优的交易池子"""
        best_pool = None
        max_out = 0
        amount_in_wei = int(amount_in_usdc * 10**self.usdc_decimals)  # USDC 小数位
        for pool in v3_pools:
            try:
                amount_out_wei = self.quote_exact_input_single(amount_in_wei, pool['fee'])
                if amount_out_wei > max_out:
                    max_out = amount_out_wei
                    best_pool = pool
            except Exception as e:
                print(f"Error quoting for pool {pool['pool_address']}: {e}")
        hsk_out = max_out / 10**self.hsk_decimals if max_out > 0 else 0  # HSK 小数位
        return best_pool, hsk_out
        
    def monitor_prices(self, pools=None, example_amount=1000.0, check_interval=1, price_change_callback=None):
        """
        监控指定池子的价格变化并定期计算最优池子
        
        参数:
        pools: 要监控的池子列表
        example_amount: 用于计算最优池子的示例金额
        check_interval: 检查间隔（秒）
        price_change_callback: 价格变动时的回调函数，接收参数(best_pool, pool_type, current_prices)
        """
        # 如果没有提供池子列表，自动发现
        if pools is None:
            pools = self.discover_v3_pools()
            
        if not pools:
            print("未发现HSK/USDC的V3池。请确认池是否存在。")
            return
        
        print("发现的V3池:")
        for p in pools:
            print(f"Pool Address: {p['pool_address']}\n  Fee: {p['fee']/10000}%  Liquidity: {p['liquidity']}\n  Locked Token0 (USDC): {p['locked_token0']}\n  Locked Token1 (HSK): {p['locked_token1']}\n")
        
        # 创建池子合约实例
        pool_contracts = [self.w3.eth.contract(address=p['pool_address'], abi=self.pool_abi) for p in pools]
        
        # Swap topic
        swap_topic = self.swap_topic
        
        # 初始化价格
        current_prices = []
        for contract in pool_contracts:
            slot0 = contract.functions.slot0().call()
            sqrt_price_x96 = slot0[0]
            price = self.compute_price(sqrt_price_x96)
            current_prices.append(price)
        
        # 初始打印
        print("\n----- 初始价格 -----")
        for i, (pool, price) in enumerate(zip(pools, current_prices)):
            pool_address = pool['pool_address']
            locked_token0, locked_token1 = self.get_locked_amounts(pool_address)
            print(f"""池 {i+1}/{len(pools)} (Address: {pool_address}):  - 当前HSK/USDC价格 (V3, Fee {pool['fee']/10000}%): {price:.6f} USDC per HSK""")
        
        # 初始最优池计算
        best_pool, hsk_out = self.find_best_pool_for_swap(pools, example_amount)
        if best_pool:
            print(f"\n----- 初始最优池 (输入 {example_amount} USDC) -----")
            print(f"最佳池地址: {best_pool['pool_address']}, 费率: {best_pool['fee']/10000}%, 预期输出 HSK: {hsk_out:.2f}")
        
        last_block = self.w3.eth.block_number
        
        print("\n开始监控价格变化...")
        try:
            while True:
                current_block = self.w3.eth.block_number
                
                if current_block > last_block:
                    # print(f"current_block: {current_block}，last_block: {last_block}")
                    price_updated = False
                    for i, (pool, contract) in enumerate(zip(pools, pool_contracts)):
                        pool_address = pool['pool_address']
                        logs = self.w3.eth.get_logs({
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
                            price = self.compute_price(sqrt_price_x96)
                            current_prices[i] = price
                            locked_token0, locked_token1 = self.get_locked_amounts(pool_address)
                            print(f"""池 {i+1}/{len(pools)} (Address: {pool_address}):  - 当前HSK/USDC价格 (V3, Fee {pool['fee']/10000}%): {price:.6f} USDC per HSK""")
                            print("价格已通过Swap事件更新")
                            print("\n----- 本轮价格查询结束 -----\n")
                    
                    # 如果价格更新，重新计算最优池
                    if price_updated:
                        best_pool, hsk_out = self.find_best_pool_for_swap(pools, example_amount)
                        if best_pool:
                            print(f"\n----- 更新后最优池 (输入 {example_amount} USDC) -----")
                            print(f"最佳池地址: {best_pool['pool_address']}, 费率: {best_pool['fee']/10000}%, 预期输出 HSK: {hsk_out:.2f}")
                        
                        # 如果提供了回调函数，调用它
                        if price_change_callback and best_pool:
                            price_change_callback(best_pool, "v3", current_prices)
                    
                    last_block = current_block
                
                time.sleep(check_interval)  # 每秒检查一次
        except KeyboardInterrupt:
            print("价格监控已停止。")
    
    def simulate_swap(self, amount_hsk, buy_hsk=True, fee=3000):
        """
        模拟交易但不实际执行
        amount_hsk: HSK的数量
        buy_hsk: True 表示用 USDC 买入 HSK，False 表示用 HSK 卖出获取 USDC
        fee: 池子费率，默认 3000 (0.3%)
        
        返回:
        - 当 buy_hsk=True 时: {'amount_in': usdc_amount}，表示需要花费的USDC数量
        - 当 buy_hsk=False 时: {'amount_out': usdc_amount}，表示可以获得的USDC数量
        """
        try:
            # 获取当前价格
            price, _, _ = self.get_price()
            if price == 0:
                print("无法获取当前价格，无法模拟交易")
                return None
            
            if buy_hsk:
                # 模拟买入HSK，计算需要的USDC数量
                usdc_amount = float(amount_hsk) * price
                # 考虑交易费率
                usdc_amount_with_fee = usdc_amount * (1 + fee/10000)
                return {'amount_in': usdc_amount_with_fee}
            else:
                # 模拟卖出HSK，计算能获得的USDC数量
                # 先将HSK数量转换为wei单位
                amount_hsk_wei = int(float(amount_hsk) * 10**self.hsk_decimals)
                
                # 使用quoter合约估算卖出金额
                # 这里需要注意，quoter_contract.quoteExactInputSingle是为USDC->HSK设计的
                # 对于HSK->USDC，我们需要交换tokenIn和tokenOut
                try:
                    params = {
                        'tokenIn': self.hsk_address,  # 卖出HSK
                        'tokenOut': self.usdc_address,  # 买入USDC
                        'amountIn': amount_hsk_wei,
                        'fee': fee,
                        'sqrtPriceLimitX96': 0
                    }
                    
                    # 使用call方法直接调用
                    amount_out_wei, _, _, _ = self.quoter_contract.functions.quoteExactInputSingle(
                        (
                            params['tokenIn'],
                            params['tokenOut'],
                            params['amountIn'],
                            params['fee'],
                            params['sqrtPriceLimitX96']
                        )
                    ).call()
                    
                    # 转换为USDC数量（考虑6位小数）
                    usdc_amount = amount_out_wei / 10**self.usdc_decimals
                    return {'amount_out': usdc_amount}
                except Exception as e:
                    print(f"Quoter调用失败，使用价格计算作为备选方案: {e}")
                    # 如果quoter调用失败，使用当前价格进行简单计算
                    usdc_amount = float(amount_hsk) * price
                    # 考虑交易费率
                    usdc_amount_with_fee = usdc_amount * (1 - fee/10000)
                    return {'amount_out': usdc_amount_with_fee}
        except Exception as e:
            print(f"模拟交易出错: {e}")
            return None

# 示例使用
if __name__ == "__main__":
    try:
        # 初始化 Uniswap V3 操作类
        uniswap_ops = UniswapV3Ops(private_key_file="private_key_c85.txt")
        print(f"已连接到主网，链 ID: {uniswap_ops.w3.eth.chain_id}")
        print(f"钱包地址: {uniswap_ops.wallet_address}")
        
        # 获取价格
        price, tick, liquidity = uniswap_ops.get_price()
        print(f"HSK 当前价格: {price:.10f} USDC")
        print(f"Tick: {tick}, Liquidity: {liquidity}")
        
        # 从子图获取价格
        subgraph_price = uniswap_ops.get_price_from_subgraph()
        print(f"从子图获取的 HSK 价格: {subgraph_price:.10f} USDC")
        
        # 获取余额
        balances = uniswap_ops.get_balance()
        print(f"USDC 余额: {balances['usdc']:.6f}")
        print(f"HSK 余额: {balances['hsk']:.6f}")
        
        # 发现所有V3池子
        print("\n正在发现所有HSK/USDC V3池子...")
        v3_pools = uniswap_ops.discover_v3_pools()
        
        # 计算最优池子（示例：1000 USDC 输入）
        if v3_pools:
            example_amount = 1000.0
            best_pool, hsk_out = uniswap_ops.find_best_pool_for_swap(v3_pools, example_amount)
            if best_pool:
                print(f"\n----- 最优池 (输入 {example_amount} USDC) -----")
                print(f"最佳池地址: {best_pool['pool_address']}, 费率: {best_pool['fee']/10000}%, 预期输出 HSK: {hsk_out:.2f}")
            
            # 开始监控价格（取消下面的注释以启用）
            # print("\n开始价格监控...")
            # uniswap_ops.monitor_prices(v3_pools)
        
        # 如需执行交易，请取消下面的注释
        # amount_in_usd = 10  # 10 USDC
        # receipt = uniswap_ops.swap(amount_in_usd, buy_hsk=True)
        # if receipt:
        #     print(f"交易成功，交易哈希: {receipt.transactionHash.hex()}")
        
    except Exception as e:
            print(f"错误: {e}")