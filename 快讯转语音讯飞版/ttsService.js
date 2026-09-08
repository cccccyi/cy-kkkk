const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

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
    const authorizationOrigin = `api_key=\"${apiKey}\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"${signatureSha}\"`;
    const authHeader = Buffer.from(authorizationOrigin).toString('base64');
    return `${ttsUrl}?authorization=${authHeader}&date=${encodeURIComponent(date)}&host=tts-api.xfyun.cn`;
}
function formatCryptoSymbols(text) {
    // 需要拆分的币种代码
    const symbols = new Set([
        "BTC", "ETH", "USDT", "BNB", "SOL", "XRP", "DOGE", "ADA", "DOT", "MATIC",
        "LTC", "BCH", "XLM", "LINK", "UNI", "AVAX", "SHIB", "TRX", "ATOM", "XMR",
        "ALGO", "VET", "HBAR", "ICP", "FIL", "APT", "EOS", "XTZ", "FLOW", "SAND",
        "AAVE", "COMP", "MKR", "YFI", "SUSHI", "CRV", "BAL", "SNX", "UMA", "REN",
        "LUNA", "CAKE", "RUNE", "DYDX", "ZRX", "KNC", "BNT", "1INCH", "RAY", "SRM",
        "NEAR", "AR", "STX", "KSM", "CELO", "ZIL", "ONE", "IOTA", "HNT", "TON",
        "EGLD", "KDA", "MOVR", "GLMR", "MINA", "LSK", "WAVES", "SYS", "DGB", "RVN",
        "PEPE", "FLOKI", "BABYDOGE", "ELON", "SAMO", "SHIBAINU", "AKITA", "HOGE", "SAFEMOON", "KISHU",
        "BAN", "WOOF", "CUMMIES", "MOON", "SHIT", "POG", "NYAN", "GRUMPY", "BOB", "MEOW",
        "MANA", "AXS", "ENJ", "GALA", "CHZ", "WAXP", "ILV", "RARI", "OMI", "TLM",
        "YGG", "SLP", "DERC", "VRA", "GODS", "ATLAS", "POLIS", "UFO", "GHST", "SUPER",
        "QNT", "FTM", "INJ", "LRC", "GRT", "BAT", "OMG", "ANKR", "HOT", "ZEC",
        "DASH", "NANO", "ICX", "ONT", "NEO", "GAS", "SC", "BTS", "STEEM", "HIVE",
        "XDC", "ROSE", "KAVA", "OSMO", "JUNO", "AKT", "CTSI", "SKL", "OGN", "FET",
        "AGIX", "OCEAN", "NMR", "API3", "BAND", "DIA", "TRIBE", "RLC", "POWR", "XYO",
        "POLY", "REQ", "GNO", "KEEP", "NU", "STORJ", "FUN", "CELR", "IOST", "WOO",
        "ORN", "PERP", "ALPHA", "BADGER", "RSR", "TORN", "PHA", "DUSK", "ARK", "LOOM",
        "CKB", "XVS", "TWT", "WRX", "CHR", "DODO", "LIT", "SFP", "BEL", "LINA",
        "REEF", "BOND", "MLN", "POND", "FIDA", "OXY", "MAPS", "AUDIO", "CTSI", "DNT",
        "MTL", "PAXG", "USDC", "DAI", "BUSD", "GUSD", "TUSD", "HUSD", "UST", "FRAX",
        "LUSD", "SUSD", "MIM", "FEI", "XAUT", "GLM", "STMX", "QKC", "ELF", "CVC",
        "SNT", "ANT", "REP", "KIN", "RIF", "DCR", "ZEN", "BSV", "ETN", "XEM",
        "XZC", "ARDR", "NXS", "PPC", "NMC", "MONA", "RDD", "VTC", "XVG", "BLK",
        "GAME", "EMC2", "POT", "AUR", "NVC", "FLO", "VIA", "GRS", "XPM", "BCN",
        "XCP", "NXT", "MAID", "OMNI", "SYS", "BITG", "THC", "HTML", "DIME", "XMY",
        "PIGGY", "UNO", "CURE", "XST", "XWC", "DMD", "RBY", "IFC", "MEC", "XDN",
        "XMG", "BTA", "BTX", "SIB", "OK", "SLR", "PINK", "ION", "XBC", "XBY",
        "GRC", "XHI", "XPY", "BBR", "CRW", "XTO", "VRC", "XVC", "XAS", "XJO",
        "XLR", "XSN", "XNK", "XNS", "XUEZ", "YAC", "ZCL", "ZET", "ZNY", "NOTE",
        "JWL", "KLC", "LBC", "LDOGE", "LEAF", "LINX", "LTCU", "MINT", "MNE", "MSC"
    ]);

    // 处理交易对，把 "/" 替换成 "，"
    text = text.replace(/([A-Z]+)\/([A-Z]+)/g, "$1，$2");

    // 处理纯大写字母和混合字符
    const regex = /\b([A-Z0-9_]+)\b/g;
    text = text.replace(regex, (match) => {
        // 纯数字不需要分开
        if (/^\d+$/.test(match)) {
            return match;
        }

        // 如果是符号在symbols中（不区分大小写），按空格拆分
        const lowerCaseMatch = match.toLowerCase();
        if (symbols.has(lowerCaseMatch.toUpperCase())) {
            return match.split("").join(" ");
        }

        // 纯大写字母且不在symbols中，进行字母拆分
        if (/^[A-Z]+$/.test(match)) {
            return match.split("").join(" ");
        }

        // 对于混合字母和数字的情况，拆分字母，数字保持在一起
        return match.replace(/([a-zA-Z])(\d)/g, "$1 $2").replace(/(\d)([a-zA-Z])/g, "$1 $2");
    });

    return text;
}


