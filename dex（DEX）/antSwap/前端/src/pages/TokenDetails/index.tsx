import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useState,useCallback} from 'react'
import { useParams } from 'react-router-dom'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)
//转换返回值的格式
function toBase64(str:any) {
  return Buffer.from(str).toString("base64")
}
function transformTokenData(raw: any) {
  const token = raw.token
  // 主 token id
  const tokenId = toBase64(`Token:HASHKEY_TESTNET_${token.id}`)
  return {
    token: {
      __typename: "Token",
      id: tokenId,
      decimals: Number(token.decimals),
      name: token.name,
      chain: "HASHKEY",
      address: token.id,
      symbol: token.symbol,
      standard: "ERC20",

      market: {
        __typename: "TokenMarket",
        id: toBase64(`TokenMarket:HASHKEY_TESTNET_${token.id}_USD`),

        totalValueLocked: {
          __typename: "Amount",
          id: toBase64(`Amount:${token.totalValueLockedUSD}_USD`),
          value: Number(token.totalValueLockedUSD),
          currency: "USD"
        },

        price: {
          __typename: "Amount",
          id: toBase64(`Amount:${token.derivedETH}_USD`),
          value: Number(token.derivedETH),
          currency: "USD"
        },

        volume24H: {
          __typename: "Amount",
          id: toBase64(`Amount:${token.volumeUSD1d}_USD`),
          value: Number(token.volumeUSD1d),
          currency: "USD"
        },

        priceHigh52W: {
          __typename: "Amount",
          id: toBase64(`Amount:${token.highPrice52w}_USD`),
          value: Number(token.highPrice52w),
          currency: "USD"
        },

        priceLow52W: {
          __typename: "Amount",
          id: toBase64(`Amount:${token.lowPrice52w}_USD`),
          value: Number(token.lowPrice52w),
          currency: "USD"
        }
      },

      project: {
        __typename: "TokenProject",
        id: toBase64(`TokenProject:HASHKEY_TESTNET_${token.id}_${token.name}`),
        description: token.description || "",
        homepageUrl: token.homepageUrl || "",
        twitterName: token.twitterName || "",
        logoUrl: token.logoUrl || "",
        tokens: [
          {
            __typename: "Token",
            id: tokenId,
            chain: "HASHKEY",
            address: token.id
          }
        ]
      }
    }
  }
}
export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{
    tokenAddress: string
    chainName?: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)
  const [detailedTokenAddress, duration] = useMemo(
    /* tokenAddress will always be defined in the path for for this page to render, but useParams will always
      return optional arguments; nullish coalescing operator is present here to appease typechecker */
    () => [isNative ? getNativeTokenDBAddress(chain) : tokenAddress ?? '', toHistoryDuration(timePeriod)],
    [chain, isNative, timePeriod, tokenAddress]
  )
  const parsedQs = useParsedQueryString()
  const parsedInputTokenAddress: string | undefined = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])
  // console.log('地址地址地址',detailedTokenAddress);
  // console.log('链链链',chain);
  const [tokenQuery, setTokenQuery] = useState<any>(undefined)
  const fetchTokens = useCallback(async () => {
   
    try {
      //查代币详情
      const res = await fetch(process.env.REACT_APP_BASEAPI + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
            {
              "query": "query getToken($id: String!, $timeRange: String!) { token(id: $id, timeRange: $timeRange) { id name symbol poolCount totalSupply totalValueLocked totalValueLockedUSD totalValueLockedUSDUntracked txCount untrackedVolumeUSD volume volumeUSD feesUSD derivedETH decimals volumeUSD1d volumeUSD1w volumeUSD1m volumeUSD1y highPrice52w lowPrice52w description candlestickData24h { timestamp close } } }", 
              "variables": {"id": detailedTokenAddress, "timeRange":"1W"}
            }
        ),
      })
       const result = await res.json()
        //console.log('线线线线线线线线线线线线线线线线线线线线'+JSON.stringify(result.data));
       const fdata = transformTokenData(result.data);
       //console.log('整理后的数据',JSON.stringify(fdata));
       setTokenQuery(fdata)
    } catch (err) {
      console.error('获取代币数据失败', err)
    }
  },[detailedTokenAddress, chain])

  // ✅ 触发请求
  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  console.log('详情',JSON.stringify(tokenQuery));

  //获取代币详情
  // const { data: tokenQuery } = useTokenQuery({
  //   variables: {
  //     address: detailedTokenAddress,
  //     chain,
  //   },
  //   errorPolicy: 'all',
  // })



  //获取代币走势详情
  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
      duration,
    },
    errorPolicy: 'all',
  })
  

  // Saves already-loaded chart data into state to display while tokenPriceQuery is undefined timePeriod input changes
  const [currentPriceQuery, setCurrentPriceQuery] = useState(tokenPriceQuery)
  useEffect(() => {
    if (tokenPriceQuery) setCurrentPriceQuery(tokenPriceQuery)
  }, [setCurrentPriceQuery, tokenPriceQuery])

  //进来先走这里
  if (!tokenQuery) return <TokenDetailsPageSkeleton />


  return (
    <TokenDetails
      urlAddress={tokenAddress}
      chain={chain}
      tokenQuery={tokenQuery}
      tokenPriceQuery={currentPriceQuery}
      onChangeTimePeriod={setTimePeriod}
      inputTokenAddress={parsedInputTokenAddress}
    />
  )
}
