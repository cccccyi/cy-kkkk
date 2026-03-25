import React, { useState,useEffect } from 'react';
import { Button, Table, Progress,message ,Skeleton} from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './box.scss';
import './profile.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { RightOutlined, CopyOutlined } from '@ant-design/icons';
import axios from 'axios';
import { _URL } from "../api/url";
import { useDispatch, useSelector } from 'react-redux';
const Profile = () => {
  const address = useSelector((state) => state.user.address); // 读取 Redux 状态中的地址
  const [loading, setLoading] = useState(false); // 加载中
  const [creatLoading, setcreatLoading] = useState(false); // 加载中
  const [activeBtn, setActiveBtn] = useState(0); // 用来跟踪当前激活的按钮
  const [holdList, setholdList] = useState([]); // 我持有的代币列表
  const [creatList, setcreatList] = useState([]); // 我创建的代币列表
  const selectActive = (val) => {
    setActiveBtn(val); // 设置当前激活的按钮索引
  };
  const navigate = useNavigate();
  // 控制分页按钮是否出现
  const showPage = () => {
    return false; // 禁用分页
  };
  useEffect(() => {
    getHoldList(true)
    getCreatListList(true)
  }, []);  // 空依赖数组意味着这个请求只会在组件第一次加载时发起

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
  const getFixed = (val) => {
    return Number(val).toFixed(8)
  }
  const getHoldList = (showloading) => {
    if (showloading) {
      setLoading(true);
    }
    axios.get(_URL.findHolderList, {
      params: {
        pageSize: 9999, // 页大小
        pageNum: 1,   // 页码
        wallet:address
      }
    })
      .then(response => {
        setLoading(false);
        setholdList(response.data.data.list);  // 保存数据到状态
      })
      .catch(error => {
        setLoading(false);
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data!');
      });
  };

  //获取我创建的代币
  const getCreatListList = (showloading) => {
    if (showloading) {
      setcreatLoading(true);
    }
    axios.get(_URL.list, {
      params: {
        pageSize: 9999, // 页大小
        pageNum: 1,   // 页码
        wallet:address
      }
    })
      .then(response => {
        setcreatLoading(false);
        setcreatList(response.data.data.list);  // 保存数据到状态
      })
      .catch(error => {
        setcreatLoading(false);
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data!');
      });
  };
  //我持有的代币
  const columnsHolds = [
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
      align:'center',
      width: 10, // 让第一列变短
      render: (text, record, index) => (
        <div style={{textAlign:'center'}}>
         #{index + 1} 
        </div>
      )
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width:300,
      render: (text, record) => (
        <div className="tokenInfo">
          <div src={fixUrl(record.tokenImage)} alt={record.name} 
            style={{ 
              width: 30, 
              height: 30, 
              marginRight: 8,
              float:'left',
              borderRadius:'50%' ,
              marginTop:'2px',
              backgroundImage: `url('${fixUrl(record.tokenImage)}')`,  // 使用修正后的路径
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} >
          </div>
          <span style={{lineHeight:'35px',marginLeft:'10px'}}>{record.currentTokenAmount} <b>{record.tokenTicker}</b></span>
        </div>
      ),
    },
    {
      title: 'Buy',
      dataIndex: 'value_in_fb',
      key: 'value_in_fb',
      render: (text,record) => `${getFixed(record.currentAmount)} FB`, // 显示 value_in_fb
    },
    {
      title: 'Now',
      dataIndex: 'value_in_fb',
      key: 'value_in_fb',
      render: (text,record) => `${getFixed(record.currentTokenAmount*record.price/100000000)} FB`, // 显示 value_in_fb
    },
    {
      title: 'Market Cap',
      dataIndex: 'value_in_fb',
      key: 'value_in_fb',
      render: (text,record) => `${getFixed(record.marketValue)} FB`, // 显示 value_in_fb
    },
    {
      title: 'Action',
      key: 'action',
      align:'center',
      render: (text, record) => (
        <div>
          <span className='actionItem usn' onClick={() => viewTokenDetails(record)}>view coin</span>
          {/* <span className='actionItem usn' onClick={() => success()}>refresh</span> */}
        </div>
      ),
    },
  ];


  //我发行的代币
  const columnsHolds2 = [
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
      align:'center',
      width: 200, // 让第一列变短
      render: (text, record, index) => (
        <div style={{textAlign:'center'}}>
         #{index + 1} 
        </div>
      )
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      render: (text, record) => (
        <div className="tokenInfo">
           <div src={fixUrl(record.tokenImage)} alt={record.name} 
            style={{ 
              width: 30, 
              height: 30, 
              marginRight: 8,
              float:'left',
              borderRadius:'50%' ,
              marginTop:'2px',
              backgroundImage: `url('${fixUrl(record.tokenImage)}')`,  // 使用修正后的路径
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} >
          </div>
          <span style={{lineHeight:'35px',marginLeft:'10px'}}>{record.currentTokenAmount} <b>{record.tokenTicker}</b></span>
        </div>
      ),
    },
    {
      title: 'Market cap',
      key: 'mcap',
      dataIndex: 'mcap',
      render: (text, token) => (
        <font className="tcolor">
          {token.marketValue.toFixed(2)}FB
        </font>
      ),
    },
    {
      title: 'holders',
      key: 'holders',
      dataIndex: 'holders',
      render: (text, token) => (
        <font className="tcolor">
          {token.holderNum ? token.holderNum : 0}
        </font>
      ),
    },
    {
      title: 'progress',
      key: 'progress',
      dataIndex: 'progress',
      render: (text, token) => (
        <font>
          <Progress percent={(token.progress * 100).toFixed(2)} className='tokenProgressTott' />
        </font>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align:'center',
      render: (text, record) => (
        <div>
           <span className='actionItem usn' onClick={() => viewTokenDetails(record)}>view coin</span>
        </div>
      ),
    },
  ];
  const viewTokenDetails = (record) => {
    navigate('/token?id='+record.tokenId);  // 跳转到 /token 路由
  };

  const success = (record) => {
    message.open({
      type: 'success',
      content: 'refresh success',
    });
  };

  return (
    <div className="myProfile">
      <div className='mainBuild'>
        <div className='goBack' onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div className='toolsBar' style={{ width: '100%' }}>
          <span className={`chpseBtn usn ${activeBtn === 0 ? 'chpseBtnActive' : ''}`} onClick={() => selectActive(0)}>Coins Held</span>
          <span className={`chpseBtn usn ${activeBtn === 1 ? 'chpseBtnActive' : ''}`} onClick={() => selectActive(1)}>Coins Created</span>
        </div>
        <div>
          {loading?(
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="pickItemTable" style={{ border: 'none' }}>
                <Skeleton.Node
                  active="true"
                  className='topNode'
                  style={{
                    display: 'block',
                    backgroundColor: 'rgba(119, 151, 216, 0.1)'
                  }}
                />
              </div>
            ))
          ):(
            <div>
                 {activeBtn === 0 ? (
                    <Table className='innerTable getBg' style={{ marginRight: '0' }} pagination={showPage()} columns={columnsHolds} dataSource={holdList} rowKey="symbol" />
                  ) : (
                    <Table className='innerTable getBg' style={{ marginRight: '0' }} pagination={showPage()} columns={columnsHolds2} dataSource={creatList} rowKey="symbol" />
                  )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
