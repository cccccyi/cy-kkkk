import type { TransactionResponse } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { addTransaction } from './reducer'
import { TransactionDetails, TransactionInfo, TransactionType } from './types'


import { nativeOnChain } from '../../constants/tokens'


export function debugWrapped(chainId: number) {
  console.log('--- Debug wrapped start ---')
  console.log('chainId passed in:', chainId)

  // 获取 native currency
  let nativeCurrency
  try {
    nativeCurrency = nativeOnChain(chainId)
    console.log('nativeOnChain returned:', nativeCurrency.constructor.name)
  } catch (e) {
    console.error('Error in nativeOnChain:', e)
    return
  }

  // 尝试访问 wrapped
  try {
    const wrapped = nativeCurrency.wrapped
    console.log('wrapped token:', wrapped)
  } catch (e) {
    console.error('Error accessing wrapped:', e)
  }

  console.log('--- Debug wrapped end ---')
}


// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (response: TransactionResponse, info: TransactionInfo) => void {
  const { chainId, account } = useWeb3React()
  console.log('useTransactionAdder', chainId, account)
  const dispatch = useAppDispatch()
  return useCallback(
    (response: TransactionResponse, info: TransactionInfo) => {
      if (!account) return
      if (!chainId) return
      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
   // alert('移除完成')
      console.log(hash);
      console.log(account);
      console.log(info);
      console.log(chainId);
      debugWrapped(chainId)
      //前端页面发送通知，之前报错就是这里引起的
      dispatch(addTransaction({ hash, from: account, info, chainId }))
    },
    [account, chainId, dispatch]
  )
}

export function useMultichainTransactions(): [TransactionDetails, SupportedChainId][] {
  const state = useAppSelector((state) => state.transactions)
  return ALL_SUPPORTED_CHAIN_IDS.flatMap((chainId) =>
    state[chainId]
      ? Object.values(state[chainId]).map((tx): [TransactionDetails, SupportedChainId] => [tx, chainId])
      : []
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useWeb3React()

  const state = useAppSelector((state) => state.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

export function useTransaction(transactionHash?: string): TransactionDetails | undefined {
  const allTransactions = useAllTransactions()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return !transactions[transactionHash].receipt
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return Boolean(transactions[transactionHash].receipt)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(token?: Token, spender?: string): boolean {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof token?.address === 'string' &&
      typeof spender === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash]
        if (!tx) return false
        if (tx.receipt) {
          return false
        } else {
          if (tx.info.type !== TransactionType.APPROVAL) return false
          return tx.info.spender === spender && tx.info.tokenAddress === token.address && isTransactionRecent(tx)
        }
      }),
    [allTransactions, spender, token?.address]
  )
}
