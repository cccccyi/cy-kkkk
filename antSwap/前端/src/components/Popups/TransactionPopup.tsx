import { useWeb3React } from '@web3-react/core'
import { parseLocalActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Column from 'components/Column'
import useENSName from 'hooks/useENSName'
import { useCombinedActiveList } from 'state/lists/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/types'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PopupAlertTriangle } from './FailedNetworkSwitchPopup'

const Descriptor = styled(ThemedText.BodySmall)`
  ${EllipsisStyle}
`

function TransactionPopupContent({ tx, chainId }: { tx: TransactionDetails; chainId: number }) {
  const success = tx.receipt?.status === 1
  const tokens = useCombinedActiveList()



  
  //console.log('啊啊啊啊急急急急急急', { tx, chainId, tokens }) //  此处tx里，其他链上原生代币也是eth。字段为tx.info.quoteCurrencyId
  const activity = parseLocalActivity(tx, chainId, tokens)
  //console.log('啊啊啊啊急急急急急急2', JSON.stringify(activity));  //此处currencies，里显示的是正确的代币，
  // 正确的示例json如下
  // {
  // 	"hash": "0x9a22e430e6e335db717913b47c93b3db8440061be5bfae9806750a27bdfa342e",
  // 	"chainId": 56,
  // 	"title": "Added liquidity",
  // 	"status": "CONFIRMED",
  // 	"timestamp": 1756090498.187,
  // 	"receipt": {
  // 		"id": "0x9a22e430e6e335db717913b47c93b3db8440061be5bfae9806750a27bdfa342e",
  // 		"blockHash": "0x7d11cf9a17a5fa30ae48a04daf9913083f3fc433db522613c8597f9f8e2067df",
  // 		"blockNumber": 58789663,
  // 		"contractAddress": null,
  // 		"from": "0xccb8907D5e22CeD0d8D91744D722dd9462310E16",
  // 		"status": "CONFIRMED",
  // 		"to": "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
  // 		"transactionHash": "0x9a22e430e6e335db717913b47c93b3db8440061be5bfae9806750a27bdfa342e",
  // 		"transactionIndex": 50,
  // 		"hash": "0x9a22e430e6e335db717913b47c93b3db8440061be5bfae9806750a27bdfa342e",
  // 		"info": {
  // 			"type": 9,
  // 			"baseCurrencyId": "ETH",
  // 			"quoteCurrencyId": "0x55d398326f99059fF775485246999027B3197955",
  // 			"createPool": false,
  // 			"expectedAmountBaseRaw": "1137876710518423",
  // 			"expectedAmountQuoteRaw": "1000000000000000000",
  // 			"feeAmount": 500
  // 		},
  // 		"addedTime": 1756090497406,
  // 		"receipt": {
  // 			"blockHash": "0x7d11cf9a17a5fa30ae48a04daf9913083f3fc433db522613c8597f9f8e2067df",
  // 			"blockNumber": 58789663,
  // 			"contractAddress": null,
  // 			"from": "0xccb8907D5e22CeD0d8D91744D722dd9462310E16",
  // 			"status": 1,
  // 			"to": "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
  // 			"transactionHash": "0x9a22e430e6e335db717913b47c93b3db8440061be5bfae9806750a27bdfa342e",
  // 			"transactionIndex": 50
  // 		},
  // 		"confirmedTime": 1756090498187
  // 	},
  // 	"descriptor": "0.001 BNB and Unknown",
  // 	"currencies": [{
  // 		"chainId": 56,
  // 		"decimals": 18,
  // 		"symbol": "BNB",
  // 		"name": "BNB",
  // 		"isNative": true,
  // 		"isToken": false
  // 	}, null]
  // }
  // 错误的如下：
  //{"hash":"0x7a0599b0c1443ce78060418b28f084736028d8263e1cbd7952f9a14e62f43451","chainId":133,"title":"Added liquidity","status":"CONFIRMED","timestamp":1756092026.093,"receipt":{"id":"0x7a0599b0c1443ce78060418b28f084736028d8263e1cbd7952f9a14e62f43451","blockHash":"0xd0752135e6f93b4ea4f8c1f105e69c5bf01ac79748ccee09ab3162271451a083","blockNumber":16452684,"contractAddress":null,"from":"0x8c1a70d77739e85b4e8a68442Fae64073533b236","status":"CONFIRMED","to":"0x89D3aA4DEe1b08AD228A18962B0B820D0646274B","transactionHash":"0x7a0599b0c1443ce78060418b28f084736028d8263e1cbd7952f9a14e62f43451","transactionIndex":1,"hash":"0x7a0599b0c1443ce78060418b28f084736028d8263e1cbd7952f9a14e62f43451","info":{"type":9,"baseCurrencyId":"0x60EFCa24B785391C6063ba37fF917Ff0edEb9f4a","quoteCurrencyId":"ETH","createPool":false,"expectedAmountBaseRaw":"56565","expectedAmountQuoteRaw":"100000000000000000","feeAmount":500},"addedTime":1756092025735,"receipt":{"blockHash":"0xd0752135e6f93b4ea4f8c1f105e69c5bf01ac79748ccee09ab3162271451a083","blockNumber":16452684,"contractAddress":null,"from":"0x8c1a70d77739e85b4e8a68442Fae64073533b236","status":1,"to":"0x89D3aA4DEe1b08AD228A18962B0B820D0646274B","transactionHash":"0x7a0599b0c1443ce78060418b28f084736028d8263e1cbd7952f9a14e62f43451","transactionIndex":1},"confirmedTime":1756092026093},"descriptor":"Unknown and 0.100 ETH","currencies":[null,{"chainId":133,"decimals":18,"symbol":"ETH","name":"Ether","isNative":true,"isToken":false}]}
  const { ENSName } = useENSName(activity?.otherAccount)

  if (!activity) return null

  const explorerUrl = getExplorerLink(chainId, tx.hash, ExplorerDataType.TRANSACTION)

//  return null
  return (
    <PortfolioRow
      left={
        success ? (
          <Column>
            {/* 下面组件头像报错，注释掉组件内部头像即可 */}
            <PortfolioLogo
              chainId={chainId}
              currencies={activity.currencies}
              images={activity.logos}
              accountAddress={activity.otherAccount}
            />
          </Column>
        ) : (
          <PopupAlertTriangle />
        )
      }
      title={<ThemedText.SubHeader fontWeight={500}>{activity.title}</ThemedText.SubHeader>}
      descriptor={
        <Descriptor color="textSecondary">
          {activity.descriptor}
          {ENSName ?? activity.otherAccount}
        </Descriptor>
      }
      onClick={() => window.open(explorerUrl, '_blank')}
    />
  )
}

export default function TransactionPopup({ hash }: { hash: string }) {
  const { chainId } = useWeb3React()
  const tx = useTransaction(hash)
  //alert(chainId);
  //console.log('TransactionPopup', { tx, chainId })  
  //return null
  if (!chainId || !tx) return null
  return <TransactionPopupContent tx={tx} chainId={chainId} />
}
