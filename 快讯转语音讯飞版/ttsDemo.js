const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// 讯飞 API 相关参数
const appid = requireEnv('XUNFEI_APP_ID');
const apiKey = requireEnv('XUNFEI_API_KEY');
const apiSecret = requireEnv('XUNFEI_API_SECRET');
const ttsUrl = "wss://tts-api.xfyun.cn/v2/tts";

// 生成鉴权签名
function getAuthUrl() {
    const date = new Date().toGMTString();
    const signatureOrigin = `host: tts-api.xfyun.cn\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
    const signatureSha = crypto.createHmac('sha256', apiSecret).update(signatureOrigin).digest('base64');
    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
    const authHeader = Buffer.from(authorizationOrigin).toString('base64');
    return `${ttsUrl}?authorization=${authHeader}&date=${encodeURIComponent(date)}&host=tts-api.xfyun.cn`;
}

// 连接 WebSocket
const ws = new WebSocket(getAuthUrl());

ws.on('open', function open() {
    console.log('WebSocket 连接成功');
    // 发送 TTS 请求
    const request = {
        common: { app_id: appid },
        "business": {
            "aue": "lame",
            "sfl":1,
            "auf": "audio/L16;rate=16000",
            "vcn": "x4_yifei",
            "tte": "UTF8",
            "speed":42,
            "pitch":50,
        },
        data: { text: Buffer.from("你好，我要买比特币").toString("base64"), status: 2 }
    };
    ws.send(JSON.stringify(request));
});

ws.on('message', function incoming(data) {
    const response = JSON.parse(data);
    if (response.data && response.data.audio) {
        fs.appendFileSync("output.mp3", Buffer.from(response.data.audio, 'base64'));
    }
    if (response.code !== 0) {
        console.error("错误：", response.message);
        ws.close();
    }
    if (response.data && response.data.status === 2) {
        console.log("语音合成完成！");
        ws.close();
    }
});

ws.on('close', () => console.log("WebSocket 连接关闭"));
ws.on('error', (err) => console.error("WebSocket 错误:", err));
