import React, { useState,useEffect } from 'react';
import { Button, Radio, Space, Table, Tag,Tooltip,Pagination} from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './swap.scss';
import './limit.scss';
import './pool.scss';
import './box.scss';
import { LinkOutlined,QuestionCircleOutlined,SearchOutlined,ArrowDownOutlined,DownOutlined,LoginOutlined} from '@ant-design/icons';
const PageTwo = () => {
  // 创建两个独立的状态
  const [sellValue, setSellValue] = useState('');
  const [buyValue, setBuyValue] = useState('');
// const [exchangeRate, setExchangeRate] = useState(-1); // 兑换比例，初始为 -1
  const [exchangeRate, setExchangeRate] = useState(7.69); // 兑换比例，初始为 -1
  const [aTOb, setaTOb] = useState('*'); //
  const [bTOa, setbTOa] = useState('*'); //
  
// 处理出售输入框的输入事件
const handleSellInput = (event) => {
  let value = event.target.value;
  // 验证输入是否为大于零的数字或小数
  if (/^\d*\.?\d*$/.test(value)) {
    if (parseFloat(value) > 0 || value === '') {
      setSellValue(value); // 允许合法输入，或空值（方便用户删除内容）
    }
  }
};
// 处理购买输入框的输入事件
const handleBuyInput = (event) => {
  let value = event.target.value;
  // 验证输入是否为大于零的数字或小数
  if (/^\d*\.?\d*$/.test(value)) {
    if (parseFloat(value) > 0 || value === '') {
      setBuyValue(value); // 允许合法输入，或空值（方便用户删除内容）
    }
  }
};

// 监听 sellValue 或 buyValue 变化时触发 getTokenNum
useEffect(() => {
  getTokenNum();
}, [sellValue, buyValue]); // 当 sellValue 或 buyValue 改变时触发


// 监听 
useEffect(() => {
  if(exchangeRate>0){
    setBuyValue(sellValue*exchangeRate)
  }
  //getTokenNum();
}, [sellValue]); // 当 sellValue 或 buyValue 改变时触发


// 监听 
useEffect(() => {
  if(exchangeRate>0){
    setSellValue(buyValue/exchangeRate)
  }
  //getTokenNum();
}, [buyValue]); // 当 sellValue 或 buyValue 改变时触发


//实时计算兑换比例
const getTokenNum = () => {
  if(exchangeRate==-1){
    if(sellValue&&buyValue){
      // 保留 5 位小数，不四舍五入
      const aToB = Math.floor(parseFloat(buyValue) / parseFloat(sellValue) * 100000) / 100000;
      const bToA = Math.floor(parseFloat(sellValue) / parseFloat(buyValue) * 100000) / 100000;
      setaTOb(aToB);
      setbTOa(bToA);
    }else{
      setaTOb('*')
      setbTOa('*')
    }
  }else{

  }
}


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
                  <input className='flex1 numInput getWidth' placeholder='0' type="text" value={sellValue} onChange={handleSellInput} />
                  <Tooltip color="blue" title="CA:888R77WmcLJKyGeJjk1WktFAB5u5fkvmokHYsAu6Spyd">
                    <div className='tokenSelect'>
                      <img src='./image/eth.png' className='tokenIcon' />
                      <font className='tokenName'>ETH</font>
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
                  <input className='flex1 numInput getWidth' placeholder='0' type="text" value={buyValue} onChange={handleBuyInput} />
                  <Tooltip color="blue" title="CA:888R77WmcLJKyGeJjk1WktFAB5u5fkvmokHYsAu6Spyd">
                    <div className='tokenSelect'>
                      <img src='./image/cat.jpg' className='tokenIcon' />
                      <font className='tokenName'>OPCAT</font>
                      <DownOutlined className='sdown' />
                    </div>
                  </Tooltip>
                </div>
                <div className="price">
                -
                </div>
              </div>
              <font className="liMsg">预估金额可能与实际金额略有不同</font>
              <font className="liMsg">1&nbsp;ETH = {aTOb}&nbsp;OPCAT</font>
              <font className="liMsg">1&nbsp;OPCAT ={bTOa}&nbsp;ETH</font>
              <br/>
              <div className='addli'>
                连接钱包
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PageTwo;