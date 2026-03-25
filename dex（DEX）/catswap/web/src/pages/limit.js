import React, { useState } from 'react';
import { Button, Radio, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './swap.scss';
import './limit.scss';
import './pool.scss';
import './box.scss';
import { SettingTwoTone, HeartTwoTone, ArrowDownOutlined, DownOutlined } from '@ant-design/icons';
const PageTwo = () => {
    // 创建两个独立的状态
    const [priceValue, setPriceValue] = useState('');
    const [sellValue, setSellValue] = useState('1');
    const [buyValue, setBuyValue] = useState('100');
    const [position, setPosition] = useState('')
    const columns = [
        {
            title: '时间',
            dataIndex: 'time',
            key: 'time',
        },
        {
          title: '出售',
          dataIndex: 'from',
          key: 'from',
          render: (text, record) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={record.fromIcon} alt="icon" style={{ width: 25, height: 25, marginRight: 5 ,borderRadius:50}} />
              <span><b>{text}</b>&nbsp;{record.from1}</span>
            </div>
          ),
        },
        {
          title: '购买',
          dataIndex: 'to',
          key: 'to',
          render: (text, record) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={record.toIcon} alt="icon" style={{ width: 25, height: 25, marginRight: 5 ,borderRadius:50}} />
              <span><b>{text}</b>&nbsp;{record.to1}</span>
            </div>
          ),
        },
        {
          title: '挂单价',
          dataIndex: 'price',
          key: 'price',
        },
        {
            title: '有效期',
            dataIndex: 'days',
            key: 'days',
        },
        {
          title: '操作',
          key: 'action',
          render: (_, record) => (
            <Space size="middle">
              <a>取消订单</a>
            </Space>
          ),
        },
      ];
      const data = [
            {
            key: '1',
            time: '2024-12-25 03:21',
            from: '100',
            from1: 'OPCAT',
            to: '20000',
            to1: 'USDT',
            price: '1 OPCAT = 200 USDT',
            days:'1天',
            fromIcon:'image/cat.jpg',
            toIcon:'image/usdt.png'
          },
          {
            key: '2',
            time: '2024-12-25 02:18',
            from: '20',
            from1: 'ETH',
            to: '80000',
            to1: 'USDT',
            price: '1 ETH = 4000 USDT',
            days:'1天',
            fromIcon:'image/eth.png',
            toIcon:'image/usdt.png'
          },
          {
            key: '3',
            time: '2024-12-25 01:16',
            from: '1',
            from1: 'AVAX',
            to: '0.5',
            to1: 'USDT',
            price: '1 AVAX = 0.5 USDT',
            days:'1天',
            fromIcon:'image/avax.png',
            toIcon:'image/usdt.png'
          },
          {
            key: '1',
            time: '2024-12-25 03:21',
            from: '100',
            from1: 'OPCAT',
            to: '20000',
            to1: 'USDT',
            price: '1 OPCAT = 200 USDT',
            days:'1天',
            fromIcon:'image/cat.jpg',
            toIcon:'image/usdt.png'
          },
     
      ];
    //处理价格输入框的输入事件
    // const handlePriceInput = (event) => {
    //     let value = event.target.value;
    //     // 验证输入是否为大于零的数字或小数
    //     if (/^\d*\.?\d*$/.test(value)) {
    //         if (parseFloat(value) > 0 || value === '') {
    //             setPriceValue(value); // 允许合法输入，或空值（方便用户删除内容）
    //         }
    //     }
    // };
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

    // 控制分页按钮是否出现
    const showPage = () => {
        if (data.length > 4) {
            return { position: ['bottomCenter'] }; // 当数据超过 4 条时，启用分页并设置位置
        } else {
            return false; // 禁用分页
        }
    };
    const navigate = useNavigate();  // 创建一个 navigate 实例
    const handleSwapClick = () => {
        navigate('/swap');  // 跳转到 /limit 路由
      };
    return (
        <div className="swap limit">
            <div className="page1-container">
                <div className="backgroundPer">
                    CAT-20
                    <br />
                    SWAP
                </div>
                <div className="mBuild setBox ">
                   
                    <div className='orderBuild flex1'>
                        <Button type="primary" size={'middle'} shape={'round'} style={{ marginLeft: '5px' }}>
                            进行中
                        </Button>
                        <Button type="link" size={'middle'} shape={'round'} style={{ marginLeft: '10px' }}>
                            已取消
                        </Button>
                        <Button type="link" size={'middle'} shape={'round'} style={{ marginLeft: '10px' }}>
                            已完成
                        </Button>
                        <Button type="link" size={'middle'} shape={'round'} style={{ marginLeft: '10px' }}>
                            已过期
                        </Button>
                        <div className='orderList'>
                            <Table pagination={showPage()} columns={columns} dataSource={data} />
                        </div>
                    </div>


                    <div className="page1-box">
                        <Button type="link" size={'middle'} shape={'round'} style={{ marginLeft: '5px' }}    onClick={handleSwapClick} >
                            兑换
                        </Button>
                        <Button type="primary" size={'middle'} shape={'round'} style={{ marginLeft: '10px' }}>
                            限额交易
                        </Button>
                        {/* <SettingTwoTone style={{ fontSize: '20px', float: 'right', marginTop: '8px', marginRight: '5px' }} /> */}
                        <div className="panl-box setBox noLine">
                            <div className="changeBtn">
                                <ArrowDownOutlined />
                            </div>

                            <div className="flex1 tokenS setBox noLine">
                                <div className="title">
                                    出售
                                </div>
                                <div className="input flex1 setBox">
                                    {/* 使用 sellValue 和 handleSellInput */}
                                    <input className='flex1 numInput getWidth' placeholder='0' type="text" value={sellValue} onChange={handleSellInput} />
                                    <div className='tokenSelect'>
                                        <img src='./image/cat.jpg' className='tokenIcon' />
                                        <font className='tokenName'>OPCAT</font>
                                        <DownOutlined className='sdown' />
                                    </div>
                                </div>
                                <div className="price">
                                    ~$888.66
                                </div>
                            </div>
                            <div className="flex1 tokenS setBox noLine">
                                <div className="title">
                                    市价
                                </div>
                                <div className="input flex1 setBox">
                                    {/* 使用 buyValue 和 handleBuyInput */}
                                    <input className='flex1 numInput getWidth' placeholder='0' type="text" value={buyValue} onChange={handleBuyInput} />
                                    <div className='tokenSelect'>
                                        <img src='./image/usdt.png' className='tokenIcon' />
                                        <font className='tokenName'>USDT</font>
                                        <DownOutlined className='sdown' />
                                    </div>
                                </div>
                                <div className="price">
                                    ~$888.88
                                </div>
                            </div>
                            <div className="flex1 tokenR setBox noLine">
                                <div className="title">
                                    挂单价、有效期
                                </div>
                                <div className="input flex1 setBox">
                                    {/* 使用 buyValue 和 handleBuyInput */}
                                    <input className='flex1 numInput getWidth' placeholder='0' type="text" value={buyValue} onChange={handleBuyInput} />
                                    <div className='tokenSelect'>
                                        <img src='./image/usdt.png' className='tokenIcon' />
                                        <font className='tokenName'>USDT</font>
                                        <DownOutlined className='sdown' />
                                    </div>
                                </div>
                                <div className="timeChoke">
                                    <Radio.Group defaultBorderColor={'blue'} size={'middle'} value={position} onChange={(e) => setPosition(e.target.value)} className="timeChokeBtn">
                                        <Radio.Button value="day">一天</Radio.Button>
                                        <Radio.Button value="week">一周</Radio.Button>
                                        <Radio.Button value="month">一月</Radio.Button>
                                        <Radio.Button value="year">一年</Radio.Button>
                                    </Radio.Group>
                                </div>
                            </div>
                        </div>
                        <div className='subBtn'>
                            连接钱包
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PageTwo;