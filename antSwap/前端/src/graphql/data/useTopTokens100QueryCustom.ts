import { useState, useEffect, useCallback } from 'react'
import { TopTokens100Query } from './__generated__/types-and-hooks'

interface UseTopTokens100QueryCustomProps {
  variables: {
    duration: string
    chain: string
  }
}

// 模拟 Apollo 的 QueryResult<T>
interface QueryResultMock<T> {
  data?: T
  loading: boolean
  error?: any
  refetch: () => void
  networkStatus: number
}

export function useTopTokens100QueryCustom({ variables }: UseTopTokens100QueryCustomProps): QueryResultMock<TopTokens100Query> {
  const [data, setData] = useState<TopTokens100Query | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      //此处废弃
      const res = {}
      // const res = await fetch('http://154.219.101.126:8080/graphql', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     query: `
      //       query getTokens($first: Int!, $skip: Int!) {
      //         tokens(first: $first, skip: 0) {
      //           id
      //           name
      //           symbol
      //           address
      //           chain
      //           standard
      //           totalValueLocked
      //           currentPrice
      //           priceChange24h
      //           volume
      //           project { id logoUrl }
      //         }
      //       }
      //     `,
      //     variables: { first: 100, skip: 0 },
      //   }),
      // })

      const result =  res

      // 转换成 TopTokens100Query 结构
     

      setData(result)
      setLoading(false)
    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }, [variables])

  useEffect(() => {
    let mounted = true
    if (mounted) {
      fetchData()
    }
    return () => { mounted = false }
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    networkStatus: 7, // Apollo 完成状态
  }
}
