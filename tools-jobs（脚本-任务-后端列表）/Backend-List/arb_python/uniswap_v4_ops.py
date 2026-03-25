import time
import os
import requests
import json
from web3 import Web3
from web3.types import Wei
from uniswap_universal_router_decoder import RouterCodec, FunctionRecipient
from eth_account import Account
from web3.exceptions import TransactionNotFound
from typing import Tuple, List, Dict
from decimal import Decimal, getcontext

class UniswapV4Ops:
    def __init__(self, rpc_url='https://eth.drpc.org', private_key=None, private_key_file=None):
        # 连接到主网
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError("无法连接到主网 RPC 提供者")
        
        # 提升精度
        getcontext().prec = 60
        
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
        
        # 初始化 RouterCodec
        os.environ["WEB3_PROVIDER_URI"] = rpc_url
        self.codec = RouterCodec()
        
        # 配置 Uniswap V4 相关参数
        self._setup_uniswap_params()
    
    def _setup_uniswap_params(self):
        # Uniswap V4 StateView 合约地址
        self.state_view_address = '0x7ffe42c4a5deea5b0fec41c94c136cf115597227'
        self.state_view_address = self.w3.to_checksum_address(self.state_view_address)
        # 池子 ID
        self.pool_id_hex = 'd09bb30ebcc65a42230a96211c82db466308e502c37d40f8d4a5434802ec6c6f'
        self.pool_id = bytes.fromhex(self.pool_id_hex)
        # 代币地址
        self.usdc_address = self.w3.to_checksum_address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
        self.hsk_address = self.w3.to_checksum_address("0xe7c6bf469e97eeb0bfb74c8dbff5bd47d4c1c98a")
        # 池子参数
        self.fee = 30000  # 0.3%
        self.tick_spacing = 600
        self.hooks = self.w3.to_checksum_address("0x0000000000000000000000000000000000000000")  # 假设无 hooks
        # 其他合约地址
        self.universal_router_address = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af"
        self.permit2_address = "0x000000000022D473030F116dDEE9F6B43aC78BA3"
        self.pool_manager_address = "0x000000000004444c5dc75cB358380D2e3dE08A90"  # V4 PoolManager mainnet
        # 代币小数位
        self.usdc_decimals = 6
        self.hsk_decimals = 18
        # 子图 URL
        self.subgraph_url = "https://gateway.thegraph.com/api/b5309b514031153697825cbac32805f9/subgraphs/id/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G"
        
        # ERC20 ABI 片段
        self.erc20_abi = [
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
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
        
        # Permit2 ABI
        self.permit2_abi = [
            {
                "inputs": [
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "word", "type": "uint256"}
                ],
                "name": "nonceBitmap",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        # StateView 合约的简化 ABI
        self.state_view_abi = [
            {
                "inputs": [{"internalType": "PoolId", "name": "poolId", "type": "bytes32"}],
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
                "inputs": [{"internalType": "PoolId", "name": "poolId", "type": "bytes32"}],
                "name": "getLiquidity",
                "outputs": [{"internalType": "uint128", "name": "liquidity", "type": "uint128"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        # 创建合约实例
        self.state_view_contract = self.w3.eth.contract(address=self.state_view_address, abi=self.state_view_abi)
        self.permit2_contract = self.w3.eth.contract(address=self.permit2_address, abi=self.permit2_abi)
        self.usdc_contract = self.w3.eth.contract(address=self.usdc_address, abi=self.erc20_abi)
        self.hsk_contract = self.w3.eth.contract(address=self.hsk_address, abi=self.erc20_abi)
    
    def get_price(self, pool=None):
        """获取当前 HSK/USDC 价格，可以指定特定池子"""
        try:
            # 确定要使用的池子key
            if pool and 'key' in pool:
                # 使用指定池子的key
                pool_key = pool['key']
            else:
                # 使用默认池子配置
                currency0 = self.usdc_address
                currency1 = self.hsk_address
                pool_key = (currency0, currency1, self.fee, self.tick_spacing, self.hooks)
            
            # 编码 pool_key 并计算 pool_id
            types = ['address', 'address', 'uint24', 'int24', 'address']
            encoded = self.w3.codec.encode(types, pool_key)
            pool_id = self.w3.keccak(encoded)
            
            # 获取当前价格
            slot0 = self.state_view_contract.functions.getSlot0(pool_id).call()
            sqrt_price_x96 = slot0[0]
            
            # 计算价格相关参数
            dec0 = 6  # USDC 小数位
            dec1 = 18  # HSK 小数位
            
            # 计算当前价格 (token1 / token0)
            sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
            price_token1_per_token0 = sqrt_price ** 2
            
            # 确定代币顺序
            currency0, currency1, fee, _, _ = pool_key
            token0_is_usdc = currency0.lower() == self.usdc_address.lower()
            
            # 计算USDC per HSK价格
            if token0_is_usdc:
                # USDC 是 token0，HSK 是 token1
                # 价格是 HSK per USDC，取倒数得到 USDC per HSK
                usdc_per_hsk = Decimal(1) / (price_token1_per_token0 * Decimal(10 ** (dec0 - dec1)))
            else:
                # HSK 是 token0，USDC 是 token1
                # 价格是 USDC per HSK
                usdc_per_hsk = price_token1_per_token0 * Decimal(10 ** (dec1 - dec0))
            
            # 获取流动性
            liquidity = self.state_view_contract.functions.getLiquidity(pool_id).call() if pool_key else 0
            
            return float(usdc_per_hsk), 0, liquidity  # V4没有tick概念，返回0
        except Exception as e:
            print(f"获取价格出错: {e}")
            return 0.0, 0, 0
    
    def get_price_from_subgraph(self):
        """从 Uniswap V4 子图中获取当前 HSK/USDC 价格"""
        try:
            # Uniswap V4 子图 GraphQL 端点
            # 注意：这里使用的是一个假设的子图端点，实际使用时需要替换为正确的 Uniswap V4 子图端点
            subgraph_url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v4"
            
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
            """ % self.pool_id_hex
            
            # 发送请求
            headers = {'Content-Type': 'application/json'}
            response = requests.post(subgraph_url, json={'query': query}, headers=headers)
            response.raise_for_status()  # 如果请求失败，抛出异常
            
            # 解析响应
            data = response.json()
            
            # 检查是否有数据返回
            if not data.get('data') or not data['data'].get('pools') or len(data['data']['pools']) == 0:
                print("子图中未找到该池子的数据")
                return 0.0
            
            # 提取池子数据
            pool_data = data['data']['pools'][0]
            sqrt_price = int(pool_data['sqrtPrice'], 16)  # 从十六进制转换为整数
            tick = int(pool_data['tick'])
            liquidity = int(pool_data['liquidity'])
            
            # 获取代币信息
            token0_decimals = int(pool_data['token0']['decimals'])
            token1_decimals = int(pool_data['token1']['decimals'])
            
            # 确定 HSK 是 token0 还是 token1
            # 比较地址的小写形式以避免大小写问题
            hsk_is_token0 = pool_data['token0']['symbol'].upper() == 'HSK' or pool_data['token0']['symbol'].upper() == 'WHSK'
            
            # 计算价格
            if hsk_is_token0:
                # HSK 是 token0，USDC 是 token1
                # 价格 = (sqrtPrice^2) / (2^192) * (10^token1_decimals / 10^token0_decimals)
                raw_price = (sqrt_price ** 2) / (2 ** 192)
                hsk_price_in_usdc = raw_price * (10 ** token1_decimals) / (10 ** token0_decimals)
            else:
                # HSK 是 token1，USDC 是 token0
                # 价格 = (2^192) / (sqrtPrice^2) * (10^token0_decimals / 10^token1_decimals)
                raw_price = (2 ** 192) / (sqrt_price ** 2)
                hsk_price_in_usdc = raw_price * (10 ** token0_decimals) / (10 ** token1_decimals)
            
            print(f"从子图获取价格: HSK={hsk_price_in_usdc:.10f} USDC, Tick={tick}, Liquidity={liquidity}")
            return float(hsk_price_in_usdc)
        except Exception as e:
            print(f"从子图获取价格出错: {e}")
            return 0.0
    
    def swap(self, amount_in, buy_hsk=True, amount_out_min=0):
        """
        执行 swap 交易
        amount_in: 输入代币的数量（如果 buy_hsk 为 True，则为 USDC 数量；如果为 False，则为 HSK 数量）
        buy_hsk: True 表示用 USDC 买入 HSK，False 表示用 HSK 卖出获取 USDC
        amount_out_min: 最小输出数量（防止滑点）
        """
        try:
            # 将输入金额转换为代币数量
            if buy_hsk:
                # 用 USDC 买入 HSK
                amount_in_wei = self.w3.to_wei(amount_in, 'mwei')  # USDC 有 6 位小数
                token_in = self.usdc_address
                token_out = self.hsk_address
                zero_for_one = True  # USDC -> HSK
                token_in_contract = self.usdc_contract
            else:
                # 用 HSK 卖出获取 USDC
                amount_in_wei = self.w3.to_wei(amount_in, 'ether')  # HSK 有 18 位小数
                token_in = self.hsk_address
                token_out = self.usdc_address
                zero_for_one = False  # HSK -> USDC
                token_in_contract = self.hsk_contract

            # 检查余额
            balance = token_in_contract.functions.balanceOf(self.wallet_address).call()
            if balance < amount_in_wei:
                print(f"余额不足: 需要 {amount_in_wei}, 可用 {balance}")
                return None

            # 检查并批准代币到 Permit2
            erc20_allowance = token_in_contract.functions.allowance(self.wallet_address, self.permit2_address).call()
            if erc20_allowance < amount_in_wei:
                print(f"批准 {token_in} 到 Permit2...")
                approve_tx = token_in_contract.functions.approve(self.permit2_address, 2**256 - 1).build_transaction({
                    'from': self.wallet_address,
                    'gas': 100000,
                    'gasPrice': self.w3.to_wei(0.5, 'gwei'),
                    'nonce': self.w3.eth.get_transaction_count(self.wallet_address),
                })
                signed_approve = self.w3.eth.account.sign_transaction(approve_tx, self.private_key)
                approve_hash = self.w3.eth.send_raw_transaction(signed_approve.rawTransaction)
                receipt = self.w3.eth.wait_for_transaction_receipt(approve_hash, timeout=600)
                if receipt.status != 1:
                    print("批准交易失败")
                    return None

            # 获取 Permit2 allowance
            permit2_allowance, permit2_expiration, current_nonce = self.codec.fetch_permit2_allowance(self.wallet_address, token_in)
            need_permit = permit2_allowance < amount_in_wei or permit2_expiration <= int(time.time())
            data = None
            signed_message = None
            nonce = None

            deadline = int(time.time()) + 3600  # 1小时

            if need_permit:
                # 查找下一个可用 nonce
                nonce = current_nonce + 1
                while True:
                    word = nonce >> 8  # nonce // 256
                    bit = nonce & 0xff  # nonce % 256
                    bitmap = self.permit2_contract.functions.nonceBitmap(self.wallet_address, word).call()
                    if (bitmap & (1 << bit)) == 0:
                        break
                    nonce += 1
                print(f"使用可用 nonce: {nonce}")

                expiration = int(time.time()) + 3600 * 24 * 30  # 许可过期: 30天
                chain_id = self.w3.eth.chain_id  # 1 for mainnet

                data, signable_message = self.codec.create_permit2_signable_message(
                    token_in,
                    amount_in_wei,
                    expiration,
                    nonce,
                    self.universal_router_address,
                    deadline,
                    chain_id
                )
                signed_message = self.account.sign_message(signable_message)
            else:
                print("Permit2 allowance 已足够，跳过 permit")

            # 构建 PoolKey
            pool_key = self.codec.encode.v4_pool_key(
                self.usdc_address,  # token0
                self.hsk_address,   # token1
                self.fee,
                self.tick_spacing,
                self.hooks
            )

            # 构建 chained commands
            chain_builder = self.codec.encode.chain()
            if need_permit:
                chain_builder = chain_builder.permit2_permit(data, signed_message)

            swap_builder = (
                chain_builder
                .permit2_transfer_from(
                    FunctionRecipient.CUSTOM,
                    token_in,
                    amount_in_wei,
                    self.pool_manager_address
                )
                .v4_swap()
                .swap_exact_in_single(
                    pool_key=pool_key,
                    zero_for_one=zero_for_one,
                    amount_in=amount_in_wei,
                    amount_out_min=Wei(amount_out_min),
                    hook_data=b''
                )
                .take_all(
                    token_out,
                    Wei(amount_out_min)
                )
                .build_v4_swap()
                .build(deadline)
            )

            # 构建交易
            base_fee = self.w3.eth.get_block('pending')['baseFeePerGas']
            priority_fee = self.w3.eth.max_priority_fee
            max_fee = base_fee * 2 + priority_fee

            tx_params = {
                'to': self.universal_router_address,
                'data': swap_builder,
                'value': Wei(0),
                'from': self.wallet_address,
                'nonce': self.w3.eth.get_transaction_count(self.wallet_address, 'pending'),
                'gas': 500000,
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': priority_fee,
                'chainId': self.w3.eth.chain_id
            }

            # 签名并发送
            signed_tx = self.w3.eth.account.sign_transaction(tx_params, self.private_key)
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
        """获取排序后的代币地址"""
        return (min(tokenA, tokenB), max(tokenA, tokenB))
    
    def get_locked_amounts(self, pool_id: str) -> Tuple[str, str]:
        """从子图获取池中的锁定金额"""
        query = """
        {
          pool(id: "%s") {
            totalValueLockedToken0
            totalValueLockedToken1
          }
        }
        """ % pool_id
        response = requests.post(self.subgraph_url, json={'query': query})
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and 'pool' in data['data'] and data['data']['pool']:
                pool_data = data['data']['pool']
                return pool_data['totalValueLockedToken0'], pool_data['totalValueLockedToken1']
        return "0", "0"
    
    def discover_v4_pools(self) -> List[Dict]:
        """发现所有相关的 V4 池子"""
        pools = []
        currency0, currency1 = self.get_sorted_tokens(self.hsk_address, self.usdc_address)
        
        # 常见fee和tickSpacing组合 (fee: 0.01%, 0.05%, 0.3%, 1%, 3%)
        fee_tick_combos = [(100, 1), (500, 10), (3000, 60), (10000, 200), (30000, 600)]
        hooks = '0x0000000000000000000000000000000000000000'  # 默认无hooks
        
        for fee, tick_spacing in fee_tick_combos:
            pool_key = (currency0, currency1, fee, tick_spacing, hooks)
            types = ['address', 'address', 'uint24', 'int24', 'address']
            encoded = self.w3.codec.encode(types, pool_key)
            pool_id_bytes = self.w3.keccak(encoded)
            pool_id = pool_id_bytes.hex()
            try:
                slot0 = self.state_view_contract.functions.getSlot0(pool_id_bytes).call()
                if slot0[0] != 0:  # sqrtPriceX96 非零表示池存在并初始化
                    liquidity = self.state_view_contract.functions.getLiquidity(pool_id_bytes).call()
                    locked_token0, locked_token1 = self.get_locked_amounts(pool_id)
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
    
    def get_price_from_v4(self, pool_key):
        """从特定池子获取价格"""
        types = ['address', 'address', 'uint24', 'int24', 'address']
        encoded = self.w3.codec.encode(types, pool_key)
        pool_id = self.w3.keccak(encoded)
        slot0 = self.state_view_contract.functions.getSlot0(pool_id).call()
        sqrt_price_x96 = slot0[0]
        
        # 计算价格 (USDC per HSK)
        dec0 = 6  # USDC
        dec1 = 18  # HSK
        sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
        hsk_per_usdc = sqrt_price ** 2 * Decimal(10 ** (dec0 - dec1))
        usdc_per_hsk = 1 / hsk_per_usdc if hsk_per_usdc != 0 else Decimal(0)
        # 如果 currency0 == HSK (但由于排序，通常不会)，则反转
        if pool_key[0].lower() == self.hsk_address.lower():
            usdc_per_hsk = hsk_per_usdc
        return float(usdc_per_hsk)
    
    def simulate_swap_exact_input_single(self, pool_key, amount_in_wei, buy_hsk=True):
        """
        模拟在 V4 池子中进行精确输入的兑换
        pool_key: 池子的 key (currency0, currency1, fee, tick_spacing, hooks)
        amount_in_wei: 输入代币的数量（以 wei 为单位）
        buy_hsk: True 表示用 USDC 买入 HSK，False 表示用 HSK 卖出获取 USDC
        返回: 预期输出的代币数量（以 wei 为单位）
        """
        try:
            # 编码 pool_key 并计算 pool_id
            types = ['address', 'address', 'uint24', 'int24', 'address']
            encoded = self.w3.codec.encode(types, pool_key)
            pool_id = self.w3.keccak(encoded)
            
            # 获取当前价格
            slot0 = self.state_view_contract.functions.getSlot0(pool_id).call()
            sqrt_price_x96 = slot0[0]
            
            # 计算价格相关参数
            dec0 = 6  # USDC 小数位
            dec1 = 18  # HSK 小数位
            
            # 计算当前价格 (token1 / token0)
            sqrt_price = Decimal(sqrt_price_x96) / Decimal(2 ** 96)
            price_token1_per_token0 = sqrt_price ** 2
            
            # 确定代币顺序
            currency0, currency1, fee, _, _ = pool_key
            token0_is_usdc = currency0.lower() == self.usdc_address.lower()
            
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
    
    def find_best_v4_pool_for_swap(self, v4_pools, amount_in_usdc):
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
        
        print(f"评估 {len(v4_pools)} 个 V4 池子，输入 {amount_in_usdc} USDC")
        
        for pool in v4_pools:
            try:
                pool_key = pool['key']
                fee = pool['fee']
                
                # 模拟交易，计算预期输出
                amount_out_wei = self.simulate_swap_exact_input_single(pool_key, amount_in_wei, buy_hsk=True)
                
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
    
    def monitor_prices(self, v4_pools=None, refresh_interval=10, amount_in_usdc=1000):
        """
        监控 V4 池子价格并定期更新最优池子
        v4_pools: 可选的池子列表，如果未提供则自动发现
        refresh_interval: 刷新间隔（秒）
        amount_in_usdc: 用于评估最优池子的 USDC 数量
        """
        # 如果未提供池子列表，则自动发现
        if v4_pools is None:
            v4_pools = self.discover_v4_pools()
            
        if not v4_pools:
            print("未发现HSK/USDC的V4池。请检查hooks或确认池是否存在。")
            return
        
        print("发现的V4池:")
        for p in v4_pools:
            print(f"Pool ID: {p['pool_id']}  Fee: {p['fee']/10000}%\n  Tick Spacing: {p['tick_spacing']}\n  Liquidity: {p['liquidity']}\n  Hooks: {p['hooks']}\n  Locked USDC: {p['locked_token0']}\n  Locked HSK: {p['locked_token1']}\n")
        
        # 计算初始最优池子
        best_pool, hsk_out = self.find_best_v4_pool_for_swap(v4_pools, amount_in_usdc)
        if best_pool:
            print(f"\n----- 初始最优池 (输入 {amount_in_usdc} USDC) -----")
            print(f"最佳池 ID: {best_pool['pool_id']}\n  费率: {best_pool['fee']/10000}%\n  预期输出 HSK: {hsk_out:.6f}\n")
        
        # 开始监控价格
        try:
            counter = 0
            while True:
                print("\n----- 开始新轮价格查询 -----")
                # 循环所有发现的池子获取价格
                for i, pool in enumerate(v4_pools):
                    pool_key = pool['key']
                    pool_id = pool['pool_id']
                    try:
                        price = self.get_price_from_v4(pool_key)
                        locked_token0, locked_token1 = self.get_locked_amounts(pool_id)
                        print(f"池 {i+1}/{len(v4_pools)} - 当前HSK/USDC价格 (V4, Fee {pool_key[2]/10000}%): {price:.6f} USDC per HSK")
                    except Exception as e:
                        print(f"查询池 {i+1} 错误: {e}")
                
                # 每5轮查询后重新计算最优池子
                counter += 1
                if counter % 5 == 0:
                    best_pool, hsk_out = self.find_best_v4_pool_for_swap(v4_pools, amount_in_usdc)
                    if best_pool:
                        print(f"\n----- 更新后最优池 (输入 {amount_in_usdc} USDC) -----")
                        print(f"最佳池 ID: {best_pool['pool_id']}\n  费率: {best_pool['fee']/10000}%\n  预期输出 HSK: {hsk_out:.6f}\n")
                
                time.sleep(refresh_interval)  # 按照指定间隔查询一次
        except KeyboardInterrupt:
            print("价格监控已停止")
    
    # ... 原有方法继续保持不变 ...

# 示例使用
if __name__ == "__main__":
    try:
        # 初始化 Uniswap V4 操作类
        uniswap_ops = UniswapV4Ops(private_key_file="private_key_c85.txt")
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
        
        # 发现所有 V4 池子
        print("\n发现所有 V4 池子...")
        v4_pools = uniswap_ops.discover_v4_pools()
        
        # 查找最优池子
        if v4_pools:
            print("\n查找最优池子...")
            best_pool, hsk_out = uniswap_ops.find_best_v4_pool_for_swap(v4_pools, 1000)
            if best_pool:
                print(f"最佳池子: {best_pool['pool_id'][:10]}..., 预期输出: {hsk_out:.6f} HSK")
        
        # 如需监控价格，请取消下面的注释
        # print("\n开始监控价格...")
        # uniswap_ops.monitor_prices(v4_pools, refresh_interval=10)
        
        # 如需执行交易，请取消下面的注释
        # amount_in = 0.1  # 示例：如果 buy_hsk=False，则为 0.1 HSK；如果 True，则为 0.1 USDC
        # receipt = uniswap_ops.swap(amount_in, buy_hsk=False)
        # if receipt:
        #     print(f"交易成功，交易哈希: {receipt.transactionHash.hex()}")
        
    except Exception as e:
            print(f"错误: {e}")