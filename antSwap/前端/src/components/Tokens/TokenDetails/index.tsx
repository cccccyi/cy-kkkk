import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, Field } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AboutSection } from 'components/Tokens/TokenDetails/About'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { useEffect, useRef } from 'react';

import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import TokenDetailsSkeleton, {
  Hr,
  LeftPanel,
  RightPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget from 'components/Widget'
import { SwapTokens } from 'components/Widget/inputs'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { TokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { Chain, TokenQuery, TokenQueryData } from 'graphql/data/Token'
import { QueryToken } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { getTokenAddress } from 'lib/utils/analytics'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { OnChangeTimePeriod } from './ChartSection'
import InvalidTokenDetails from './InvalidTokenDetails'

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

const ChartBuild = styled.div`
  margin-bottom:50px;
  margin-top:20px;
`

function useOnChainToken(address: string | undefined, skip: boolean) {
  const token = useTokenFromActiveNetwork(skip || !address ? undefined : address)

  if (skip || !address || (token && token?.symbol === UNKNOWN_TOKEN_SYMBOL)) {
    return undefined
  } else {
    return token
  }
}

function useRelevantToken(
  address: string | undefined,
  pageChainId: number,
  tokenQueryData: TokenQueryData | undefined
) {
  const { chainId: activeChainId } = useWeb3React()
  const queryToken = useMemo(() => {
    if (!address) return undefined
    if (address === NATIVE_CHAIN_ID) return nativeOnChain(pageChainId)
    if (tokenQueryData) return new QueryToken(address, tokenQueryData)
    return undefined
  }, [pageChainId, address, tokenQueryData])

  const skipOnChainFetch = Boolean(queryToken) || pageChainId !== activeChainId
  const onChainToken = useOnChainToken(address, skipOnChainFetch)

  return useMemo(
    () => ({ token: queryToken ?? onChainToken, didFetchFromChain: !queryToken }),
    [onChainToken, queryToken]
  )
}

type TokenDetailsProps = {
  urlAddress: string | undefined
  inputTokenAddress?: string
  chain: Chain
  tokenQuery: TokenQuery
  tokenPriceQuery: TokenPriceQuery | undefined
  onChangeTimePeriod: OnChangeTimePeriod
}
export default function TokenDetails({
  urlAddress,
  inputTokenAddress,
  chain,
  tokenQuery,
  tokenPriceQuery,
  onChangeTimePeriod,
}: TokenDetailsProps) {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

// 模拟 30 天 HSK K 线数据
const generateMockHSKData = () => {
  const data: CandlestickData[] = [];
  let basePrice = 10; // 起始价格
  for (let i = 1; i <= 30; i++) {
    const open = parseFloat((basePrice + Math.random() * 2 - 1).toFixed(2));
    const close = parseFloat((open + Math.random() * 2 - 1).toFixed(2));
    const high = Math.max(open, close) + parseFloat((Math.random()).toFixed(2));
    const low = Math.min(open, close) - parseFloat((Math.random()).toFixed(2));
    data.push({
      time: `2025-09-${i < 10 ? '0' + i : i}`, // 2025-09-01 到 2025-09-30
      open,
      high,
      low,
      close,
    });
    basePrice = close; // 下一个 open 基于今天的 close
  }
  return data;
};
const mockHSKData = generateMockHSKData();

//console.log('可可可可可可可可可可可'+JSON.stringify(mockHSKData));

  // useEffect(() => {
  //   if (!chartContainerRef.current) return;

  //   const chartOptions = {
  //      layout: {
  //         textColor: 'white',
  //         background: { type: 'solid', color: 'rgba(0,0,0,0)' },
  //       },
  //         grid: {
  //         vertLines: {
  //           color: 'rgba(255, 255, 255, 0.1)', // 调整竖线颜色
  //         },
  //         horzLines: {
  //           color: 'rgba(255, 255, 255, 0.1)', // 调整横线颜色
  //         },
  //       },
        
  //     width: chartContainerRef.current.clientWidth,
  //     height: 430,
  //     rightPriceScale: { visible: true },
  //     timeScale: { visible: true },
  //   } as any;

  //   const chart = createChart(chartContainerRef.current, chartOptions);
  //   chartRef.current = chart;

  //   const candleSeries = chart.addCandlestickSeries({
  //     upColor: '#4caf50',
  //     downColor: '#f44336',
  //     borderVisible: false,
  //     wickUpColor: '#4caf50',
  //     wickDownColor: '#f44336',
  //   });
  //   candleSeries.setData(mockHSKData);
  //   candleSeriesRef.current = candleSeries;

  //   return () => {
  //     chart.remove();
  //   };
  // }, []);


useEffect(() => {
  if (!chartContainerRef.current) return;
    const chartOptions = {
      layout: {
        textColor: 'white',
        background: { type: 'solid', color: 'rgba(0,0,0,0)' },
      },
      grid: {
        vertLines: {
          color: 'rgba(255, 255, 255, 0.05)', // 调整竖线颜色
        },
        horzLines: {
          color: 'rgba(255, 255, 255, 0.1)', // 调整横线颜色
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 430,
      rightPriceScale: { visible: true },
      timeScale: { 
        visible: true,
       barSpacing: 20,         // 每根柱子间距，默认是6，增大就更分散
      },
    } as any;

  const chart = createChart(chartContainerRef.current,chartOptions);

  chartRef.current = chart;

  const candleSeries = chart.addCandlestickSeries({
    upColor: '#cf3024',   // 红涨
    downColor: '#3e872a', // 绿跌
    borderUpColor: '#cf3024',
    borderDownColor: '#3e872a',
    wickUpColor: '#cf3024',
    wickDownColor: '#3e872a',
  });

  candleSeries.setData(mockHSKData);
  candleSeriesRef.current = candleSeries;

  return () => chart.remove();
}, []);



  if (!urlAddress) throw new Error('Invalid token details route: tokenAddress param is undefined')
  const address = useMemo(
    () => (urlAddress === NATIVE_CHAIN_ID ? urlAddress : isAddress(urlAddress) || undefined),
    [urlAddress]
  )

  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const tokenQueryData = tokenQuery.token
  const crossChainMap = useMemo(
    () =>
      tokenQueryData?.project?.tokens.reduce((map, current) => {
        if (current) map[current.chain] = current.address
        return map
      }, {} as { [key: string]: string | undefined }) ?? {},
    [tokenQueryData]
  )

  const { token: detailedToken, didFetchFromChain } = useRelevantToken(address, pageChainId, tokenQueryData)
  const { token: inputToken } = useRelevantToken(inputTokenAddress, pageChainId, undefined)

  const tokenWarning = address ? checkWarning(address) : null
  const isBlockedToken = tokenWarning?.canProceed === false
  const navigate = useNavigate()

  const [isPending, startTokenTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (update: Chain) => {
      if (!address) return
      const bridgedAddress = crossChainMap[update]
      if (bridgedAddress) {
        startTokenTransition(() => navigate(getTokenDetailsURL({ address: bridgedAddress, chain: update })))
      } else if (didFetchFromChain || detailedToken?.isNative) {
        startTokenTransition(() => navigate(getTokenDetailsURL({ address, chain: update })))
      }
    },
    [address, crossChainMap, didFetchFromChain, navigate, detailedToken?.isNative]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)

  const navigateToWidgetSelectedToken = useCallback(
    (tokens: SwapTokens) => {
      const newDefaultToken = tokens[Field.OUTPUT] ?? tokens.default
      const address = newDefaultToken?.isNative ? NATIVE_CHAIN_ID : newDefaultToken?.address
      startTokenTransition(() =>
        navigate(
          getTokenDetailsURL({
            address,
            chain,
            inputAddress: tokens[Field.INPUT] ? getTokenAddress(tokens[Field.INPUT] as Currency) : null,
          })
        )
      )
    },
    [chain, navigate]
  )

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()
  const [openTokenSafetyModal, setOpenTokenSafetyModal] = useState(false)
  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(address, pageChainId) && tokenWarning !== null
  const onReviewSwapClick = useCallback(
    () => new Promise<boolean>((resolve) => (shouldShowSpeedbump ? setContinueSwap({ resolve }) : resolve(true))),
    [shouldShowSpeedbump]
  )
  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap]
  )

  if (detailedToken === undefined || !address) {
    return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!address} />
  }

  return (
    <Trace
      page={InterfacePageName.TOKEN_DETAILS_PAGE}
      properties={{ tokenAddress: address, tokenName: detailedToken?.name }}
      shouldLogImpression
    >
      <TokenDetailsLayout>
        {detailedToken && !isPending ? (
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chain.toLowerCase()}`}>
              <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
            </BreadcrumbNavLink>
            <TokenInfoContainer data-testid="token-info-container">
              <TokenNameCell>
                <CurrencyLogo currency={detailedToken} size="32px" hideL2Icon={false} />
                {detailedToken.name ?? <Trans>Name not found</Trans>}
                <TokenSymbol>{detailedToken.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
              </TokenNameCell>
              <TokenActions>
                {/* <ShareButton currency={detailedToken} /> */}
              </TokenActions>
            </TokenInfoContainer>
            <ChartBuild ref={chartContainerRef} />
            <StatsSection
              chainId={pageChainId}
              address={address}
              TVL={tokenQueryData?.market?.totalValueLocked?.value}
              volume24H={tokenQueryData?.market?.volume24H?.value}
              priceHigh52W={tokenQueryData?.market?.priceHigh52W?.value}
              priceLow52W={tokenQueryData?.market?.priceLow52W?.value}
            />
            <Hr />
            <AboutSection
              address={address}
              chainId={pageChainId}
              description={tokenQueryData?.project?.description}
              homepageUrl={tokenQueryData?.project?.homepageUrl}
              twitterName={tokenQueryData?.project?.twitterName}
            />
            {!detailedToken.isNative && <AddressSection address={address} />}
          </LeftPanel>
        ) : (
          <TokenDetailsSkeleton />
        )}

        {/* <RightPanel onClick={() => isBlockedToken && setOpenTokenSafetyModal(true)}>
          <div style={{ pointerEvents: isBlockedToken ? 'none' : 'auto' }}>
            Widget 组件可以放这里 
          </div>
          {detailedToken && <BalanceSummary token={detailedToken} />}
        </RightPanel> */}
        {/* {detailedToken && <MobileBalanceSummaryFooter token={detailedToken} />} */}

        {/* <TokenSafetyModal
          isOpen={openTokenSafetyModal || !!continueSwap}
          tokenAddress={address}
          onContinue={() => onResolveSwap(true)}
          onBlocked={() => { setOpenTokenSafetyModal(false) }}
          onCancel={() => onResolveSwap(false)}
          showCancel={true}
        /> */}
      </TokenDetailsLayout>
    </Trace>
  )
}
