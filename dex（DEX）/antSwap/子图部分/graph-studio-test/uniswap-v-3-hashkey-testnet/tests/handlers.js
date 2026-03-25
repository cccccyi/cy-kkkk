const { handlePoolCreated } = require("../src/v3/mappings/factory.ts");

// 模拟 AssemblyScript 的类型（用 JS 对象代替）
const ZERO_BI = BigInt(0)
const ZERO_BD = 0.0

// 模拟实体存储
const Store = {
  Pool: new Map(),
  Token: new Map(),
  Factory: new Map(),
  Bundle: new Map()
}

// mock 函数
function EntityLoad(entityType, id) {
  return Store[entityType].get(id) || null
}

function EntitySave(entityType, id, obj) {
  Store[entityType].set(id, obj)
}

// mock log
const log = {
  debug: (msg, args) => console.log("[DEBUG]", msg, args)
}

// 模拟 PoolCreated 事件
const mockEvent = {
  params: {
    pool: "0x5aeBd0791FBe9e3AC62C0121b9Bfcfdd13564727",
    token0: "0x60EFCa24B785391C6063ba37fF917Ff0edEb9f4a",
    token1: "0xE8bbE0E706EbDaB3Be224edf2FE6fFff16df1AC1",
    fee: 3000
  },
  block: {
    timestamp: Math.floor(Date.now() / 1000),
    number: 123456
  }
}

// 可以在 handler 内把 Entity.load/save 替换为 EntityLoad/EntitySave
async function testHandlePoolCreated() {
  await handlePoolCreated(mockEvent, { EntityLoad, EntitySave, log, ZERO_BI, ZERO_BD })
  console.log("Pools:", Store.Pool)
  console.log("Tokens:", Store.Token)
  console.log("Factory:", Store.Factory)
}

testHandlePoolCreated()
