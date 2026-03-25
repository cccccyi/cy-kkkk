import React, { useState,useEffect } from 'react';
import { Button, Radio, Space, Table, Tag,Tooltip,Pagination,message} from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './swap.scss';
import './limit.scss';
import './pool.scss';
import './box.scss';
import { _URL , _Tracker_BASE } from "../api/url";
import axios from 'axios';
import { LinkOutlined,QuestionCircleOutlined,SearchOutlined,ArrowDownOutlined,DownOutlined,LoginOutlined} from '@ant-design/icons';
import {
  singleSend,
  SupportedNetwork,
  Cat20TokenInfo,
  OpenMinterCat20Meta,
  MempolChainProvider,
  MempoolUtxoProvider,
  toTokenAddress,
  UnisatSigner,
  CAT20Covenant,
} from "@cat-protocol/cat-sdk";
import { 
  CatTrackerProvider,
  SwapLpMeta,
  SwapMainCovenant,
  deploy,
  initLoadArtifact,
  stringifyStateUtxo,

  SwapAddLiquidity,
  SwapRemoveLiquidity,
  SwapToken1ToToken2,
  SwapToken2ToToken1,
  SwapMergeToken

} from 'utxocean';
// import swapAddArti from '../json/swapAddLiquidity.json'
// import swapRemoveArti from '../json/swapAddLiquidity.json'
// import swapT1toT2Arti from '../json/swapToken1ToToken2.json'
// import swapT2toT1Arti from '../json/swapToken2ToToken1.json'
// import swapMergeArti from '../json/swapMergeToken.json'
//import swapAddLiquidity1 from 'utxocean/artifacts/contracts/swap/swapAddLiquidity.json';
//const swapAddLiquidity1 = require('utxocean/artifacts/contracts/swap/swapAddLiquidity.json');
//import swapAdd from 'utxocean/artifacts/contracts/swap/swapAddLiquidity.json';
import { useSelector } from 'react-redux';
import swapAddArti from 'utxocean/artifacts/contracts/swap/swapAddLiquidity.json'
import swapRemoveArti from 'utxocean/artifacts/contracts/swap/swapRemoveLiquidity.json'
import swapT1toT2Arti from 'utxocean/artifacts/contracts/swap/swapToken1ToToken2.json'
import swapT2toT1Arti from 'utxocean/artifacts/contracts/swap/swapToken2ToToken1.json'
import swapMergeArti from 'utxocean/artifacts/contracts/swap/swapMergeToken.json'
import TokenListModal from './modules/tokenList';

