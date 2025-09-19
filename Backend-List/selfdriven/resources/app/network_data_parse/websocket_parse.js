const pako = require('pako')

// 解压缩数据
function decompressData(data) {
    return new Promise((resolve, reject) => {
        try {
            const decompressed = pako.inflate(new Uint8Array(data), { to: 'string' });
            resolve(decompressed);
        } catch (error) {
            reject(error);
        }
    });
  }

exports.websocketParse = function(htmlStr, requestData){
    const key = 'funding_rate_data'
    const buffer = Buffer.from(htmlStr, 'base64')
    const content = buffer.buffer;
    decompressData(content).then((result) => {
        $g.log.append('debug', result)
        const data = JSON.parse(result)
        if(data?.type == 'initial'){
            $g.log.append('decompressData', data.type)
            resultData[key] = data.data
        }
    }).catch((error) => {
        $g.log.append('Decompression failed:', error)
    });
}

