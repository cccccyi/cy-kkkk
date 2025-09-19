import time
import os
import requests
from web3 import Web3
from decimal import Decimal, getcontext
from eth_account import Account
from web3.exceptions import TransactionNotFound

# 提升精度
getcontext().prec = 60

class HashKeyOps:
    def __init__(self, rpc_url='https://mainnet.hsk.xyz', private_key=None, private_key_file=None):
        # 连接到 HashKey 链
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError("无法连接到 HashKey 链 RPC 提供者")
        
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
        self.chain_id = 177  # HashKey 链 ID
        
        # 初始化 HashKey 相关参数
        self._setup_hashkey_params()
        
    def _setup_hashkey_params(self):
        # 池子地址（WHSK/USDT）
        self.pool_address = Web3.to_checksum_address("0xF8365695ccC4FCa53241d7d42BbDc3b2e7d43AE4")
        # SwapRouter 地址
        self.swap_router_address = Web3.to_checksum_address("0x865E195B184fBf98c69752a280f2b3950AbD7756")
        # 代币地址
        self.whsk_address = Web3.to_checksum_address("0xb210d2120d57b758ee163cffb43e73728c471cf1")  # WHSK (18 decimals)
        self.usdt_address = Web3.to_checksum_address("0xf1b50ed67a9e2cc94ad3c477779e2d4cbfff9029")  # USDT (6 decimals)
        # 代币小数位
        self.whsk_decimals = 18
        self.usdt_decimals = 6
        # 初始化合约 ABI
        self._setup_abis()
        
        # 确定 token0 和 token1
        self._setup_token_order()
        
    def _setup_abis(self):
        # SwapRouter ABI
        self.swap_router_abi = [
            {
                "constant": False,
                "inputs": [
                    {"name": "amountIn", "type": "uint256"},
                    {"name": "amountOutMin", "type": "uint256"},
                    {"name": "path", "type": "address[]"},
                    {"name": "to", "type": "address"},
                    {"name": "deadline", "type": "uint256"}
                ],
                "name": "swapExactTokensForTokens",
                "outputs": [{"name": "amounts", "type": "uint256[]"}],
                "type": "function"
            }
        ]
        
        # ERC20 ABI
        self.erc20_abi = [
            {
                "constant": False,
                "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
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
        
        # Pair ABI
        self.pair_abi = [
            {
                "constant": True,
                "inputs": [],
                "name": "token0",
                "outputs": [{"name": "", "type": "address"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "token1",
                "outputs": [{"name": "", "type": "address"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "getReserves",
                "outputs": [
                    {"name": "_reserve0", "type": "uint112"},
                    {"name": "_reserve1", "type": "uint112"},
                    {"name": "_blockTimestampLast", "type": "uint32"}
                ],
                "type": "function"
            }
        ]
        
        # 创建合约实例
        self.pair_contract = self.w3.eth.contract(address=self.pool_address, abi=self.pair_abi)
        self.swap_router_contract = self.w3.eth.contract(address=self.swap_router_address, abi=self.swap_router_abi)
        self.whsk_contract = self.w3.eth.contract(address=self.whsk_address, abi=self.erc20_abi)
        self.usdt_contract = self.w3.eth.contract(address=self.usdt_address, abi=self.erc20_abi)
    
    def _setup_token_order(self):
        token0 = self.pair_contract.functions.token0().call()
        token1 = self.pair_contract.functions.token1().call()
        
        # 确定 WHSK 和 USDT 在池子中的位置
        if token0.lower() == self.whsk_address.lower():
            self.is_whsk_token0 = True
        else:
            self.is_whsk_token0 = False
    
    def get_price(self):
        """获取当前 WHSK/USDT 价格"""
        try:
            # 获取池子储备金
            reserves = self.pair_contract.functions.getReserves().call()
            reserve0, reserve1, _ = reserves
            
            # 计算价格
            if self.is_whsk_token0:
                reserve_whsk = reserve0
                reserve_usdt = reserve1
            else:
                reserve_whsk = reserve1
                reserve_usdt = reserve0
            
            if reserve_whsk == 0:
                return 0.0, reserve0, reserve1
            
            # 计算 WHSK 的 USDT 价格（USDT per WHSK）
            price = (Decimal(reserve_usdt) / 10**self.usdt_decimals) / (Decimal(reserve_whsk) / 10**self.whsk_decimals)
            
            return float(price), reserve0, reserve1
        except Exception as e:
            print(f"获取价格出错: {e}")
            return 0.0, 0, 0
    
    def swap(self, amount_in_usd, buy_whsk=True, amount_out_min=0):
        """
        执行 swap 交易
        amount_in_usd: 交易金额（美元）
        buy_whsk: True 表示用 USDT 买入 WHSK，False 表示用 WHSK 卖出获取 USDT
        amount_out_min: 最小输出数量（防止滑点）
        """
        try:
            # 将 USD 金额转换为代币数量
            if buy_whsk:
                # 用 USDT 买入 WHSK
                amount_in = int(amount_in_usd * 10**self.usdt_decimals)  # USDT 有 6 位小数
                token_in = self.usdt_address
                token_out = self.whsk_address
                token_in_contract = self.usdt_contract
            else:
                # 用 WHSK 买入 USDT
                # 先获取当前价格
                price, _, _ = self.get_price()
                if price == 0:
                    print("无法获取当前价格，无法计算交易数量")
                    return None
                amount_in_whsk = amount_in_usd / price
                amount_in = int(amount_in_whsk * 10**self.whsk_decimals)  # WHSK 有 18 位小数
                token_in = self.whsk_address
                token_out = self.usdt_address
                token_in_contract = self.whsk_contract
    
            # 检查余额
            balance = token_in_contract.functions.balanceOf(self.wallet_address).call()
            if balance < amount_in:
                print(f"余额不足: 需要 {amount_in}, 可用 {balance}")
                return None
    
            # 获取当前 nonce 值
            current_nonce = self.w3.eth.get_transaction_count(self.wallet_address)
    
            # 批准代币，使用当前 nonce
            approve_tx = token_in_contract.functions.approve(self.swap_router_address, amount_in).build_transaction({
                'from': self.wallet_address,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': current_nonce,
                'chainId': self.chain_id
            })
            signed_approve = self.w3.eth.account.sign_transaction(approve_tx, self.private_key)
            approve_hash = self.w3.eth.send_raw_transaction(signed_approve.rawTransaction)
            approve_receipt = self.w3.eth.wait_for_transaction_receipt(approve_hash)
            if approve_receipt.status != 1:
                print("批准交易失败")
                return None
    
            # swap 交易使用下一个 nonce
            swap_nonce = current_nonce + 1
    
            path = [token_in, token_out]
            deadline = int(time.time()) + 600  # 10 分钟
    
            swap_tx = self.swap_router_contract.functions.swapExactTokensForTokens(
                amount_in,
                amount_out_min,
                path,
                self.wallet_address,
                deadline
            ).build_transaction({
                'from': self.wallet_address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': swap_nonce,
                'chainId': self.chain_id
            })
    
            signed_swap = self.w3.eth.account.sign_transaction(swap_tx, self.private_key)
            swap_hash = self.w3.eth.send_raw_transaction(signed_swap.rawTransaction)
            print(f"交易已发送: {swap_hash.hex()}")
    
            try:
                swap_receipt = self.w3.eth.wait_for_transaction_receipt(swap_hash, timeout=300)
                if swap_receipt.status == 1:
                    print(f"Swap 成功! Status: {swap_receipt.status}")
                    return swap_receipt
                else:
                    print(f"Swap 失败! Status: {swap_receipt.status}")
                    return None
            except TransactionNotFound:
                print("交易未确认，可能失败。")
                return None
        except Exception as e:
            print(f"交易执行错误: {e}")
            return None
            
    def get_balance(self, token_address=None):
        """获取指定代币的余额，默认获取 USDT 和 WHSK 余额"""
        try:
            if token_address:
                token_contract = self.w3.eth.contract(address=token_address, abi=self.erc20_abi)
                balance = token_contract.functions.balanceOf(self.wallet_address).call()
                return balance
            else:
                usdt_balance = self.usdt_contract.functions.balanceOf(self.wallet_address).call()
                whsk_balance = self.whsk_contract.functions.balanceOf(self.wallet_address).call()
                return {
                    'usdt': usdt_balance / 10**self.usdt_decimals,
                    'whsk': whsk_balance / 10**self.whsk_decimals
                }
        except Exception as e:
            print(f"获取余额出错: {e}")
            return 0 if token_address else {'usdt': 0, 'whsk': 0}

# 示例使用
if __name__ == "__main__":
    try:
        # 初始化 HashKey 操作类
        hashkey_ops = HashKeyOps(private_key_file="private_key_c85.txt")
        print(f"已连接到 HashKey 链，链 ID: {hashkey_ops.chain_id}")
        print(f"钱包地址: {hashkey_ops.wallet_address}")
        
        # 获取价格
        price, reserve0, reserve1 = hashkey_ops.get_price()
        print(f"WHSK 当前价格: {price:.10f} USDT")
        print(f"Reserve0: {reserve0}, Reserve1: {reserve1}")
        
        # 获取余额
        balances = hashkey_ops.get_balance()
        print(f"USDT 余额: {balances['usdt']:.6f}")
        print(f"WHSK 余额: {balances['whsk']:.6f}")
        
        # 如需执行交易，请取消下面的注释
        # amount_in_usd = 10  # 10 USDT
        # receipt = hashkey_ops.swap(amount_in_usd, buy_whsk=True)
        # if receipt:
        #     print(f"交易成功，交易哈希: {receipt.transactionHash.hex()}")
        
    except Exception as e:
            print(f"错误: {e}")