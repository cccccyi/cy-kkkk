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
  if (!apiData || !apiData.tokens) return { topTokens: [] }

  return {
    topTokens: apiData.tokens.map((t: any, index: number) => {
      const address = t.id
      return {
        __typename: "Token",
        id: `VG9rZW46${address}`, // 这里我直接用 id 拼接，你可以改成 base64 或其他逻辑
        name: t.name,
        chain: "HASHKEY", // 固定值，你也可以根据请求参数 chain 动态赋值
        address,
        symbol: t.symbol,
        standard: "ERC20",
        candlestickData24h:t.candlestickData24h,
        market: {
          __typename: "TokenMarket",
          id: `market-${index}`,
          totalValueLocked: {
            __typename: "Amount",
            id: `tvl-${index}`,
            value: parseFloat(t.totalValueLockedUSD),
            currency: "USD",
          },
          price: {
            __typename: "Amount",
            id: `price-${index}`,
            value: parseFloat(t.currentPrice),
            currency: "USD",
          },
          pricePercentChange: {
            __typename: "Amount",
            id: `pc-${index}`,
            value: parseFloat(t.priceChange24h),
            currency: "USD",
          },
          volume: {
            __typename: "Amount",
            id: `vol-${index}`,
            value: parseFloat(t.volumeUSD),
            currency: "USD",
          },
        },
        project: {
          __typename: "TokenProject",
          id: `proj-${index}`,
          logoUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`,
        },
      }
    }),
  }
}


function transformTokens2(filteredTokens: any, sampleSize = 100) {
  const result: Record<string, any[]> = {};

  filteredTokens.forEach((token: any) => {
    const { address, candlestickData24h } = token;
    if (!candlestickData24h || candlestickData24h.length === 0) {
      result[address] = [];
      return;
    }

    const total = candlestickData24h.length;
    const step = Math.floor(total / sampleSize); // 均匀步长
    const sampled: any[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const index = i * step;
      if (index >= total) break;
      const { timestamp, close } = candlestickData24h[index];

      // 构造 GraphQL 风格 ID
      const id =
        typeof btoa !== "undefined"
          ? btoa(`TimestampedAmount:${i}_${timestamp}_USD`)
          : Buffer.from(`TimestampedAmount:${i}_${timestamp}_USD`).toString("base64");

      sampled.push({
        __typename: "TimestampedAmount",
        id,
        timestamp,
        value: Number(close) // 如果需要固定为 1，这里改成 1
      });
    }

    result[address] = sampled;
  });

  return result;
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

  const [data, setData] = useState<TopTokens100Query | undefined>()
  const [loadingTokens, setLoadingTokens] = useState(true)
  const fetchTokens = useCallback(async () => {
    setLoadingTokens(true)
    try {
      //查代币列表
      const res = await fetch(process.env.REACT_APP_BASEAPI + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            "query": "query getTokens($first: Int!, $skip: Int!) { tokens(first: $first, skip: $skip) { id name symbol poolCount totalSupply totalValueLocked totalValueLockedUSD totalValueLockedUSDUntracked txCount untrackedVolumeUSD volume volumeUSD feesUSD derivedETH decimals currentPrice priceChange1h priceChange24h volumeUSD1h volumeUSD1d volumeUSD1w volumeUSD1m volumeUSD1y candlestickData24h { timestamp close } } }",
            "variables": { "first": 100, "skip": 0 }
          }
        ),
      })
      const result = await res.json()
      // ⚡️ 这里先直接把返回结果放到 data
      const transformed = transformTokens(result.data)
      //本地模拟数据
  //   console.log('开始获取代币列表数据')
  
      setData(transformed)
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
  //开启轮询获取列表
  //   const { data, loading: loadingTokens } = usePollQueryWhileMounted(
  //     // useTopTokens100Query({
  //     //   variables: { duration, chain },
  //     // }),
  //     useTopTokens100QueryCustom({
  //       variables: { duration, chain },
  //     }),
  //     PollingInterval.Fast
  //   )


  // const { data, loading: loadingTokens } = usePollQueryWhileMounted(
  //   () => useTopTokens100QueryCustom({ variables: { duration, chain } }),
  //   PollingInterval.Fast
  // )

//  const data = {
  //   topTokens: [
  //     {
  //       __typename: "Token",
  //       id: "VG9rZW46RVRIRVJFVU1fMHhjMDJhYWEzOWIyMjNmZThkMGEwZTVjNGYyN2VhZDkwODNjNzU2Y2My",
  //       name: "Wrapped Ether",
  //       chain: "ETHEREUM",
  //       address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  //       symbol: "WETH",
  //       standard: "ERC20",
  //       market: {
  //         __typename: "TokenMarket",
  //         id: "mock-market-1",
  //         totalValueLocked: { __typename: "Amount", id: "mock-tvl-1", value: 1489717700.02, currency: "USD" },
  //         price: { __typename: "Amount", id: "mock-price-1", value: 4333.60, currency: "USD" },
  //         pricePercentChange: { __typename: "Amount", id: "mock-pc-1", value: -6.01, currency: "USD" },
  //         volume: { __typename: "Amount", id: "mock-vol-1", value: 1289785711.76, currency: "USD" }
  //       },
  //       project: { __typename: "TokenProject", id: "mock-proj-1", logoUrl: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" }
  //     },
  //     {
  //       __typename: "Token",
  //       id: "VG9rZW46RVRIRVJFVU1fMHhkYWMxN2Y5NThkMmVlNTIzYTIyMDYyMDY5OTQ1OTdjMTNkODMxZWM3",
  //       name: "Tether111 USD",
  //       chain: "ETHEREUM",
  //       address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  //       symbol: "USDT",
  //       standard: "ERC20",
  //       market: {
  //         __typename: "TokenMarket",
  //         id: "mock-market-2",
  //         totalValueLocked: { __typename: "Amount", id: "mock-tvl-2", value: 218797902.66, currency: "USD" },
  //         price: { __typename: "Amount", id: "mock-price-2", value: 1, currency: "USD" },
  //         pricePercentChange: { __typename: "Amount", id: "mock-pc-2", value: 0, currency: "USD" },
  //         volume: { __typename: "Amount", id: "mock-vol-2", value: 715662466.69, currency: "USD" }
  //       },
  //       project: { __typename: "TokenProject", id: "mock-proj-2", logoUrl: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597c13d831ec7/logo.png" }
  //     }
  //   ]
  // } as unknown as TopTokens100Query;

  //只请求一次，和上面一个效果, 但是不轮询
  // const { data, loading: loadingTokens2, error } = useTopTokens100Query({
  //   variables: { duration, chain },
  // })
  // const loadingTokens = false

  const unwrappedTokens = useMemo(() => data?.topTokens?.map((token) => unwrapToken(chainId, token)), [chainId, data])

  const sortedTokens = useSortedTokens(unwrappedTokens)
  const tokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur.address) return acc
        return {
          ...acc,
          [cur.address]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )
  const filteredTokens = useFilteredTokens(sortedTokens)
  
  //先定义一个空的走势图变量
  const sparklines: SparklineMap = transformTokens2(filteredTokens?? [], 100);
  return useMemo(
    () => ({ tokens: filteredTokens, tokenSortRank, loadingTokens, sparklines }),
    [filteredTokens, tokenSortRank, loadingTokens, sparklines]
  )
}
