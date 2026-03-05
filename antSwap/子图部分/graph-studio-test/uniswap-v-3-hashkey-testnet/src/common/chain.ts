import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x4Bba6F8eC4c5FC45338F25c75E3f018Aa3DCA48D'

export const REFERENCE_TOKEN = '0xca8aaceec5db1e91b9ed3a344ba026c4a2b3ebf6' // WHSK
export const STABLE_TOKEN_POOL = '0x17e8d1e03e8166b5b6a1be036c51c59faf16e224' // WHSK/USDT 0.05%

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
//export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('100')
// 延迟初始化，避免模块加载顺序问题
export function getMinimumNativeLocked(): BigDecimal {
  return BigDecimal.fromString('100')
}


export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  REFERENCE_TOKEN, // WETH
  '0x60efca24b785391c6063ba37ff917ff0edeb9f4a', // TEST USDT (USDT)
  '0xe8bbe0e706ebdab3be224edf2fe6ffff16df1ac1', // TEST HongKong Dollar A
]

export const STABLE_COINS: string[] = [
  '0x60efca24b785391c6063ba37ff917ff0edeb9f4a', // TEST USDT (USDT)
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
