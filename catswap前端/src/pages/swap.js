import React, { useState, useRef, useEffect } from 'react';
import { Button, Collapse, Tooltip, InputNumber, Radio ,Table} from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './swap.scss';
import './box.scss';
import { SettingTwoTone, HeartTwoTone,CopyOutlined,ArrowDownOutlined, DownOutlined,LoginOutlined } from '@ant-design/icons';

const PageTwo = () => {
  // 创建两个独立的状态
  const [sellValue, setSellValue] = useState('');
  const [buyValue, setBuyValue] = useState('');

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
  const navigate = useNavigate();  // 创建一个 navigate 实例
  const handleLimitClick = () => {
    navigate('/limit');  // 跳转到 /limit 路由
  };
  //gas费选择框的逻辑
  const [selectedValue, setSelectedValue] = useState('Fastest'); // 默认选中第二个按钮
  const inputRef = useRef(null); // 引用输入框

  const gasChange = (e) => {
    setSelectedValue(e.target.value);
  };

  useEffect(() => {
    if (selectedValue === 'Custom' && inputRef.current) {
      inputRef.current.focus(); // 聚焦输入框
    }
  }, [selectedValue]); // 当选中值发生变化时触发
  const handleInputFocus = () => {
    setSelectedValue('Custom'); // 手动选中第三个按钮
  };
  //结束

  const columns = [
    {
      title: 'Time',
      dataIndex: 'Time',
      key: 'Time',
    },
    {
      title: 'Address',
      dataIndex: 'Address',
      key: 'Address',
    },
    {
      title: 'pay',
      dataIndex: 'pay',
      key: 'pay',
    },
    {
      title: 'Receive',
      dataIndex: 'Receive',
      key: 'Receive',
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
    },
  ];
  const data = [
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
    {
      Time: '09:41:22 2025/01/07',
      Address: 'bc1q...wrn0',
      pay: 'FB -0.0008',
      Receive: 'OPCAT  +125',
      Status: 'Success',
    },
  ];

  //gas费信息栏
  const items = [
    {
      key: '1',
      label: 'gas:$8.88',
      children:
        <div className='gasMsg'>
          <div className='feeItem'>
            <font className='feeTitle'>交易费(0.4%)</font>
            <font className='feeNum'>&lt;$0.1</font>
          </div>
          <div className='feeItem'>
            <font className='feeTitle'>滑点上限</font>
            {/* <font className='feeNum'>自动&nbsp;5.5%</font> */}
            <InputNumber className='feeNum feeInput' min={1} precision={0} addonAfter="%" defaultValue={9} />
          </div>
          <div className='feeItem setFee' style={{ position: 'relative' }}>
            <font className='feeTitle'>网络费用(stas/vB)</font>
            <Radio.Group
              className='gasNum'
              value={selectedValue}
              onChange={gasChange}
            >
              <Radio.Button value="General">General:3</Radio.Button>
              <Radio.Button value="Fastest">Fastest:5</Radio.Button>
              <Radio.Button value="Custom" style={{ outline: 'none' }}>
                Custom:
                <input
                  className="satsInput"
                  ref={inputRef}
                  onFocus={handleInputFocus} // 当输入框聚焦时，选中第三个按钮
                  onClick={(e) => e.stopPropagation()} // 防止事件冒泡到父级
                />
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
    }
  ];
  return (
    <div className="swap">
      <div className="page1-container">
        <div className="backgroundPer">
          CAT-20
          <br />
          SWAP
        </div>
        <div className="mBuild setBox " style={{ position: 'relative' }}>
          <div className='orderBuild flex1'>
            <span className='poolTitle'>
              <img src='./image/cat.jpg' className='titleIcon' />
              <span className='titleFont'>
              OPCAT
              </span>
              <span className='titleAddress'>
              45ee725c...d964ecd12d6b_0
              &nbsp;&nbsp;
              <CopyOutlined style={{'cursor':'pointer'}}/>
              </span>
            </span>
            <div className='orderListSwap'>
              <span className='titlePrice'>
                <span className='titlePrice1'>0.158FB</span>
                <font className='titlePrice2'>($0.44)</font>
                <font className='titlePrice3'>2025-01-07 AM 10:13</font>
              </span>
              <iframe className='tradingCharts' src='./charting_library/index.html' />
            </div>
            <span className='poolTitle' style={{marginBottom:'0',marginTop:'30px'}}>
             交易
            </span>
            <div className='orderListSwap' style={{marginTop:'0px'}}>
              <div className='orderList'>
                <Table pagination={{position: ['bottomCenter']}} columns={columns} dataSource={data} />
              </div>
            </div>

          </div>
          <div className="page1-box">
            <Button type="primary" size={'middle'} shape={'round'} style={{ marginLeft: '5px' }}>
              兑换
            </Button>
            <Button type="link" size={'middle'} shape={'round'} style={{ marginLeft: '10px' }} onClick={handleLimitClick} >
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
                  <Tooltip color="blue" title="CA:888R77WmcLJKyGeJjk1WktFAB5u5fkvmokHYsAu6Spyd">
                    <div className='tokenSelect'>
                      <img src='./image/fb.png' className='tokenIcon' />
                      <font className='tokenName'>FB</font>
                      <DownOutlined className='sdown' />
                    </div>
                  </Tooltip>
                </div>
                <div className="price">
                  ~$888.66
                </div>
              </div>
              <div className="flex1 tokenR setBox noLine">
                <div className="title">
                  购买
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
                  ~$888.88
                </div>
              </div>
            </div>
            <font className="swapMsg">
              1&nbsp;ETH = 0.1&nbsp;OPCAT
            </font>
            <Collapse defaultActiveKey={['1']} items={items} ghost className='gasBox' />
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