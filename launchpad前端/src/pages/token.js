import React, { useState, useEffect, useRef } from 'react';
import { Button, Progress, Select, Table, Space, message, Skeleton, Tooltip,Pagination} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';  // 导入 useNavigate 钩子
import './box.scss';
import './token.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { RightOutlined, CopyOutlined } from '@ant-design/icons';
import { createChart } from 'lightweight-charts';
import { crosshairMode, CrosshairMode } from 'lightweight-charts';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { _URL , _Tracker_BASE} from "../api/url";
import copy from 'copy-to-clipboard';
const Token = () => {
  const navigate = useNavigate();
  const address = useSelector((state) => state.user.address); //读取 Redux状态中的地址
  const chartContainerRef = useRef(null); //k线图容器
  const [activeBtn, setActiveBtn] = useState('buy'); // 用来跟踪当前激活的按钮
  const [nowToken, setNowToken] = useState('FB');
  const [toToken, setToToken] = useState('#');
  const [nowImage, setNowImage] = useState('./image/fb.png');
  const [toImage, setToImage] = useState('./image/fb.png');
  const [sellValue, setSellValue] = useState(0);
  const [tokenDt, setTokenDt] = useState([]);  //代币详情
  const [loading, setLoading] = useState(false); // 加载中
  const [tradeLoading, setTradeLoading] = useState(true); // 交易记录加载中
  const [holderLoading, setholderLoading] = useState(true); // 持有人加载中
  const [receiveNum, setreceiveNum] = useState('0'); // 获取到的token数量
  const [sendNum, setsendNum] = useState('0'); // 获取到的需要支付的Fb的数量
  const [fbhasNum, setfbhasNum] = useState('0'); // 用户钱包余额FB
  const [tokenhasNum, settokenhasNum] = useState('0'); // 用户钱包余额token
  const [sellreceive, setsellreceive] = useState('0'); // 卖出代币时，收获的数量（fb或token）
  const [sellsend, setsellsend] = useState('0'); // 卖出代币，发送的数量（fb或token）
  const [tradeList, setTradeList] = useState([]); // 交易列表
  const [holderList, setHolderList] = useState([]); // 持有人列表
  const [pageSizeT, setPageSizeT] = useState(15); // 页大小
  const [pageNumT, setPageNumT] = useState(1); // 页码
  const [total, setTotal] = useState(0); // 总条数
  const [interval, setInterval] = useState(60*60); // 页大小
  const token_buy_receiving_addr = useSelector((state) => state.user.token_buy_receiving_addr); // 读取 Redux 状态中的地址
  const token_sell_addr = useSelector((state) => state.user.token_sell_addr); // 读取 Redux 状态中的地址
  //获取url参数
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id'); // 获取查询参数 'id'
  //获取代币详情
  useEffect(() => {
    getTokenDt(true)
    //获取一下钱包余额
    setTimeout(() => {
      getFbNum()
    }, 500);
  }, []);  // 空依赖数组意味着这个请求只会在组件第一次加载时发起
  //监听连接钱包
  useEffect(() => {
    if(address){
       //获取一下钱包余额
       getFbNum()
       gettokenNum() //获取一下余额
    }else{
      setfbhasNum(0)
    }
  }, [address]); 
  //获取代币详情
  const getTokenDt = () => {
    setLoading(true);
    axios.get(_URL.findTokenOne + '/' + id)
      .then(response => {
        setLoading(false);
        //console.log(JSON.stringify(response));
        setTokenDt(response.data.data)
        setToToken(response.data.data.tokenTicker);
        setToImage(fixUrl(response.data.data.tokenImage));
        //获取代币交易记录
        getTradelist(response.data.data.id,1);
        //获取持有人列表
        getTokenHolders(response.data.data.id,1);
        //获取k线
        showLine(response.data.data.createdAt,response.data.data.id)
      })
      .catch(error => {
        setLoading(false);
        message.error('Failed to fetch data!');
      });
  }
  //获取交易记录
  const getTradelist = (id,page) => {
      setTradeLoading(true);
      axios.get(_URL.tradelist,{
        params: {
          pageSize: pageSizeT, // 页大小
          pageNum: page,   // 页码
          token:id,
          orderByColumn:'created_at',
          isAsc:'descending'
        }
      })
      .then(response => {
        setTradeLoading(false);
        //console.log(JSON.stringify(response));
        setTradeList(response.data.data.list);
        setTotal(response.data.data.total)
      })
      .catch(error => {
        message.error('tradelist error');
      });
  }
  //获取持有人列表
  const getTokenHolders = (id,page) =>{
    setholderLoading(true)
    axios.get(_URL.findHolderList,{
      params: {
        pageSize: 10, // 页大小
        pageNum: 1,   // 页码
        token:id,
        // orderByColumn:'created_at',
        // isAsc:'descending'
      }
    })
    .then(response => {
      setholderLoading(false);
      setHolderList(response.data.data.list)
      // console.log(JSON.stringify(response));
      // setTradeList(response.data.data.list);
      // setTotal(response.data.data.total)
    })
    .catch(error => {
      message.error('tradelist error');
    });
  }
  //获取钱包余额fb
  const getFbNum = async () => {
    if(address){
      try {
        let res = await window.unisat.getBalance();
   //    let res = window.okxwallet.bitcoin.getBalance()
        console.log(res.total/100000000);
        setfbhasNum(res.total/100000000);
      } catch (e) {
       // console.log(e);
      }
    }
  };
  //获取钱包余额token
  const gettokenNum = async () => {
    if(address){
      axios.get(_URL.findHolderList, {
        params: {
          pageSize: 10, // 页大小
          pageNum: 1,   // 页码
          token:tokenDt.id,
          wallet:address
        }
      })
        .then(response => {
          if(response.data.data.list.length>0){
            settokenhasNum(response.data.data.list[0].currentTokenAmount)
          }else{
            settokenhasNum(0)
          }
          
        })
        .catch(error => {
         // console.error('Error fetching data:', error);
          message.error('Failed to fetch data!');
        });
    }
  };
  const sendFb = async (val) => {
     message.open({
      key:'buy',
      type: 'loading',
      content: '请确认转账...',
      duration: 0,
    })
    try {
      let sendNumTrue = val*100000000
      let txid = await window.unisat.sendBitcoin(token_buy_receiving_addr,sendNumTrue);
      //提交表单
      let data = {
          "token": tokenDt.id,
          "actionType": "buy",
          "fbAmount": Number(val),
          "transferTxid": txid
      }
      message.open({
        key:'buy',
        type: 'loading',
        content: '请稍候...',
        duration: 0,
      })
     // 使用 axios 提交表单数据
      axios.post(_URL.trade, data, {
        headers: {
           Authorization: `Bearer ${localStorage.getItem('token')}`  // 动态传递 Authorization 头
        }
      })
      .then((response) => {
            message.success({
              key: 'buy',
              content: '购买成功，请等待交易确认',
              duration: 2,
            });
            getFbNum()
      })
      .catch((error) => {
          message.error({
            key: 'buy',
            content: '购买失败，请联系管理员',
            duration: 2,
          });
      });
    } catch (e) {
      message.error({
        key: 'buy',
        content: '您已取消购买',
        duration: 2,
      });
     // console.log(e);
    }
  };
  //发送代币
  const sendToken = async (val) => {
      message.open({
        key:'sell',
        type: 'loading',
        content: '正在计算卖出gas费...',
        duration: 0,
      })
      //获取链上GAS费
        axios.get(_URL.getFee).then(async response => {
            //先获取用户的持币UTXO
            axios.get(`${_Tracker_BASE}/api/tokens/${id}/addresses/${address}/utxos?limit=4`).then(async response => {
                //console.log(JSON.stringify(response));
                let utxos = JSON.data.data.utxos
                let cat20Utxos = utxos.map((utxoData) => {
                  if (typeof utxoData.utxo.satoshis === 'string') {
                    utxoData.utxo.satoshis = parseInt(utxoData.utxo.satoshis);
                  }
                
                  const cat20Utxo = {
                    utxo: utxoData.utxo,
                    txoStateHashes: utxoData.txoStateHashes,
                    state: {
                      ownerAddr: utxoData.state.address,
                      amount: BigInt(utxoData.state.amount),
                    },
                  };
                
                  return cat20Utxo;
                });
                console.log(JSON.stringify(cat20Utxos));
            })
            .catch(error => {
              message.error('get utxo error');
            });
        
        })
        .catch(error => {
          message.error('get gas error');
        });
  };
  // 处理出售输入框的输入事件
  const handleSellInput = (event) => {
    let value = event.target.value;
    // 验证输入是否为大于零的数字或小数（允许以数字开头，最多一个小数点）
    if (/^\d*\.?\d*$/.test(value)) {
      if (value === '' || parseFloat(value) >= 0) {
        setSellValue(value); // 允许合法输入或空值（方便用户删除内容）
        //获取报价,买入时
        if(activeBtn=='buy'){
          if(value&&value>0){
            getTokenPrice(value);
          }else{
            setreceiveNum('0')
            setsendNum('0')
          }
        }
        if(activeBtn=='sell'){
          if(value&&value>0){
            getTokenPriceSell(value);
          }else{
            setsellreceive('0')
            setsellsend('0')
          }
        }
      }
    }
  };
  //快捷输入数字
  const setSellValueTop = (val)=>{
    if(val==0){
      setreceiveNum('0')
      setsendNum('0')
      setsellreceive('0')
      setsellsend('0')
      setSellValue(val)
    }else{
       //设置数字
        setSellValue(val)
        //获取报价
        if(activeBtn=='buy'){
          getTokenPrice(val);
        }
        if(activeBtn=='sell'){
          getTokenPriceSell(val);
        }
    }
  }
  //发起交易
  const goTrade = ()=>{
        //买入
        if(activeBtn=='buy'){
              //获取一下钱包余额
              getFbNum()
              if (address) {
                let fbNum = ''
                if(toToken!='FB'){
                  fbNum = sellValue
                }else{
                  fbNum = sendNum
                }
                if(fbNum>0){
                    if(Number(fbhasNum)>Number(fbNum)){
                      //进行交易，向中心化钱包转账
                      //bc1p6fdu9knknj8ju4r6ylcd2tqmqg2vd50p3twkj8nnzhmfgnjw90eq9q93gr
                      sendFb(fbNum)
                    }else{
                      message.info('Insufficient FB balance');
                    }
                }
              } else {
                message.info('Please connect your wallet.');
              }
        }
        //卖出
        if(activeBtn=='sell'){
          gettokenNum() //获取一下余额
          if (address) {
            let tokenNum = ''
            if(toToken=='FB'){
              tokenNum = sellValue
            }else{
              tokenNum = sellsend
            }
           // alert(tokenNum)
            // if(tokenNum>0){
            //     if(Number(tokenhasNum)>=Number(tokenNum)){
            //       sendToken(tokenNum)
            //     }else{
            //       message.info('Insufficient '+tokenDt.tokenTicker+' balance');
            //     }
            // }
            sendToken(tokenNum)
          }else {
            message.info('Please connect your wallet.');
          }
        }
  }
  const getTokenPrice = (value) => {
    let data
    if(toToken!='FB'){
      //根据FB获取代币数量
       data = {
        "token": tokenDt.id,
        "actionType": "buy",
        "fbAmount": Number(value)
      };
    }else{
       //根据代币获取FB数量
       data = {
        "token": tokenDt.id,
        "actionType": "buy",
        "tokenAmount": Number(value)
      };
    }
    axios.post(_URL.calTokenAmount, data )
      .then(response => {
        if(toToken!='FB'){
          setreceiveNum(response.data.data.deltaTokenAmount)
        }else{
          setsendNum(response.data.data.deltaFbAmount)
        }
      })
      .catch(error => {
        message.error('get price error');
      });
  }

  const getTokenPriceSell = (value) => {
 
    let data
    if(toToken=='FB'){
    
      //根据FB获取代币数量
       data = {
        "token": tokenDt.id,
        "actionType": "sell",
        "tokenAmount": Number(value)
      };
    }else{
     
       //根据代币获取FB数量
       data = {
        "token": tokenDt.id,
        "actionType": "sell",
        "fbAmount": Number(value)
      };
    }
    axios.post(_URL.calTokenAmount, data )
      .then(response => {
        if(toToken=='FB'){
          setsellreceive(response.data.data.deltaFbAmount)
        }else{
          setsellsend(response.data.data.deltaTokenAmount)
        }
      })
      .catch(error => {
        message.error('get price error');
      });
  }

  const selectActive = (val) => {
    setActiveBtn(val); // 设置当前激活的按钮索引
    getFbNum() //获取一下余额
    gettokenNum() //获取一下余额
    //输入框显示框重置
    setSellValue(0);
    setreceiveNum(0)
    setsendNum(0)
    setsellreceive(0)
    setsellsend(0)
    //设置目标代币（仅显示）
    if(val=='sell'){
      setNowToken(tokenDt.tokenTicker);
      setToToken('FB');
      setNowImage(fixUrl(tokenDt.tokenImage));
      setToImage('./image/fb.png');
    }else{
      setNowToken('FB');
      setToToken(tokenDt.tokenTicker);
      setNowImage('./image/fb.png');
      setToImage(fixUrl(tokenDt.tokenImage));
    }
  }
  const changeToken = () => {
    setNowToken(toToken);
    setToToken(nowToken);
    setNowImage(toImage);
    setToImage(nowImage);
    //重置输入框和价格
    setSellValue(0)
    setreceiveNum('0')
    setsendNum('0')
  }
  //显示K线的方法
  const showLine = (time,id)=>{
    //代币上架时间
    let stime = time?time:tokenDt.createdAt;
    let dbid = id?id:tokenDt.id;
    //当前时间
    const currentDate = new Date(); // 获取当前时间
    const etime = currentDate.toISOString(); // 转换为 ISO 8601 格式
    axios.get(_URL.kline,{
      params: {
        startTime:stime,
        endTime:etime,
        interval:interval,
        token:dbid,
      }
    })
    .then(response => {
      let datas2 = response.data
      const chartOptions = {
        layout: {
          textColor: 'white',
          background: { type: 'solid', color: 'rgba(0,0,0,0)' },
        },
        grid: {
          vertLines: {
            color: 'rgba(255, 255, 255, 0.1)', // 调整竖线颜色
          },
          horzLines: {
            color: 'rgba(255, 255, 255, 0.1)', // 调整横线颜色
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal, // 使十字指示器可以自由移动
        },
        timeScale: {
          timeVisible: true, // 显示时间
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000); // 转换时间戳为 Date 对象
            const minutes = date.getMinutes().toString().padStart(2, '0'); // 获取分钟，并补充两位数
            const hours = date.getHours().toString().padStart(2, '0'); // 获取小时，并补充两位数
            return `${hours}:${minutes}`; // 返回分钟格式
          },
          // 控制显示的最小数据量，这样就不会空旷
          barSpacing: 5, // 增加柱状图间隔
          fixLeftEdge: true,
          minBarSpacing: 5,
        },
      };
      const chart = createChart(chartContainerRef.current, chartOptions);
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });
  
      // 静态的 15 分钟 K线数据
      const datas = [
        { time: 1545450000, open: 148.49, high: 155.00, low: 145.00, close: 150.00 },
        { time: 1545450300, open: 150.00, high: 158.00, low: 149.00, close: 157.00 }, // 涨幅大
      ];
      const data2 = [
        {
            "time": 1739255500,
            "open": 2.98539867,
            "high": 3.1811116,
            "low": 2.79589886,
            "close": 2.95904985,
            "volume": 1274841848
        },
        {
            "time": 1739342000,
            "open": 2.95904985,
            "high": 2.95904985,
            "low": 2.95904985,
            "close": 2.95904985,
            "volume": 0
        }
    ]
      candlestickSeries.setData(datas2);
      chart.timeScale().fitContent();
      // 清理图表
      return () => {
        chart.remove();
      };
    })
    .catch(error => {
      message.error('k error');
    });
   
  }
  //交易记录表头
  const columns = [
    {
      title: 'address',
      dataIndex: 'wallet',
      key: 'wallet',
      width: 200, // 让第一列变短
      render: (text, record) => (
        <font>
         {record.wallet.slice(0, 5)}... {record.wallet.slice(-5)}
         </font>
      )
    },
    {
      title: 'type',
      dataIndex: 'actionType',
      key: 'actionType',
    },
    {
      title: 'FB',
      dataIndex: 'fbAmount',
      key: 'fbAmount',
      render: (text, record) => (
        <font>
         {record.actionType=='buy'?'-':'+'}{record.fbAmount}
        </font>
      )
    },
    {
      title: tokenDt.tokenTicker? tokenDt.tokenTicker:'#',
      dataIndex: 'tokenAmount',
      key: 'tokenAmount',
      render: (text, record) => (
        <font>
         {record.actionType=='sell'?'-':'+'}{record.tokenAmount}
        </font>
      )
    },
    {
      title: 'time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text, record) => (
        <font>
         {formatDate(record.createdAt)}
        </font>
      )
    },
    {
      title: 'status',
      dataIndex: 'status',
      key: 'status',
    }
  ];
  //转换方法
  const formatDate =(isoString) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 获取月份，注意月份是从0开始的
    const day = date.getDate().toString().padStart(2, '0'); // 获取日期
    const hours = date.getHours().toString().padStart(2, '0'); // 获取小时
    const minutes = date.getMinutes().toString().padStart(2, '0'); // 获取分钟
    const seconds = date.getSeconds().toString().padStart(2, '0'); // 获取秒

    // 拼接成目标格式
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  //持有人列表
  const columnsHolders = [
    {
      title: 'address',
      dataIndex: 'wallet',
      key: 'wallet',
      render: (text, record) => (
        <font>
         {record.wallet.slice(0, 5)}... {record.wallet.slice(-5)}
         </font>
      )
    },
    {
      title: 'num',
      dataIndex: 'currentTokenAmount',
      key: 'currentTokenAmount',
      render: (text, record) => (
        <font>
         {record.currentTokenAmount}{record.tokenTicker}
         </font>
      )
    },
    {
      title: 'proportion',
      dataIndex: 'percent',
      key: 'percent',
      render: (text, record) => (
        <font>
         {(record.percent*100).toFixed(2)}%
         </font>
      )
    },
  ];
  
  //时间换算
  const timeAgo = (dateString) => {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - targetDate) / 1000); // 时间差（秒）

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60); // 时间差（分钟）
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60); // 时间差（小时）
    if (diffInHours < 24) {
      const minutes = diffInMinutes % 60;
      return `${diffInHours}h ${minutes}m ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24); // 时间差（天）
    const hours = diffInHours % 24;

    // 超过一天时，不显示分钟
    return `${diffInDays}d ${hours}h ago`;
  }
  //修复图片url
  const fixUrl = (url) => {
    if (url) {
      // 如果 url 中包含 "http:/", 则将其修正为 "http://"
      if (url.startsWith("http:/")) {
        return "http://" + url.slice(5); // 去掉多余的字符，并添加正确的前缀
      }
      return url;
    }
  };
  //复制id
  const copyToClipboard = (text) => {
    const isCopied = copy(text);
    if (isCopied) {
      message.success('Copied to clipboard!');
    } else {
      message.error('Copy failed!');
    }
  };
  // 控制分页按钮是否出现
  const showPage = () => {
    return false; // 禁用分页
  };
  //网站检查
  const validateAndFixUrl = (url) => {
    // 检查URL是否符合网站格式
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
    if (!urlPattern.test(url)) {
      throw new Error("Invalid URL format.");
    }
    // 如果没有 http:// 或 https:// 前缀，则补充
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url; // 默认添加 http:// 前缀
    }
    return url;
  };
  //跳转外链
  const goLink = (url) => {
    try {
      const correctedUrl = validateAndFixUrl(url);
      window.open(correctedUrl);
    } catch (e) {
      message.error('URL error');
    }
  }
  return (
    <div className="tokenDetail">
      <div className='mainBuild setBox'>
        <div className='goBack' onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i>
      
        </div>
        <div className='leftView  flex1'>
          {loading ? (
            <div className='messageBar'>
              <Skeleton.Node
                active="true"
                className='titleNode'
                style={{
                  display: 'block',
                  backgroundColor: 'rgba(135, 172, 245, 0.2)',
                }}
              />
            </div>
          ) : (
            <div className='messageBar'>
              <font>
                {tokenDt.tokenTicker}
              </font>
              <font className="tokenName getColor">
                {tokenDt.tokenName}
              </font>
              <font className="time getColor">
                {timeAgo(tokenDt.createdAt)}
              </font>
              <font className="marketCap getColor">
                ${tokenDt.marketValue?tokenDt.marketValue.toFixed(3):''}FB
              </font>
            </div>
          )}
          <div className='tradingView  setBox ownerStyle getBg'>
            <div className='viewInner flex1 getWidth' ref={chartContainerRef}>

            </div>
          </div>
          <div className='swapList'>
            <div className='messageBar getMt'>
              <font>
                Trads
              </font>
            </div>
              {tradeLoading?(
                Array(5).fill(null).map((_, index) => (
                  <Skeleton.Node
                  active="true"
                  className='tradeListNode'
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(135, 172, 245, 0.1)',
                  }}
                />
              ))
            ):(
             <div>
               <Table className='innerTable getBg' pagination={false} columns={columns} dataSource={tradeList} />
                <center>
                  <Pagination
                    className='homePagination'
                    simple={{
                      readOnly: true,
                    }}
                    current={pageNumT}
                    pageSize={pageSizeT}
                    total={total}
                    onChange={(page) => {
                      getTradelist(tokenDt.id,page)
                      setPageNumT(page);
                    }}
                  />
                </center>
             </div>
            )}
          </div>
        </div>
        <div className='rightView '>
          <div className='messageBar'>
            <font>
              Trad
            </font>
          </div>
          <div className='swapPanel getBg'>
            <div className='tradBtn setBox'>
              <div onClick={() => selectActive('buy')} className={`flex1 usn tradBtnItem ${activeBtn === 'buy' ? 'tradBtnActive' : ''}`}>
                buy
              </div>
              <div onClick={() => selectActive('sell')} className={`flex1 usn tradBtnItem ${activeBtn === 'sell' ? 'tradBtnActive' : ''}`}>
                sell
              </div>
            </div>
            <div className='swapFrom'>
              <div className='switch'>
                <div className='switchBtn usn' onClick={() => changeToken()}>switch to {toToken}</div>
              </div>
              <div className='amount'>
                {nowToken}
                <font style={{ float: 'right', fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                  {activeBtn=='buy'?(
                    <font>balance:{fbhasNum}FB</font>
                  ):(
                    <font>balance:{tokenhasNum}{tokenDt.tokenTicker}</font>
                  )}
                </font>
              </div>
              <div className='numInput setBox'>
                <input className='flex1 nipt'  value={sellValue} onChange={handleSellInput} />
                <font className="intk">{nowToken}</font>
                <img src={nowImage} className='tIcon' />
              </div>
              {nowToken === 'FB' ? (
                <div className='quickInput setBox'>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(0)}>reset</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(5)}>5FB</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(10)}>10FB</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(100)}>100FB</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(1000)}>1000FB</div>
                </div>
              ) : (
                <div className='quickInput setBox'>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(0)}>reset</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(5000)}>5K</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(10000)}>10K</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(100000)}>100K</div>
                  <div className='flex1 quickInputItem usn' onClick={() => setSellValueTop(1000000)}>1000K</div>
                </div>
              )}

                  {activeBtn=='buy'?(
                    <font>
                      {toToken=='FB'?(
                        <font className="tokenPrice">
                          send {sendNum} {toToken}
                        </font>
                      ):(
                        <font className="tokenPrice">
                          receive {receiveNum} {toToken}
                        </font>
                      )}
                    </font>
                  ):(
                    <font>
                      {toToken=='FB'?(
                        <font className="tokenPrice">
                          receive {sellreceive} {toToken}
                        </font>
                      ):(
                        <font className="tokenPrice">
                          send {sellsend} {toToken}
                        </font>
                      )}
                    </font>
                  )}
            </div>
            <div className='tradSub setBox'>
              <div className='tradSubBtn flex1 usn' onClick={()=>goTrade()}>
                Trade 
              </div>
            </div>
          </div>
          <div className='messageBar getMt'>
            <font>
              Token Info
            </font>
          </div>
          <div className='tokenMsg getBg'>
            <div className='msg1'>
              {loading ? (
                <Skeleton.Node
                  active="true"
                  className='imgNode'
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(135, 172, 245, 0.2)',
                  }}
                />
              ) : (
                <div className='tokenImage' style={{ backgroundImage: `url(${fixUrl(tokenDt.tokenImage)})` }}></div>
              )}
              {loading ? (
                <div className='flex1 tokenMsgView'>
                  <Skeleton.Node
                    active="true"
                    className='tvmnode1'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                  <Skeleton.Node
                    active="true"
                    className='tvmnode2'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                  <Skeleton.Node
                    active="true"
                    className='tvmnode3'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                  <Skeleton.Node
                    active="true"
                    className='tvmnode3'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                  <Skeleton.Node
                    active="true"
                    className='tvmnode3'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                  <Skeleton.Node
                    active="true"
                    className='tvmnode3'
                    style={{
                      display: 'block',
                      backgroundColor: 'rgba(135, 172, 245, 0.2)',
                    }}
                  />
                </div>
              ) : (
                <div className='flex1 tokenMsgView'>
                  <span className='tmv1'>{tokenDt.tokenName}</span>
                  <span className='tmv2'>{tokenDt.tokenTicker}</span>
                  <span className='tmv3'> {timeAgo(tokenDt.createdAt)}</span>
                  <span
                    className='tmv4'
                    onClick={(e) => {
                      e.stopPropagation(); // 防止触发父级点击事件
                      copyToClipboard(tokenDt.tokenId);
                    }}
                  >
                    <Tooltip title={tokenDt.tokenId} color="purple">
                      {tokenDt.tokenId ? tokenDt.tokenId.toUpperCase().slice(0, 3) : ''}...{tokenDt.tokenId ? tokenDt.tokenId.toUpperCase().slice(-6) : ''}
                      <CopyOutlined style={{ float: 'right', marginTop: '7px', cursor: 'pointer' }} className='copyIcon' />
                    </Tooltip>
                  </span>
                  <span className='tmv5'> ${tokenDt.marketValue?tokenDt.marketValue.toFixed(3):''}FB</span>
                  <span className='tmv6 setBox '>
                    {tokenDt.twitter && (
                      <div className='flex1 '>
                          <Tooltip title={tokenDt.twitter} color="purple">
                            <i
                              className="fa-brands fa-x-twitter faIcon tmIcon"
                              onClick={(e) => {
                                e.stopPropagation(); // 防止触发父级点击事件
                                goLink(tokenDt.twitter);
                              }}
                            >
                            </i>
                          </Tooltip>
                      </div>
                    )}
                    {tokenDt.telegram && (
                      <div className='flex1 '>
                          <Tooltip title={tokenDt.telegram} color="purple">
                            <i
                              className="fa-solid fa-paper-plane faIcon tmIcon"
                              onClick={(e) => {
                                e.stopPropagation(); // 防止触发父级点击事件
                                goLink(tokenDt.telegram);
                              }}
                            >
                            </i>
                          </Tooltip>
                      </div>
                    )}
                    {tokenDt.website && (
                      <div className='flex1 '>
                          <Tooltip title={tokenDt.website} color="purple">
                            <i
                              className="fa-solid fa-globe faIcon tmIcon"
                              onClick={(e) => {
                                e.stopPropagation(); // 防止触发父级点击事件
                                goLink(tokenDt.website);
                              }}
                            ></i>
                          </Tooltip>
                      </div>
                    )}
                    <div style={{marginRight:'20px'}}>
                        <i className="fa-regular fa-user faIconUser tmIcon"></i>
                        <font className="tmHolder">{tokenDt.holderNum}</font>
                    </div>
                  </span>
                </div>
              )}
            </div>
            <div className='msgProgress'>
              {loading ? (
                <Skeleton.Node
                  active="true"
                  className='progressNode'
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(135, 172, 245, 0.2)',
                  }}
                />
              ) : (
                <Progress percent={tokenDt.progress?(tokenDt.progress*100).toFixed(2):0} className='tokenProgress' />
              )}
            </div>
            <div className='msg2'>
              {loading ? (
                <Skeleton.Node
                  active="true"
                  className='infoInnerNode'
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(135, 172, 245, 0.2)',
                  }}
                />
              ) : (
                <p className='infoInner'>
                 {tokenDt.description}
                </p>
              )}

            </div>
          </div>
          <div className='messageBar getMt'>
            <font>
              Holds
            </font>
          </div>
          {/* <div className='holderList getBg'> */}
          <Table className=' innerTable getBg' style={{ marginRight: '0' }} pagination={false} columns={columnsHolders} dataSource={holderList} />
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};
export default Token;