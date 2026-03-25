const moment = require('moment');
const axios = require('axios')

const headers = {
    'Content-Type': 'application/json'
}
//const baseURL = 'http://localhost:3002';
const baseURL = 'http://47.236.25.252:3002'

async function generate_liquidity_data(){
    const pairs = [{
        token0Name: "USDCoin",
        token0Address: "0xtokenA",
        token0Logo: "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
        token0Quantity: 100,
        token1Name: "Dai Stablecoin",
        token1Address: "0xtokenB",
        token1Logo: "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
        token1Quantity: 100,
        tvl: 10000,
        apr: 0,
        day1Volume: 10,
        day30Volume: 10
    },{
        token0Name: "Pangolin",
        token0Address: "0xtokenC",
        token0Logo: "https://assets.coingecko.com/coins/images/14023/thumb/PNG_token.png?1696513750",
        token0Quantity: 100,
        token1Name: "TaleCraft",
        token1Address: "0xtokenD",
        token1Logo: "https://assets.coingecko.com/coins/images/20934/thumb/3mrl6Lfw_400x400.jpg?1696520323",
        token1Quantity: 100,
        tvl: 10000,
        apr: 0,
        day1Volume: 10,
        day30Volume: 10
    }]
    const addPairUrl = baseURL + "/api/pool/addLiquidity"
    for (const info of pairs) {
        console.log(info)
        const res = await axios.post(addPairUrl, info, { headers: headers })
        console.log(res.data)
    }
}

async function generate_transaction_data(){
    const url = baseURL + '/api/pool/addTransaction'
    let timestamp = moment('2024-11-01 00:00:00').unix()
    for(let i=0; i<100; i++){
        timestamp += Math.floor(Math.random() * 3600) + 300
        if(timestamp > moment().unix()){
            break;
        }
        let data = {
            accountAddress: "account001Address",
            timestamp: timestamp,
            token0Address: "0xtokenA",
            token1Address: "0xtokenB",
            token0Quantity: -1,
            token1Quantity: 1,
            swapType: "SWAP"
        }
        const res = await axios.post(url, data, { headers: headers })
        console.log(res.data)
    }
}

async function generate_swap_token_data(){
    const list = [{
        address: "0x60781c2586d68229fde47564546784ab3faca982",
        name: "Pangolin",
        logo: "https://assets.coingecko.com/coins/images/14023/thumb/PNG_token.png?1696513750"
    },{
        address: "0x714f020c54cc9d104b6f4f6998c63ce2a31d1888",
        name: "Step App",
        logo: "https://assets.coingecko.com/coins/images/25015/thumb/200x200.png?1701432003"
    },{
        address: "0x8ae8be25c23833e0a01aa200403e826f611f9cd2",
        name: "TaleCraft",
        logo: "https://assets.coingecko.com/coins/images/20934/thumb/3mrl6Lfw_400x400.jpg?1696520323"
    },{
        address: "0x79ea4e536f598dcd67c76ee3829f84ab9e72a558",
        name: "ai9000",
        logo: "https://assets.coingecko.com/coins/images/52826/thumb/190844147.png?1734431124"
    },{
        address: "0x8d88e48465f30acfb8dac0b3e35c9d6d7d36abaf",
        name: "Canary",
        logo: "https://assets.coingecko.com/coins/images/16764/thumb/logo_-_2021-06-29T113338.436.png?1696516337"
    },{
        address: "0x2d0afed89a6d6a100273db377dba7a32c739e314",
        name: "BIG",
        logo: "https://assets.coingecko.com/coins/images/52449/thumb/fix.png?1733990978"
    },{
        address: "0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4",
        name: "Avalaunch",
        logo: "https://assets.coingecko.com/coins/images/15466/thumb/avalaunch.png?1696515112"
    },{
        address: "0xb9a98894ffbfa98c73a818b5b044e5b1c8666f56",
        name: "Kepler",
        logo: "https://assets.coingecko.com/coins/images/52429/thumb/0xb9a98894ffbfa98c73a818b5b044e5b1c8666f56_%281%29.png?1733332999"
    },{
        address: "0xaaab9d12a30504559b0c5a9a5977fee4a6081c6b",
        name: "Pharaoh",
        logo: "https://assets.coingecko.com/coins/images/34686/thumb/PHAROAH.jpg?1705842746"
    },{
        address: "0x2dc45b5377739aa47e1162f42ca591c1688bc647",
        name: "Yeet The Yeti",
        logo: "https://assets.coingecko.com/coins/images/52519/thumb/LOGO_%281%29.png?1733501730"
    },{
        address: "0x7c6a937943f135283a2561938de2200994a8f7a7",
        name: "Republic Note",
        logo: "https://assets.coingecko.com/coins/images/33726/thumb/Note-Logo-2023.png?1702888132"
    },{
        address: "0x04f388e30bfd03f357ae061ec5680c7e4ac4cf09",
        name: "LeoAVAX",
        logo: "https://assets.coingecko.com/coins/images/36306/thumb/leologo_%281%29.png?1711090151"
    },{
        address: "0x6e7f5c0b9f4432716bdd0a77a3601291b9d9e985",
        name: "Spore",
        logo: "https://assets.coingecko.com/coins/images/14470/thumb/Logo.png?1703754463"
    },{
        address: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
        name: "JOE",
        logo: "https://assets.coingecko.com/coins/images/17569/thumb/LFJ_JOE_Logo.png?1727200941"
    },{
        address: "0x4f94b8aef08c92fefe416af073f1df1e284438ec",
        name: "Landwolf on AVAX",
        logo: "https://assets.coingecko.com/coins/images/33638/thumb/LOGO_COINGECKO.png?1702537784"
    },{
        address: "0x0da67235dd5787d67955420c84ca1cecd4e5bb3b",
        name: "Wonderful Memories",
        logo: "https://assets.coingecko.com/coins/images/22392/thumb/wMEMO.png?1696521735"
    },{
        address: "0x9a8e0217cd870783c3f2317985c57bf570969153",
        name: "Cosmic Universe Magick",
        logo: "https://assets.coingecko.com/coins/images/19313/thumb/13037.png?1696518755"
    },{
        address: "0xc7f4debc8072e23fe9259a5c0398326d8efb7f5c",
        name: "HeroesChained",
        logo: "https://assets.coingecko.com/coins/images/22813/thumb/logo_-_2022-01-20T140628.062.png?1696522115"
    }]
    const addTokenUrl = baseURL + '/api/pool/addSwapToken'
    for (const info of list) {
        console.log(info)
        const res = await axios.post(addTokenUrl, info, { headers: headers })
        console.log(res.data)
    }
}


generate_liquidity_data();
generate_transaction_data();
generate_swap_token_data()

