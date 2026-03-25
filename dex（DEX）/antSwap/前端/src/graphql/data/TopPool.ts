import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import {
  Chain,
  TopTokens100Query,
  useTopTokens100Query,
  useTopTokensSparklineQuery,
} from './__generated__/types-and-hooks'
import {
  CHAIN_NAME_TO_CHAIN_ID,
  isPricePoint,
  PollingInterval,
  PricePoint,
  toHistoryDuration,
  unwrapToken,
  usePollQueryWhileMounted,
} from './util'
import { useEffect, useState, useCallback } from 'react'


function useSortedTokens(tokens: TopTokens100Query['topTokens']) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  return useMemo(() => {
    if (!tokens) return undefined
    let tokenArray = Array.from(tokens)
    switch (sortMethod) {
      case TokenSortMethod.PRICE:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.price?.value ?? 0) - (a?.market?.price?.value ?? 0))
        break
      case TokenSortMethod.PERCENT_CHANGE:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.pricePercentChange?.value ?? 0) - (a?.market?.pricePercentChange?.value ?? 0)
        )
        break
      case TokenSortMethod.TOTAL_VALUE_LOCKED:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.totalValueLocked?.value ?? 0) - (a?.market?.totalValueLocked?.value ?? 0)
        )
        break
      case TokenSortMethod.VOLUME:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.volume?.value ?? 0) - (a?.market?.volume?.value ?? 0))
        break
    }

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}
function useFilteredTokens(tokens: TopTokens100Query['topTokens']) {
  //搜索关键字
  const filterString = useAtomValue(filterStringAtom)
  console.log('filterString: ', filterString);

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) return undefined
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      })
    }
    return returnTokens
  }, [tokens, lowercaseFilterString])
}

// Number of items to render in each fetch in infinite scroll.
export const PAGE_SIZE = 100
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]

interface UseTopTokensReturnValue {
  tokens: TopToken[] | undefined
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
}

// 数据转换方法
function transformTokens(apiData: any) {
 if (!apiData || !apiData.pools) return apiData

  const pools = apiData.pools.map((pool: any) => {
    return {
      ...pool,
      token0: pool.token0
        ? { ...pool.token0, address: pool.token0.id }
        : pool.token0,
      token1: pool.token1
        ? { ...pool.token1, address: pool.token1.id }
        : pool.token1,
    }
  })

  return { ...apiData, pools }
}


export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  //传过来的chainName
  console.log('useTopTokens chain: ', chain);
  const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]

  //日期范围
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  console.log('duration: ', duration);

  //搜索关键字
  // const filterString = useAtomValue(filterStringAtom)
  // console.log('filterString: ', filterString);

  //开启轮询获取线
  // const { data: sparklineQuery } = usePollQueryWhileMounted(
  //   useTopTokensSparklineQuery({
  //     variables: { duration, chain },
  //   }),
  //   PollingInterval.Slow
  // )

  // const sparklines = useMemo(() => {
  //   const unwrappedTokens = sparklineQuery?.topTokens?.map((topToken) => unwrapToken(chainId, topToken))
  //   const map: SparklineMap = {}
  //   unwrappedTokens?.forEach(
  //     (current) => current?.address && (map[current.address] = current?.market?.priceHistory?.filter(isPricePoint))
  //   )
  //   return map
  // }, [chainId, sparklineQuery?.topTokens])
  //先定义一个空的走势图变量
  const sparklines: SparklineMap = {}
  const [data, setData] = useState<TopTokens100Query | undefined>()
  const [loadingTokens, setLoadingTokens] = useState(true)
  const fetchTokens = useCallback(async () => {
    setLoadingTokens(true)
    try {
      //查池子列表
      const res = await fetch(process.env.REACT_APP_BASEAPI + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            "query": "query getPools($first: Int!, $skip: Int!) { pools(first: $first, skip: $skip) { id volumeUSD volumeToken1 volumeToken0 untrackedVolumeUSD txCount totalValueLockedUSDUntracked totalValueLockedUSD totalValueLockedToken1 totalValueLockedToken0 token1Price totalValueLockedETH token0Price tick sqrtPrice observationIndex liquidityProviderCount liquidity feesUSD feeTier createdAtTimestamp createdAtBlockNumber collectedFeesUSD collectedFeesToken1 collectedFeesToken0 token0 { id symbol } token1 { id symbol } volumeUSD1D volumeUSD30D } }", 
            "variables": {"first": 10, "skip": 0}
          }
        ),
      })
      const result = await res.json()
      setData(transformTokens(result.data))
      setLoadingTokens(false)
    } catch (err) {
      console.error('获取代币数据失败', err)
      setLoadingTokens(false)
    }
  }, [chain, duration])

  // ✅ 触发请求
  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // 拿到数据后开始处理
  console.log('拿到数据后开始处理');
  // const unwrappedTokens = useMemo(() => data?.topTokens?.map((token) => unwrapToken(chainId, token)), [chainId, data])
  //不对数据进行校验
  const unwrappedTokens = useMemo(
    () => (data as any)?.pools ?? [],
    [chainId, data]
  )

  //按照用户操作进行排序，目前进入这个方法无效，因为数据里没有他的默认排序字段，默认字段是存在state里的
  const sortedTokens = useSortedTokens(unwrappedTokens)


  //生成排序映射数组，单独一个新的，原来是用的address字段，这边换成id字段
  const tokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur.id) return acc
        return {
          ...acc,
          [cur.id]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )

  //按照用户输入的关键字过滤  
  const filteredTokens = useFilteredTokens(sortedTokens)


  return useMemo(
    () => ({ tokens: filteredTokens, tokenSortRank, loadingTokens, sparklines }),
    [filteredTokens, tokenSortRank, loadingTokens, sparklines]
  )
}