const PageTwo = () => {
  const address = useSelector((state) => state.user.address); // 读取 Redux 状态中的地址
  // 创建两个独立的状态
  const [sellValue, setSellValue] = useState(''); // 卖出的代币数量
  const [buyValue, setBuyValue] = useState(''); // 买入的代币数量
  const [exchangeRate, setExchangeRate] = useState(-1); // 初始兑换比例
  //const [exchangeRate, setExchangeRate] = useState(7.51); // 初始兑换比例
  const [aTOb, setaTOb] = useState('*'); // A 转换为 B 的汇率
  const [bTOa, setbTOa] = useState('*'); // B 转换为 A 的汇率
  const [isUserInput, setIsUserInput] = useState(true); // 判断是用户输入卖出还是买入框
  const [showTokenList, setShowTokenList] = useState(false);
  const [tokenA, setTokenA] = useState('OPCAT');
  const [tokenAId, setTokenAId] = useState('6f7c028d0b41faa3bb113af474c0f426c8cc3d619d4702b78d0738849716e22b_0');
  const [tokenAAddr, setTokenAAddr] = useState('6f7c028d0b41faa3bb113af474c0f426c8cc3d619d4702b78d0738849716e22b_0');
  const [tokenB, setTokenB] = useState('WFB');
  const [tokenBId, setTokenBId] = useState('e85967a0b743f323993ccfc6c09bf1f4ea3bf6e783572fc1577a6b0edc91f328_0');
  const [tokenBAddr, setTokenBAddr] = useState('e85967a0b743f323993ccfc6c09bf1f4ea3bf6e783572fc1577a6b0edc91f328_0');
  const [nowToken, setNowToken] = useState('');  //当前选择的是哪个？
  //发起
  const handleConnectWallet = async () => {
    //获取tokenA的余额
    const responseA = await axios.get(_Tracker_BASE+'/api/tokens/'+tokenAId+'/addresses/'+address+'/utxos?limit=4');  //获取用户utxo
    if (responseA.data && responseA.data.code==0) {
      let totalAmountA = 0;
      responseA.data.data.utxos.forEach(utxo => {
        // 将 amount 字符串转换为整数，并累加
        totalAmountA += parseInt(utxo.state.amount, 10);
      });
      let canUseA = totalAmountA/100
      console.log(canUseA)
      if(sellValue>canUseA){
        //余额不足
       // alert('A余额不足')
        message.info(tokenA+'余额不足');
        return; // 阻止程序执行后续逻辑
      }
    }else{
        // alert('网络错误请重试')
        message.info('网络错误请重试');
        return; // 阻止程序执行后续逻辑
    }
    //获取tokenB的余额
    const responseB = await axios.get(_Tracker_BASE+'/api/tokens/'+tokenBId+'/addresses/'+address+'/utxos?limit=4');  //获取用户utxo
    if (responseB.data && responseB.data.code==0) {
      //console.log(JSON.stringify(response.data));
      let totalAmountB = 0;
      responseB.data.data.utxos.forEach(utxo => {
        // 将 amount 字符串转换为整数，并累加
        totalAmountB += parseInt(utxo.state.amount, 10);
      });
      let canUseB = totalAmountB/100
      console.log(canUseB)
      if(buyValue>canUseB){
        //余额不足
        message.info(tokenB+'余额不足');
        return; // 阻止程序执行后续逻辑
      }
    }else{
      message.info('网络错误请重试');
       return; // 阻止程序执行后续逻辑
    }
    //开始交互
    message.open({
      key:'cw',
      type: 'loading',
      content: '正在构造交易，请稍候...',
      duration: 0,
    })
    SwapAddLiquidity.loadArtifact(swapAddArti)
    SwapRemoveLiquidity.loadArtifact(swapRemoveArti)
    SwapToken1ToToken2.loadArtifact(swapT1toT2Arti)
    SwapToken2ToToken1.loadArtifact(swapT2toT1Arti)
    SwapMergeToken.loadArtifact(swapMergeArti)
    const token1Id = tokenAId;
    const token2Id = tokenBId;
    const signer = new UnisatSigner(window.unisat);
    console.log(await signer.getAddress());
    const trackerProvider = new CatTrackerProvider('fractal-testnet');
    const utxoProvider = new MempoolUtxoProvider('fractal-testnet');
    const chainProvider = new MempolChainProvider('fractal-testnet');




    const token1Info = await trackerProvider.tokenInfo(token1Id);
    const token2Info = await trackerProvider.tokenInfo(token2Id);



    const token1Metadata = token1Info.metadata;
    const token2Metadata = token2Info.metadata;
    const token1Covenant = new CAT20Covenant(token1Info.minterAddr);
    const token2Covenant = new CAT20Covenant(token2Info.minterAddr);

    const poolMetadata: SwapLpMeta = {
      name: `${token1Metadata.symbol}/${token2Metadata.symbol} lp token`,
      symbol: `${token1Metadata.symbol}/${token2Metadata.symbol}`,
      decimals: token1Metadata.decimals,
      minterMd5: SwapMainCovenant.LOCKED_ASM_VERSION,
      token1Addr: token1Covenant.address,
      token2Addr: token2Covenant.address,
    };
    console.log(poolMetadata);
    //开始交互
    message.open({
      key:'cw',
      type: 'loading',
      content: '正在部署...',
      duration: 0,
    })
    const poolDeployInfo = await deploy(
        signer,
        utxoProvider,
        chainProvider,
        poolMetadata,
        5
    )
    message.open({
      key:'cw',
      type: 'loading',
      content: '请签署交易信息...',
      duration: 0,
    })
    console.log('swap pool deploy: ', poolMetadata.name)
    console.log('lp tokenId: ', poolDeployInfo.tokenId)
    console.log('genesisTxid: ', poolDeployInfo.genesisTxid)
    console.log('revealTxid: ', poolDeployInfo.revealTxid)
    console.log(stringifyStateUtxo(poolDeployInfo.swapPoolUtxo))
    // console.log('swap pool deploy: ', poolMetadata.name)
    // console.log('lp tokenId: ', poolDeployInfo.tokenId)
    // console.log('genesisTxid: ', poolDeployInfo.genesisTxid)
    // console.log('revealTxid: ', poolDeployInfo.revealTxid)
    // console.log(stringifyStateUtxo(poolDeployInfo.swapPoolUtxo))
  };
  // 格式化数字，保留小数点后 5 位
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return ''; // 非数字直接返回空字符串
    return num.toString().replace(/^(.*\..{5}).*$/, '$1'); // 使用正则保留最多 5 位小数
  };
  //打开窗口1
  const opSList = (val)=>{
    setNowToken(val);
    setShowTokenList(true);
    
  };
  //选择了代币
  const handleTokenSelection = (symbol, name ,id,addr) => {
    // console.log('Token selected:', symbol, name);
    // console.log(id);
    if(!addr){
      addr = '-/-'
    }
    if(nowToken=='A'){
      setTokenA(symbol)
      setTokenAId(id)
      setTokenAAddr(addr)
    }
    if(nowToken=='B'){
      setTokenB(symbol)
      setTokenBId(id)
      setTokenBAddr(addr)
    }
  };
  // 处理输入框变化（卖出或买入）
  const handleInputChange = (type, value) => {
    // 验证输入是否为有效数字（包括空值和大于 0 的值）
    if (/^\d*\.?\d*$/.test(value) && (parseFloat(value) > 0 || value === '')) {
      if (type === 'sell') {
        setSellValue(value); // 更新卖出框
        setIsUserInput(true); // 标记为用户输入卖出框
      } else {
        setBuyValue(value); // 更新买入框
        setIsUserInput(false); // 标记为用户输入买入框
      }
    }
  };
  // 更新买入或卖出框的值，同时重新计算汇率
  useEffect(() => {
    if (isUserInput) {
      if (sellValue && exchangeRate > 0) {
        const calculatedBuyValue = parseFloat(sellValue) * exchangeRate; // 根据卖出框计算买入值
        setBuyValue(formatNumber(calculatedBuyValue));
      }
    } else {
      if (buyValue && exchangeRate > 0) {
        const calculatedSellValue = parseFloat(buyValue) / exchangeRate; // 根据买入框计算卖出值
        setSellValue(formatNumber(calculatedSellValue));
      }
    }
    calculateExchangeRate(); // 重新计算汇率
  }, [sellValue, buyValue]);

  // 根据用户输入的买卖值计算实时汇率
  const calculateExchangeRate = () => {
    if (sellValue && buyValue) {
      const aToB = parseFloat(buyValue) / parseFloat(sellValue); // 买入/卖出得出 A 转 B 汇率
      const bToA = parseFloat(sellValue) / parseFloat(buyValue); // 卖出/买入得出 B 转 A 汇率
      setaTOb(formatNumber(aToB)); // 设置 A->B 汇率
      setbTOa(formatNumber(bToA)); // 设置 B->A 汇率
    } else {
      setaTOb('*'); // 重置汇率显示
      setbTOa('*'); // 重置汇率显示
    }
  };
  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: '资金池',
      width: 150,
      dataIndex: 'tokens',
      key: 'tokens',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={record.t1Icon} alt="icon" style={{ width: 25, height: 25, marginRight: 5, borderRadius: 50 }} />
          <img src={record.t2Icon} alt="icon" style={{ width: 25, height: 25, marginRight: 5, borderRadius: 50 }} />
          <span><b>{record.t1}/{record.t2}</b>&nbsp;{record.from1}</span>
        </div>
      ),
    },
    {
      title: 'TVL',
      dataIndex: 'allnum',
      key: 'allnum',
    },
    {
      title: '年化利率',
      dataIndex: 'yearGet',
      key: 'yearGet',
    },
    {
      title: '1天交易量',
      dataIndex: 'num1',
      key: 'num1',
    },
    {
      render: (text, record) => (
        <Button type="primary" shape="round" icon={<LoginOutlined />}>
        add
      </Button>
      ),
    }
  ];
  const data = [
    {
      key: '1',
      index: '1',
      t1: 'CAT20',
      t2: 'USDT',
      t1Icon: 'image/cat.jpg',
      t2Icon: 'image/usdt.png',
      allnum: '$30.7亿',
      yearGet: '60.5%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
    {
      key: '2',
      index: '2',
      t1: 'ETH',
      t2: 'USDT',
      t1Icon: 'image/ETH.png',
      t2Icon: 'image/usdt.png',
      allnum: '$11.2亿',
      yearGet: '2.5%',
      num1: '$0.1亿',
      num30: '$10.7亿'
    },
    {
      key: '3',
      index: '3',
      t1: 'AVAX',
      t2: 'USDT',
      t1Icon: 'image/avax.png',
      t2Icon: 'image/usdt.png',
      allnum: '$10.7亿',
      yearGet: '8.6%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
    {
      key: '4',
      index: '1',
      t1: 'CAT20',
      t2: 'USDT',
      t1Icon: 'image/cat.jpg',
      t2Icon: 'image/usdt.png',
      allnum: '$30.7亿',
      yearGet: '60.5%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
    {
      key: '5',
      index: '2',
      t1: 'ETH',
      t2: 'USDT',
      t1Icon: 'image/ETH.png',
      t2Icon: 'image/usdt.png',
      allnum: '$11.2亿',
      yearGet: '2.5%',
      num1: '$0.1亿',
      num30: '$10.7亿'
    },
    {
      key: '6',
      index: '3',
      t1: 'AVAX',
      t2: 'USDT',
      t1Icon: 'image/avax.png',
      t2Icon: 'image/usdt.png',
      allnum: '$10.7亿',
      yearGet: '8.6%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
    {
      key: '7',
      index: '1',
      t1: 'CAT20',
      t2: 'USDT',
      t1Icon: 'image/cat.jpg',
      t2Icon: 'image/usdt.png',
      allnum: '$30.7亿',
      yearGet: '60.5%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
    {
      key: '8',
      index: '2',
      t1: 'ETH',
      t2: 'USDT',
      t1Icon: 'image/ETH.png',
      t2Icon: 'image/usdt.png',
      allnum: '$11.2亿',
      yearGet: '2.5%',
      num1: '$0.1亿',
      num30: '$10.7亿'
    },
    {
      key: '9',
      index: '3',
      t1: 'AVAX',
      t2: 'USDT',
      t1Icon: 'image/avax.png',
      t2Icon: 'image/usdt.png',
      allnum: '$10.7亿',
      yearGet: '8.6%',
      num1: '$2.7亿',
      num30: '$10.7亿'
    },
  ];
  
  return (
    <div className="swap limit pool">
      <div className="page1-container">
        <div className="backgroundPer">
          CAT-20
          <br />
          SWAP
        </div>
        <div className="mBuild setBox " style={{position: 'relative'}}>
          <div className='orderBuild flex1'>
            <span className='poolTitle'>
              交易资金池
              <input className="tokenSearch" placeholder='搜索资金池'/>
              <Button className="tokenSearchBtn" type="primary" shape="circle" icon={<SearchOutlined />} />
            </span>
            <div className='orderList'>
              <Table pagination={{position: ['bottomCenter']}} columns={columns} dataSource={data} />
            </div>
          </div>
          <div className="page1-box">
            <span className='poolTitle'>
              添加流动性
              {/* <font className="question">
                <Tooltip color="blue" title="代币奖励池与交易资金池一一对应，代币来源为用户捐赠，向资金池中添加流动性，即可获取额外代币奖励">
                  <QuestionCircleOutlined />
                </Tooltip>
              </font> */}
            </span>
            {/* <div className="panl-box setBox noLine">
             
            </div> */}
            <div className="panl-box setBox noLine">
              {/* <div className="changeBtn">
                <ArrowDownOutlined />
              </div> */}
              <div className="flex1 tokenS setBox noLine">
                <div className="title">
                  add
                </div>
                <div className="input flex1 setBox">
                  {/* 使用 sellValue 和 handleSellInput */}
                  <input
                    className='flex1 numInput getWidth'
                    placeholder='0'
                    type="text"
                    value={sellValue}
                    onChange={(e) => handleInputChange('sell', e.target.value)}
                  />
                  <Tooltip color="blue" title={tokenAId}>
                    <div className='tokenSelect' onClick={()=>opSList('A')}>
                      <img src='./image/cat.jpg' className='tokenIcon' />
                      <font className='tokenName'>{tokenA}</font>
                      <DownOutlined className='sdown' />
                    </div>
                  </Tooltip>
                </div>
                <div className="price">
                -
                </div>
              </div>
              <div className="flex1 tokenR setBox noLine">
                <div className="title">
                  add
                </div>
                <div className="input flex1 setBox">
                  {/* 使用 buyValue 和 handleBuyInput */}
                  <input
                    className='flex1 numInput getWidth'
                    placeholder='0'
                    type="text"
                    value={buyValue}
                    onChange={(e) => handleInputChange('buy', e.target.value)}
                  />
                  <Tooltip color="blue" title={tokenBId}>
                    <div className='tokenSelect' onClick={()=>opSList('B')}>
                      <img src='./image/fb.png' className='tokenIcon' />
                      <font className='tokenName'>{tokenB}</font>
                      <DownOutlined className='sdown' />
                    </div>
                  </Tooltip>
                </div>
                <div className="price">
                -
                </div>
              </div>
              <font className="liMsg">预估金额可能与实际金额略有不同</font>
              <font className="liMsg">1&nbsp;{tokenA} = {aTOb}&nbsp;{tokenB}</font>
              <font className="liMsg">1&nbsp;{tokenB} ={bTOa}&nbsp;{tokenA}</font>
              <br/>
              {address?(
                sellValue && buyValue?(
                  <div className='addli' onClick={handleConnectWallet}>
                    添加流动性
                  </div>
                ):(
                  <div className='addli nolj' >
                    添加流动性
                  </div>
                )
              ):(
                <div className='addli nolj' >
                  请连接钱包
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TokenListModal 
        isModalOpen={showTokenList} 
        setShowTokenList={setShowTokenList} 
        handleOk=''
        onTokenSelect={handleTokenSelection} // 传递回调函数
      />
    </div>
  );
};
export default PageTwo;