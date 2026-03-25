/* eslint-disable prefer-const */
import { Address, BigInt, log } from '@graphprotocol/graph-ts'


import { ERC20 } from '../../generated/Factory/ERC20'
import { ERC20NameBytes } from '../../generated/Factory/ERC20NameBytes'
import { ERC20SymbolBytes } from '../../generated/Factory/ERC20SymbolBytes'
import { TokenDefinition } from './chain'
import { getStaticDefinition } from './staticTokenDefinition'
import { isNullEthValue } from './utils'

function sanitizeString(str: string): string {
  // 去除非法 UTF-16 字符
  let sanitized = '';
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0xd800 || code > 0xdfff) {
      sanitized += str.charAt(i);
    }
  }
  return sanitized;
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  log.info('Entering fetchTokenSymbol for address: {}', [tokenAddress.toHexString()])  // 记录进入函数和地址

  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    log.debug('Using static definition for symbol: {}', [(staticDefinition as TokenDefinition).symbol])  // 如果使用静态，记录符号
    return (staticDefinition as TokenDefinition).symbol
  }
  let contract = ERC20.bind(tokenAddress)
  log.debug('Bound ERC20 contract at address: {}', [tokenAddress.toHexString()])  // 记录绑定标准合约
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)
  log.debug('Bound ERC20SymbolBytes contract at address: {}', [tokenAddress.toHexString()])  // 记录绑定 bytes32 合约

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  log.info('Called try_symbol (string) on address: {}, reverted: {}', [tokenAddress.toHexString(), symbolResult.reverted.toString()])  // 记录标准调用结果
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    log.info('Called try_symbol (bytes32) on address: {}, reverted: {}', [tokenAddress.toHexString(), symbolResultBytes.reverted.toString()])  // 记录 bytes32 调用结果
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
        log.info('Set symbolValue from bytes32: {}', [symbolValue])  // 记录成功设置的值
      }
    }
  } else {
    symbolValue = symbolResult.value
  }
  log.info('Returning symbolValue: {} for address: {}', [symbolValue, tokenAddress.toHexString()])  // 记录最终返回

  return sanitizeString(symbolValue)
}

export function fetchTokenName(tokenAddress: Address): string {
  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).name
  }
  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return sanitizeString(nameValue)
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = BigInt.zero()
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt | null {
  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).decimals
  }
  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals

  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    if (decimalResult.value.lt(BigInt.fromI32(255))) {
      return decimalResult.value
    }
  }

  return null
}
