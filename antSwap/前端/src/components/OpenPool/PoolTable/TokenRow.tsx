import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { formatNumber, formatUSDPrice, NumberType } from '@uniswap/conedison/format'
import { ParentSize } from '@visx/responsive'
import SparklineChart from 'components/Charts/SparklineChart'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL, validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ForwardedRef, forwardRef } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ClickableStyle } from 'theme'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../constants'
import { LoadingBubble } from '../loading'
import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
  useSetSortMethod,
} from '../state'
import { ArrowCell, DeltaText, formatDelta, getDeltaArrow } from '../TokenDetails/PriceChart'

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const StyledTokenRow = styled.div<{
  first?: boolean
  last?: boolean
  loading?: boolean
}>`
  background-color: transparent;
  display: grid;
  font-size: 16px;
  grid-template-columns: 1fr 6fr 4fr 4fr 4fr 4fr 4fr 4fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
  `}
  padding-left: 12px;
  padding-right: 12px;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
  width: 100%;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    ${({ loading, theme }) =>
      !loading &&
      css`
        background-color: ${theme.hoverDefault};
      `}
    ${({ last }) =>
      last &&
      css`
        border-radius: 0px 0px 8px 8px;
      `}
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr 1.2fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns:3fr 2fr 3fr;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundModule};

    :last-of-type {
      border-bottom: none;
    }
  }
`

const ClickableContent = styled.div`
  display: flex;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  cursor: pointer;
`
const ClickableName = styled(ClickableContent)`
  gap: 8px;
  max-width: 100%;
`
const StyledHeaderRow = styled(StyledTokenRow)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px 8px 0px 0px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  height: 48px;
  line-height: 16px;
  padding: 0px 12px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: transparent;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: space-between;
  }
`

const ListNumberCell = styled(Cell)<{ header: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;
  font-size: 14px;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
`

const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
`


const PoolCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
  min-width:190px;
`

const ProtocolCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
   @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
      display: none;
    }
 
`

const FeetierCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
  
`

const TvlCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
     justify-content: flex-end;
  }
`

const Vol1Cell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
      display: none;
    }
    
`
const Vol30Cell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

const VoltCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  gap: 8px;
   @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
      display: none;
    }
`





const PriceCell = styled(DataCell)`
  padding-right: 8px;
`
const PercentChangeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: flex;
    justify-content: flex-end;
    color: ${({ theme }) => theme.textSecondary};
    font-size: 12px;
    line-height: 16px;
  }
`
const PriceInfoCell = styled(Cell)`
  justify-content: flex-end;
  flex: 1;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  width: 100%;

  &:hover {
    ${ClickableStyle}
  }
`
const SparkLineCell = styled(Cell)`
  padding: 0px 24px;
  min-width: 120px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SparkLine = styled(Cell)`
  width: 124px;
  height: 42px;
`
const StyledLink = styled(Link)`
  text-decoration: none;
`
const TokenInfoCell = styled(Cell)`
  gap: 8px;
  line-height: 24px;
  font-size: 16px;
  max-width: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: flex-start;
    flex-direction: column;
    gap: 0px;
    width: max-content;
    font-weight: 500;
  }
`
const TokenName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.textTertiary};
  text-transform: uppercase;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    height: 16px;
    justify-content: flex-start;
    width: 100%;
  }
`
const VolumeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SmallLoadingBubble = styled(LoadingBubble)`
  width: 25%;
`
const MediumLoadingBubble = styled(LoadingBubble)`
  width: 65%;
`
const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`
const IconLoadingBubble = styled(LoadingBubble)`
  border-radius: 50%;
  width: 24px;
`
export const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

const InfoIconContainer = styled.div`
  margin-left: 2px;
  display: flex;
  align-items: center;
  cursor: help;
`

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.PERCENT_CHANGE]: undefined,
  [TokenSortMethod.TOTAL_VALUE_LOCKED]: (
    <Trans>
      Total value locked (TVL) is the aggregate amount of the asset available across all Uniswap v3 liquidity pools.
    </Trans>
  ),
  [TokenSortMethod.VOLUME]: (
    <Trans>Volume is the amount of the asset that has been traded on Uniswap v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
}: {
  category: TokenSortMethod // TODO: change this to make it work for trans
}) {
  const theme = useTheme()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const handleSortCategory = useSetSortMethod(category)
  const sortMethod = useAtomValue(sortMethodAtom)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory}>
      {sortMethod === category && (
        <>
          {sortAscending ? (
            <ArrowUp size={20} strokeWidth={1.8} color={theme.accentActive} />
          ) : (
            <ArrowDown size={20} strokeWidth={1.8} color={theme.accentActive} />
          )}
        </>
      )}
      {category}
      {description && (
        <MouseoverTooltip text={description} placement="right">
          <InfoIconContainer>
            <Info size={14} />
          </InfoIconContainer>
        </MouseoverTooltip>
      )}
    </HeaderCellWrapper>
  )
}

