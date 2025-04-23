const _BASE = 'http://8.219.252.88:8080';
const _Tracker_BASE = 'http://8.219.252.88:3000';
const _URL = {
    nonce   : `${_BASE}/nonce`,        //获取nonce
    verify  :`${_BASE}/verify`,        //签名登录验证
    tokenList  :`${_BASE}/token/tokenList`,  //代币列表
};
export { _URL , _Tracker_BASE };

