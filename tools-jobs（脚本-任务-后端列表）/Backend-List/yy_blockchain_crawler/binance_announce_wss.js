const WebSocket = require('ws');
const CryptoJS = require('crypto-js');

function connect() {
    const uri = 'wss://api.binance.com/sapi/wss?random=56724ac693184379ae23ffe5e910063c&topic=topic1&recvWindow=30000&timestamp=${timestamp}&signature=${signature}';
    const binance_api_key = "gpp0lOebrgZmx7jtha1FMVmgmum44WcjwFR8BzR97i8qCmwr3e1OYI7dvJd3UPUl";
    const binance_api_secret = "JxfGbe8nzw9B4LlK2RUbMULB46L3WQI46URQ03MRLKnKLIs5r8Z68FAOEeLdJ6G3"; // Load private key

    const ts = Date.now();
    let paramsObject = {};
    const queryString = uri.substring(uri.indexOf('?') + 1);
    const parameters = queryString.split('&')
        .filter(param => param.includes('='))
        .map(param => {
            const [key, value] = param.split('=');
            return {key, value};
        });
    parameters.map((param) => {
        if (param.key !== 'signature' &&
            param.key !== 'timestamp') {
            paramsObject[param.key] = param.value;
        }
    })
    Object.assign(paramsObject, {'timestamp': ts});

    const tmp = Object.keys(paramsObject).map((key) => {
        return `${key}=${paramsObject[key]}`;
    }).join('&');
    const signature = CryptoJS.HmacSHA256(tmp, binance_api_secret).toString();
    Object.assign(paramsObject, {'signature': signature});
    const result = Object.keys(paramsObject).map((key) => {
        return `${key}=${paramsObject[key]}`;
    }).join('&');

    const baseUri = uri.substring(0, uri.indexOf("?"))
    console.log("final uri: " + baseUri + '?' + result)


    const ws = new WebSocket(baseUri + '?' + result, [], {
    headers: {
        "X-MBX-APIKEY": binance_api_key
    }
    });
    ws.on('open', function open() {
        console.log('Connected to the server');
        // 发送订阅（例如公告）
        ws.send(JSON.stringify({
            "command": "SUBSCRIBE",
            "value": "topic1|topic2|topic3|topic4|topic5"
        }));
        // 每 30 秒发送一次 ping
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log("Send PING to server");
                ws.ping();   // 标准 ws 的 ping 帧
                // 如果 Binance 不响应，可以换成： ws.send(JSON.stringify({ method: "PING" }));
            }
        }, 30 * 1000);
    });
    ws.on('message', function incoming(data) {
        console.log(`Data from server: ${data}`);
    });
    ws.on('ping', function (data) {
        // 处理 ping：发送 pong 并复制 data
        console.log('Received ping, sent pong');
    });
    ws.on('close', function close() {
        console.log('Disconnected from server');
        // 重连逻辑：延迟 5 秒后重连
        setTimeout(connect, 5000);
    });
    ws.on('error', function error(err) {
        console.error(`Error: ${err.message}`);
    });
    // TODO setup your ping and reconnect logic
}

connect();