/* Token Row: skeleton row component */
function TokenRow({
  header,
  listNumber,
  pool,
  protocol,
  feetier,
  tvl,
  vol1d,
  vol30d,
  volTotal,
  ...rest
}: {
  first?: boolean
  header: boolean
  loading?: boolean
  last?: boolean
  style?: CSSProperties
  listNumber: ReactNode
  pool?: ReactNode
  protocol?: ReactNode
  feetier?: ReactNode
  tvl?:ReactNode
  vol1d?: ReactNode
  vol30d?: ReactNode
  volTotal?: ReactNode
}) {
  const rowCells = (
    <>
      <ListNumberCell header={header}>{listNumber}</ListNumberCell>
      <PoolCell data-testid="name-cell">{pool}</PoolCell>
      <ProtocolCell data-testid="name-cell">{protocol}</ProtocolCell>
      <FeetierCell data-testid="name-cell">{feetier}</FeetierCell>
      <TvlCell data-testid="name-cell">{tvl}</TvlCell>
      <Vol1Cell data-testid="name-cell">{vol1d}</Vol1Cell>
      <Vol30Cell data-testid="name-cell">{vol30d}</Vol30Cell>
      <VoltCell data-testid="name-cell">{volTotal}</VoltCell>
    </>
  )
  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <TokenRow
      header={true}
      listNumber="#"
      pool={<Trans>Pool</Trans>}
      protocol={<Trans>Protocol</Trans>}
      feetier={<Trans>Fee tier</Trans>}
      tvl={<Trans>TVL</Trans>}
      vol1d={<Trans>1D vol</Trans>}
      vol30d={<Trans>30D vol</Trans>}
      volTotal={<Trans>Total vol</Trans>}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <TokenRow
      header={false}
      listNumber={<SmallLoadingBubble />}
      loading
      pool={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      // price={<MediumLoadingBubble />}
      // percentChange={<LoadingBubble />}
      // tvl={<LoadingBubble />}
      // volume={<LoadingBubble />}
      // sparkLine={<SparkLineLoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  tokenListIndex: number
  tokenListLength: number
  token: NonNullable<TopToken>
  sparklineMap: SparklineMap
  sortRank: number
}
 
/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { tokenListIndex, tokenListLength, token, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)

  const filterNetwork = validateUrlChainParam(useParams<{ chainName?: string }>().chainName?.toUpperCase())
  const chainId = CHAIN_NAME_TO_CHAIN_ID[filterNetwork]
  const timePeriod = useAtomValue(filterTimeAtom)
  const delta = token.market?.pricePercentChange?.value
  const arrow = getDeltaArrow(delta)
  const smallArrow = getDeltaArrow(delta, 14)
  const formattedDelta = formatDelta(delta)

  const exploreTokenSelectedEventProperties = {
    chain_id: chainId,
    token_address: token.address,
    token_symbol: token.symbol,
    token_list_index: tokenListIndex,
    token_list_rank: sortRank,
    token_list_length: tokenListLength,
    time_frame: timePeriod,
    search_token_address_input: filterString,
  }

  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  return (
    <div ref={ref} data-testid={`token-table-row-${token.symbol}`}>
      {/* <StyledLink
        to={getTokenDetailsURL(token)}
        onClick={() =>
          sendAnalyticsEvent(InterfaceEventName.EXPLORE_TOKEN_ROW_CLICKED, exploreTokenSelectedEventProperties)
        }
      > */}
    
        <TokenRow
          header={false}
          listNumber={sortRank}
          pool={
            <ClickableName>
              <QueryTokenLogo token={(token as any).token0} />
              <QueryTokenLogo token={(token as any).token1} />
            {`${((token as any).token0?.symbol === 'WHSK' ? 'HSK' : (token as any).token0?.symbol)}/${((token as any).token1?.symbol === 'WHSK' ? 'HSK' : (token as any).token1?.symbol)}`}

            </ClickableName>
          }
          protocol={
            <ClickableName>
             V3
            </ClickableName>
          }
          feetier={
            <ClickableName>
             {((token as any).feeTier /10000).toFixed(2)}%
            </ClickableName>
          }
          tvl={
             <ClickableName>
              ${(token as any).totalValueLockedUSD.toFixed(2)}
            </ClickableName>
          }
          vol1d={
             <ClickableName>
              ${(token as any).volumeUSD1D.toFixed(2)}
            </ClickableName>
          }
          vol30d={
             <ClickableName>
               ${(token as any).volumeUSD30D.toFixed(2)}
            </ClickableName>
          }
          volTotal={
             <ClickableName>
               ${(token as any).volumeUSD.toFixed(2)}
            </ClickableName>
          }
          // sparkLine={
          //   <SparkLine>
          //     <ParentSize>
          //       {({ width, height }) =>
          //         props.sparklineMap && (
          //           <SparklineChart
          //             width={width}
          //             height={height}
          //             tokenData={token}
          //             pricePercentChange={token.market?.pricePercentChange?.value}
          //             sparklineMap={props.sparklineMap}
          //           />
          //         )
          //       }
          //     </ParentSize>
          //   </SparkLine>
          // }
          first={tokenListIndex === 0}
          last={tokenListIndex === tokenListLength - 1}
        />
    
    </div>
  )
})

LoadedRow.displayName = 'LoadedRow'
