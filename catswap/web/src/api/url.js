const normalizeServiceBase = (configuredValue, fallbackValue) => {
    const parsed = new URL(configuredValue || fallbackValue, window.location.origin);
    const hostname = parsed.hostname.toLowerCase();
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    if (parsed.protocol !== 'https:' && !(isLoopback && parsed.protocol === 'http:')) {
        throw new Error('Service URLs must use HTTPS unless they target localhost');
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
};

const _BASE = normalizeServiceBase(process.env.REACT_APP_API_BASE_URL, window.location.origin);
const _Tracker_BASE = normalizeServiceBase(process.env.REACT_APP_TRACKER_BASE_URL, _BASE);
const _URL = {
    nonce   : `${_BASE}/nonce`,        //获取nonce
    verify  :`${_BASE}/verify`,        //签名登录验证
    tokenList  :`${_BASE}/token/tokenList`,  //代币列表
};
export { _URL , _Tracker_BASE };
