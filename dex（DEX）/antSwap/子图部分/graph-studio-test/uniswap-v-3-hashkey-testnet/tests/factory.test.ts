import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  createMockedFunction
} from "matchstick-as/assembly/index"
import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts"
// import { FeeAmountEnabled } from "../generated/schema"
// import { FeeAmountEnabled as FeeAmountEnabledEvent } from "../generated/Factory/Factory"
// import { handleFeeAmountEnabled } from "../src/uniswap-v-3-factory"
import { handlePoolCreated } from "../src/v3/mappings/factory"
import { createPoolCreatedEvent } from "./factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

// 同时 mock name/symbol/decimals(total: 两种签名)/totalSupply
function mockErc20(
  token: Address,
  name: string,
  symbol: string,
  decimals: i32,
  totalSupply: string
): void {
  // name() -> string
  createMockedFunction(token, "name", "name():(string)")
    .withArgs([])
    .returns([ethereum.Value.fromString(name)])

  // symbol() -> string
  createMockedFunction(token, "symbol", "symbol():(string)")
    .withArgs([])
    .returns([ethereum.Value.fromString(symbol)])

  // decimals() -> uint8  (部分实现/ABI)
  createMockedFunction(token, "decimals", "decimals():(uint8)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(decimals))])

  // decimals() -> uint256  (另一种实现/兼容路径；你现在的错误就是这个签名)
  createMockedFunction(token, "decimals", "decimals():(uint256)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(decimals))])

  // totalSupply() -> uint256
  createMockedFunction(token, "totalSupply", "totalSupply():(uint256)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalSupply))])
}

describe("handlePoolCreated tests", () => {
  beforeAll(() => {
    clearStore()
    const token0 = Address.fromString("0x60EFCa24B785391C6063ba37fF917Ff0edEb9f4a")
    const token1 = Address.fromString("0xE8bbE0E706EbDaB3Be224edf2FE6fFff16df1AC1")
    const fee = 3000
    const tickSpacing = 60
    const pool = Address.fromString("0x5aeBd0791FBe9e3AC62C0121b9Bfcfdd13564727")

    // mock token 元数据，避免测试环境实际链上调用
    mockErc20(token0, "TEST USDT", "USDT", 6,  "1000000000000")                  // 1,000,000,000,000
    mockErc20(token1, "TEST HongKong Dollar A", "HKDA", 18, "1000000000000000000000000") // 1,000,000 * 1e18

    const poolCreatedEvent = createPoolCreatedEvent(token0, token1, fee, tickSpacing, pool)
    handlePoolCreated(poolCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test("Pool created and stored", () => {
    assert.entityCount("Pool", 1)
    assert.fieldEquals(
      "Pool",
      "0x0000000000000000000000000000000000000003",
      "token0",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Pool",
      "0x0000000000000000000000000000000000000003",
      "token1",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "Pool",
      "0x0000000000000000000000000000000000000003",
      "feeTier",
      "3000"
    )
  })

  test("Tokens created and stored", () => {
    assert.entityCount("Token", 2)
    assert.fieldEquals(
      "Token",
      "0x0000000000000000000000000000000000000001",
      "symbol",
      ""
    )
    assert.fieldEquals(
      "Token",
      "0x0000000000000000000000000000000000000002",
      "symbol",
      ""
    )
  })

  test("Factory updated", () => {
    assert.entityCount("Factory", 1)
    // Assuming FACTORY_ADDRESS is defined in the code
    const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    assert.fieldEquals(
      "Factory",
      factoryAddress,
      "poolCount",
      "1"
    )
  })
})

/**
describe("Describe entity assertions", () => {
  beforeAll(() => {
    let fee = 123
    let tickSpacing = 123
    let newFeeAmountEnabledEvent = createFeeAmountEnabledEvent(fee, tickSpacing)
    handleFeeAmountEnabled(newFeeAmountEnabledEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("FeeAmountEnabled created and stored", () => {
    assert.entityCount("FeeAmountEnabled", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FeeAmountEnabled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fee",
      "123"
    )
    assert.fieldEquals(
      "FeeAmountEnabled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tickSpacing",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
*/
