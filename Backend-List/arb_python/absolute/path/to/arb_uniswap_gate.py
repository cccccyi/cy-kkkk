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
                print(f"\n✅ 找到指定 V3 池子:")
                print(f"   地址: {target_pool['pool_address']}")
                print(f"   费率: {target_pool['fee']/10000}%")
                print(f"   流动性: {target_pool['liquidity']}")
                
                # 计算在该池子中的预期输出 HSK 数量
                try:
                    # 假设有一个方法可以估算在特定池子中的输出
                    hsk_out = mainnet_v3_ops.estimate_swap_output(target_pool, amount_usd)
                    print(f"   预期输出 HSK: {hsk_out:.6f}")
                except AttributeError:
                    # 如果 estimate_swap_output 方法不存在，使用原有的 find_best_pool_for_swap 但只传入一个池子
                    _, hsk_out = mainnet_v3_ops.find_best_pool_for_swap([target_pool], amount_usd)
                    print(f"   预期输出 HSK: {hsk_out:.6f}")
                
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