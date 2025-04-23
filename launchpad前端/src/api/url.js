const _BASE = 'http://8.219.252.88:8090';
const _Tracker_BASE = 'http://8.219.252.88:3000';
const _URL = {
    nonce           :  `${_BASE}/nonce`,                                                     //获取nonce
    verify          :  `${_BASE}/verify`,                                                    //签名登录验证
    list            :  `${_BASE}/token/list`,                                                //代币列表
    upload          :  `${_BASE}/token/upload`,                                              //上传图片
    launch          :  `${_BASE}/token/launch`,                                              //发行代币
    findTokenOne    :  `${_BASE}/token/findTokenOne`,                                        //获取代币详情
    calTokenAmount  :  `${_BASE}/internal-trade/calTokenAmount`,                             //获取代币报价
    trade           :  `${_BASE}/internal-trade/trade`,                                      //买入代币
    sell            :  `${_BASE}/internal-trade/sell`,                                       //卖出代币
    findHolderList  :  `${_BASE}/token/findHolderList`,                                      //我持有的代币（持有人列表）
    getFee          :  'https://mempool-testnet.fractalbitcoin.io/api/fees/recommended',     //从测试网获取费率
    //getFee        :  'https://mempool.fractalbitcoin.io/api/fees/recommended'  ,           //从主网获取费率
    tradelist       :  `${_BASE}/internal-trade/list`,                                       //内盘交易记录
    kline           :  `${_BASE}/internal-trade/kline`,                                      //k线
    getInfo         :  `${_BASE}/getInfo`,                                                   //检测用户在线状态
};
export { _URL , _Tracker_BASE };