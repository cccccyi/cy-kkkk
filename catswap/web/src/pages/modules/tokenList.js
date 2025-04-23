import React, { useState ,useEffect} from 'react';
import { Modal, message,Skeleton,List ,Spin,Avatar} from 'antd';
import { HEIGHT } from '@cat-protocol/cat-sdk';
import { SunOutlined, MoonOutlined ,RightOutlined ,SearchOutlined} from '@ant-design/icons';
import axios from 'axios';
import {_URL} from "../../api/url";
import './tokenList.scss';
import VirtualList from 'rc-virtual-list';
const ContainerHeight = 465;
const TokenListModal = ({ isModalOpen, setShowTokenList,handleOk ,onTokenSelect}) => {
  const [loading, setLoading] = useState(true);  // 用于控制加载状态
  const [tokenList, setTokenList] = useState([]); // 存储请求的数据
  const [loadingLock, setLoadingLock] = useState(false); // 存储请求的数据
  const [pageNum, setPageNum] = useState(1);  // 起始页
  const [pageSize, setPageSize] = useState(20);  //每页的数量
  const [keyWord, setKeyWord] = useState('');     //搜索条件name
   // 当模态框打开时发送请求
  useEffect(() => {
    if (isModalOpen) {
      appendData();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (pageNum>1) {  // 确保不是第一次加载时调用
      appendData();
    }
  }, [pageNum]);

  useEffect(() => {
    
      // setTokenList([])
      // setLoading(true)
      // setPageNum(1)
      appendData();
  
  }, [keyWord]);

// 生成一个随机颜色
const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const randomBackgroundColor = () => {
  const letters = '0123456789ABCDEF';
  let backgroundColor = '#';
  for (let i = 0; i < 6; i++) {
    backgroundColor += letters[Math.floor(Math.random() * 16)];
  }
  return backgroundColor;
};

  const appendData = (type) => {
      setLoadingLock(true); //加载锁
      axios.get(_URL.tokenList+'?pageNum='+pageNum+'&pageSize=30&tokenId='+keyWord).then(response => {
        setTimeout(()=>{
         // setTokenList(response.data.data.list); //假设返回的数据是一个列表
          setTokenList(tokenList.concat(response.data.data.list));
        // setTokenList();
          setLoading(false);  //请求成功后更新加载状态
          setLoadingLock(false); //解锁
        },500)
      }).catch(error => {
        message.error('加载失败，请稍后再试');
        setLoading(false);  //请求失败后更新加载状态
        setLoadingLock(false); //解锁
      });
  };
  // 内部定义取消方法
  const handleCancel = () => {
    setTokenList([]); 
      setLoading(true); 
      setPageNum(1);
      setKeyWord('');
    setShowTokenList(false);
  };
  const onScroll = (e) => {
    console.log(Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - ContainerHeight))
    if (Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - ContainerHeight) <= 1&&!loadingLock) {
      setPageNum(pageNum+1);
    }
  };
  // const onScroll = (e) => {
  //   console.log(Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - ContainerHeight))
  //   if (Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - ContainerHeight) <= 1 && !loadingLock) {
  //     setPageNum(prevPageNum => {
  //       const newPageNum = prevPageNum + 1;
  //       appendData(newPageNum); // 使用更新后的 newPageNum
  //       return newPageNum;
  //     });
  //   }
  // };
  const choseToken = (symbol, name ,id,addr) => {
    // console.log('Symbol:', symbol);  // 打印 symbol
    // console.log('Name:', name);      // 打印 name
    onTokenSelect(symbol, name ,id,addr);     // 调用父组件的回调函数，传递 symbol 和 name
    handleCancel() //关闭窗口
  };
  const goSearch = (e) =>{
    setKeyWord(e.target.value); // 更新状态
   // console.log(e.target.value)
   setTokenList([])
   setLoading(true)
   setPageNum(1)
  // alert(1);

  }
  return (
    <Modal
      className='tokenList'
      centered="true"
      zIndex="1818"
      width='450px'
      footer=''
      title="Select token"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel} // 使用内部的 handleCancel 方法
    >
    <div className='tokenSearchList setBox '>
        <SearchOutlined  className='searchIcon'/>
        <input placeholder='输入代币名称 / 合约地址搜索' className='searchInput flex1'   value={keyWord}  onChange={goSearch}/>
    </div>
    <div style={{height:'465px',marginTop:'15px',width:'98%',marginLeft:'1%',marginBottom:'20px'}}>
        {loading ? (
          // 显示加载的骨架屏
          <div style={{ width: '98%', marginLeft: '1%', marginTop: '0px',position:'relative',top:'20px' }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                avatar
                paragraph={{
                  rows: 1,
                }}
                active
              />
            ))}
          </div>
        ) : (
          // 请求到的数据列表渲染
                <List>
                    <VirtualList
                        data={tokenList}
                        height={ContainerHeight}
                        itemKey="tokenId"
                        onScroll={onScroll}
                    >
                        {(item) => (
                            <List.Item key={item.tokenId}>
                                <List.Item.Meta
                                    onClick={() => choseToken(item.symbol, item.name, item.tokenId,item.tokenAddr)} 
                                    style={{cursor:'pointer'}}
                                    avatar={<Avatar size={38}  style={{
                                      backgroundColor: '#556dea',
                                      color: 'white',
                                      position:'relative',
                                      top:'6px'
                                    }}>
                                      <font style={{fontSize:'23px'}}>
                                      {item.name.charAt(0)}
                                      </font>
                                    </Avatar>}
                                    title={
                                      <div>
                                          <font style={{fontSize:'17px'}}>{item.symbol}</font>
                                          <font style={{fontSize:'13px',float:'right',fontWeight:'normal',color:'',position:'relative',top:'2px',right:'5px'}}> {item.tokenId?(item.tokenId.slice(0,5) + '...' + item.tokenId.slice(-5)):'-/-'}</font>
                                      </div>
                                    }
                                    description={<font style={{fontSize:'14px',color:'#7d7d7d'}} >{item.name}</font>}
                                />
                            </List.Item>
                        )}
                    </VirtualList>
                     {loadingLock && (
                        <div style={{ textAlign: 'center' }}>
                          <Spin />
                        </div>
                     )}
                </List>
        )}
    </div>
    </Modal>
  );
};

export default TokenListModal;