// 语音合成方法
async function synthesizeSpeech(text) {
    return new Promise((resolve, reject) => {
        const formattedText = formatCryptoSymbols(text); // 预处理文本

        const ws = new WebSocket(getAuthUrl());
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const outputDir = path.join('/www/wwwroot/www.hashnews.pro/tts_output', dateStr);
        const fileName = `${Date.now()}.mp3`;
        const filePath = path.join(outputDir, fileName);

        

        // console.log("输出目录:", outputDir);
        // console.log("音频文件保存路径:", filePath);
        ws.on('open', async () => {
            try {
                // 确保输出目录存在
                await mkdir(outputDir, { recursive: true });
                console.log('WebSocket 连接成功');
                
                const request = {
                    common: { app_id: appid },
                    business: {
                        aue: "lame",
                        sfl: 1,
                        auf: "audio/L16;rate=16000",
                        vcn: "x4_yifei",
                        tte: "UTF8",
                        speed: 42,
                        pitch: 50,
                    },
                    data: { text: Buffer.from(formattedText).toString("base64"), status: 2 }
                };
                ws.send(JSON.stringify(request));
            } catch (error) {
                console.error('创建目录时发生错误:', error);
                reject(error);
            }
        });

        let audioBuffer = Buffer.alloc(0);

        ws.on('message', (data) => {
            const response = JSON.parse(data);

            // 检查 audio 是否有效
            if (response.data && response.data.audio) {
                try {
                    audioBuffer = Buffer.concat([audioBuffer, Buffer.from(response.data.audio, 'base64')]);
                } catch (error) {
                    console.error('音频数据处理错误:', error);
                    ws.close();
                    reject('音频数据处理错误');
                }
            }

            // 处理其他错误
            if (response.code !== 0) {
                console.error("错误：", response.message);
                ws.close();
                reject(response.message);
            }

            // 音频合成完成
            if (response.data && response.data.status === 2) {
                writeFile(filePath, audioBuffer)
                    .then(() => {
                        console.log("语音合成完成！", filePath);
                        resolve(filePath);
                        ws.close();
                    })
                    .catch((writeError) => {
                        console.error('写入文件时发生错误:', writeError);
                        reject(writeError);
                    });
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket 连接错误:', err);
            reject(err);
        });

        ws.on('close', () => {
            console.log("WebSocket 连接关闭");
        });
    });
}

module.exports = { synthesizeSpeech };
