import React, { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { Button, Progress, Select, message, Pagination, Tooltip, Skeleton, Table } from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './home.scss';
import './box.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { RightOutlined, CopyOutlined, BarsOutlined, AppstoreOutlined,SearchOutlined,ThunderboltOutlined} from '@ant-design/icons';
import TokenListModal from './modules/tokenList';
import { useDispatch, useSelector } from 'react-redux';
import { setisTable } from '../store/userSlice'; // 列表状态
import axios from 'axios';
import { _URL } from "../api/url";
import copy from 'copy-to-clipboard';
const Home = () => {
  const dispatch = useDispatch();   //reduc依赖
  const address = useSelector((state) => state.user.address); // 读取 Redux 状态中的地址
  const isTable = useSelector((state) => state.user.isTable); // 读取 Redux 状态中的地址
  //alert(isTable);
  const [activeBtn, setActiveBtn] = useState(0); // 用来跟踪当前激活的按钮
  const [showTokenList, setShowTokenList] = useState(false);
  const [tokenList, setTokenList] = useState([]); // 用来保存从接口获取的代币列表
  const [pageSize, setPageSize] = useState(20); // 页大小
  const [pageNum, setPageNum] = useState(1); // 页码
  const [total, setTotal] = useState(0); // 总条数
  const [keyword, setKeyword] = useState(''); // 搜索关键词
  const [loading, setLoading] = useState(false); // 加载中
  const [buyFB, setbuyFB] = useState(20);
  const [sorter, setSorter] = useState({
    field: 'created_at', // 当前排序字段
    order: 'descending', // 当前排序顺序（'ascend' 或 'descend'）
  });
  // useEffect 用来在组件加载时请求数据
  useEffect(() => {
    getList(true)
  }, []);  // 空依赖数组意味着这个请求只会在组件第一次加载时发起
  //监听页码变化，重新请求数据，  //监听关键词变化，重新请求数据
  useEffect(() => {
    getList(true);
  }, [pageNum,keyword]);  // 当 pageNum 变化时重新请求数据

  useEffect(() => {
    getList(false);
  }, [sorter.field,sorter.order]);  // 当 pageNum 变化时重新请求数据

  //搜索框的方法。
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);  // 防抖触发搜索
  };
  // 创建防抖的搜索函数
  const debouncedSearch = debounce((searchKeyword) => {
    setPageNum(1);
    setKeyword(searchKeyword);  // 设置搜索关键字
  }, 500); // 防抖延时 500 毫秒
  // 请求函数，带上分页和搜索参数
  const getList = (showloading) => {
    if (showloading) {
      setLoading(true);
    }
    axios.get(_URL.list, {
      params: {
        pageSize: pageSize, // 页大小
        pageNum: pageNum,   // 页码
        keyword: keyword,    // 搜索关键词
        orderByColumn: sorter.field?sorter.field:'created_at',
        isAsc: sorter.order?sorter.order:'descending',
      }
    })
      .then(response => {
        setLoading(false);
        setTokenList(response.data.data.list);  // 保存数据到状态
        setTotal(response.data.data.total);
      })
      .catch(error => {
        setLoading(false);
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data!');
      });
  };
  const navigate = useNavigate();  // 创建一个 navigate 实例
  const tokenChose = (tokenId, id) => {
    navigate('/token?id=' + tokenId);  // 跳转到 /token 路由
  };
  const selectActive = (val) => {
    setActiveBtn(val); // 设置当前激活的按钮索引
  }
  //打开窗口1
  const opSList = (val) => {
    if (address) {
      setShowTokenList(true);
    } else {
      message.info('Please connect your wallet.');
    }
  };
  //发射成功
  const handleTokenSelection = () => {
    if (pageNum == 1) {
      getList(false)
    } else {
      setPageNum(1)
    }
  };
  //修复图片url
  const fixUrl = (url) => {
    // 如果 url 中包含 "http:/", 则将其修正为 "http://"
    if (url.startsWith("http:/")) {
      return "http://" + url.slice(5); // 去掉多余的字符，并添加正确的前缀
    }
    return url;
  };
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
  //复制id
  const copyToClipboard = (text) => {
    const isCopied = copy(text);
    if (isCopied) {
      message.success('Copied to clipboard!');
    } else {
      message.error('Copy failed!');
    }
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
 // 处理购买输入框的输入事件
 const handleSellInput = (event) => {
  let value = event.target.value;
  // 验证输入是否为大于零的数字或小数（允许以数字开头，最多一个小数点）
  if (/^\d*\.?\d*$/.test(value)) {
    if (value === '' || parseFloat(value) >= 0) {
      setbuyFB(value); // 允许合法输入或空值（方便用户删除内容）   
    }
  }
};
  //模拟表格数据
  const columns = [
    {
      title: 'TOKEN',
      width: 250,
      key:'id',
      render: (text, token) => (
        <div className="tokenInfo" key={token.id}>
          <div
            className='tokenImg'
            style={{
              backgroundImage: `url('${fixUrl(token.tokenImage)}')`,  // 使用修正后的路径
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
          </div>
          <div className='tmsg'>
            <font className="ttk">{token.tokenTicker}</font>
            <font className="tnm">{token.tokenName}</font>
          </div>
        </div>
      ),
    },
    {
      title: 'CREATED',
      align: 'center',
      dataIndex: 'created_at',
      sorter: true, // 启用排序
      showSorterTooltip: false, // 取消提示
      defaultSortOrder: 'descend', // 默认降序
      sortDirections: ['ascend', 'descend','ascend'],
      render: (text, token) => (
        <font className='tcolor'>
          {timeAgo(token.createdAt)}
        </font>
      ),
    },
    {
      title: 'ID',
      align: 'center',
      width: 170,
      render: (text, token) => (
        <font
          className="tcolor"
          onClick={(e) => {
            e.stopPropagation(); // 防止触发父级点击事件
            copyToClipboard(token.tokenId);
          }}
        >
          <Tooltip title={token.tokenId} color="purple">
            <font className='tot'>{token.tokenId.toUpperCase().slice(0, 5)}...{token.tokenId.toUpperCase().slice(-5)}</font>
            <CopyOutlined className='totCopy' />
          </Tooltip>
        </font>
      ),
    },
    {
      title: 'MKT CAP',
      dataIndex: 'market_value',
      align: 'center',
      sorter: true, // 启用排序
      showSorterTooltip: false, // 取消提示
      sortDirections: ['ascend', 'descend','ascend'],
      minWidth: 100,
      render: (text, token) => (
        <div className="marketCap">
            <font className="t1">{token.marketValue.toFixed(2)}FB</font>
            <font className="t2">{token.price.toFixed(2)}sats</font>
        </div>
      ),
    },
    {
      title: 'VOLUME',
      align: 'center',
      dataIndex:'volume',
      sorter: true, // 启用排序
      showSorterTooltip: false, // 取消提示
      sortDirections: ['ascend', 'descend','ascend'],
      minWidth: 100,
      render: (text, token) => (
        <font className="tcolor">
          {token.volume.toFixed(2)}FB
        </font>
      ),
    },
    {
      title: 'PROGRESS',
      align: 'center',
      dataIndex:'progress',
      sorter: true, // 启用排序
      showSorterTooltip: false, // 取消提示
      sortDirections: ['ascend', 'descend','ascend'],
      minWidth: 150,
      render: (text, token) => (
        <font>
          <Progress percent={(token.progress * 100).toFixed(2)} className='tokenProgressTott' />
        </font>
      ),
    },
    {
      title: 'HOLDER',
      align: 'center',
      dataIndex:'holder_num',
      sorter: true, // 启用排序
      showSorterTooltip: false, // 取消提示
      sortDirections: ['ascend', 'descend','ascend'],
      render: (text, token) => (
        <font className="tcolor">
          {token.holderNum ? token.holderNum : 0}
        </font>
      ),
    },
    {
      title: 'MEDIA',
      align: 'center',
      width: 130,
      render: (text, token) => {
        const hasLinks = token.twitter || token.telegram || token.website;
        return (
          <span className="tcolor mediaItem setBox">
            {!hasLinks ? (
              <div className="flex1">
                  -/-
              </div>
            ) : (
              <>
                {token.twitter && (
                  <div className="flex1">
                    <Tooltip title={token.twitter} color="purple">
                      <i
                        className="fa-brands fa-x-twitter faIcon"
                        onClick={(e) => {
                          e.stopPropagation();
                          goLink(token.twitter);
                        }}
                      ></i>
                    </Tooltip>
                  </div>
                )}
                {token.telegram && (
                  <div className="flex1">
                    <Tooltip title={token.telegram} color="purple">
                      <i
                        className="fa-solid fa-paper-plane faIcon"
                        onClick={(e) => {
                          e.stopPropagation();
                          goLink(token.telegram);
                        }}
                      ></i>
                    </Tooltip>
                  </div>
                )}
                {token.website && (
                  <div className="flex1">
                    <Tooltip title={token.website} color="purple">
                      <i
                        className="fa-solid fa-globe faIcon"
                        onClick={(e) => {
                          e.stopPropagation();
                          goLink(token.website);
                        }}
                      ></i>
                    </Tooltip>
                  </div>
                )}
              </>
            )}
          </span>
        );
      }

    },
    {
      title: 'QUICK BUY',
      align: 'center',
      render: (text, token) => (
        <center>
          <div className='selfBtn buyBtn' onClick={() => tokenChose(token.tokenId, token.id)}>
            <img src="./image/fb.png" className='fbIcon'/>
            <font className="reposition">
                <i className="fa-solid fa-bolt icon"></i>
                {buyFB?buyFB:0} 
                <font>&nbsp;FB</font>
            </font>
          </div>
        </center>
      ),
    },
  ];
  return (
    <div className="homePage">
      <div className='mainBuild'>
        <center>
          <span className='launchToken usn' onClick={() => opSList()}>
            <font className='launchIcon'>
              🚀
            </font>
            <i>
              Launch your token
            </i>
          </span>
        </center>
        <div className='choseView '>
          <div className='toolsBar '>
            <span className={`chpseBtn usn ${activeBtn === 0 ? 'chpseBtnActive' : ''}`} onClick={() => selectActive(0)}>New</span>
            <span className={`chpseBtn usn ${activeBtn === 1 ? 'chpseBtnActive' : ''}`} onClick={() => selectActive(1)}>Rising</span>
            <span className={`chpseBtn usn ${activeBtn === 2 ? 'chpseBtnActive' : ''}`} onClick={() => selectActive(2)}>Success</span>
           
            <div className='checkBtn setBox'>
              <div className={`flex1 btnItem ${isTable ? 'btnItemActive' : ''}`} onClick={() => dispatch(setisTable(true))}>
                <BarsOutlined />
              </div>
              <div className={`flex1 btnItem ${!isTable ? 'btnItemActive' : ''}`} onClick={() => dispatch(setisTable(false))}>
                <AppstoreOutlined />
              </div>
            </div>
            <div className='checkBtn  quickBuy'>
              <input className='quickInput' placeholder=''  value={buyFB}  onChange={handleSellInput}/>
              <div className='qbbi '>
                <font className="qbt">Quick Buy</font>
                <i className="fa-solid fa-bolt light"></i>
                {/* <ThunderboltOutlined className='light'/> */}
              </div>
            </div>
            <div className='checkBtn setBox search'>
              <input 
                className='searchInput flex1' 
                placeholder='search nmae ticker or ID'
                onChange={handleSearchChange}  // 监听输入框的变化  
              />
              <SearchOutlined  className='searchIcon'/>
            </div>
          </div>
          {isTable ? (
            <div>
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
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
              ) : (
                <Table
                  className='innerTable getBg' 
                  pagination={false} 
                  columns={columns} 
                  dataSource={tokenList}
                  rowKey={record => record.id} 
                 
                  onChange={(pagination, filters, sorter) => {
                    console.log(sorter.field);
                    console.log(sorter.order);
                    setPageNum(1)
                    // 更新排序状态
                    setSorter({
                      field: sorter.field,
                      order: sorter.order=='descend'?'descending':'ascending',
                    });
                    // // 重新请求数据
                    // getList(true);
                  }}
                  onRow={(record) => ({
                    onClick: () => {
                      // console.log("点击的行数据：", record);
                      // // 执行跳转或者其他操作
                      // goDetail(record);
                      tokenChose(record.tokenId, record.id)
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 0.1)";
                      e.currentTarget.style.cursor = "pointer";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }
                  })}
                />
              )}
            </div>
          ) : (
            <div className='picks' >
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <div key={index} className="pickItem" style={{ border: 'none' }}>
                    <Skeleton.Node
                      active="true"
                      className='topNode'
                      style={{
                        display: 'block',
                        backgroundColor: 'rgba(135, 172, 245, 0.1)'
                      }}
                    />
                    {Array.from({ length: 3 }).map((_, subIndex) => (
                      <Skeleton.Node
                        key={subIndex}
                        active
                        className="itemNode"
                        style={{
                          display: "block",
                          backgroundColor: 'rgba(135, 172, 245, 0.1)'
                        }}
                      />
                    ))}
                  </div>
                ))
              ) : (
                tokenList.map((token, index) => (
                  <div key={index} className="pickItem" onClick={() => tokenChose(token.tokenId, token.id)}>
                    <div
                      className="itemImge"
                      style={{
                        backgroundImage: `url('${fixUrl(token.tokenImage)}')`,  // 使用修正后的路径
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                    </div>
                    <span className="titles ">
                      <font className="tokenTicker "  > {token.tokenTicker} </font>

                      <font className="lTime  ">{timeAgo(token.createdAt)}</font>  {/* 你可以修改成动态时间 */}
                    </span>
                    <span className="secTitle">
                      <font className="tokenName ">  {token.tokenName} </font>
                      <font
                        className='tokenId'
                        onClick={(e) => {
                          e.stopPropagation(); // 防止触发父级点击事件
                          copyToClipboard(token.tokenId);
                        }}
                      >
                        <Tooltip title={token.tokenId} color="purple">
                          <font className='tokenText'>{token.tokenId.toUpperCase().slice(0, 3)}..{token.tokenId.toUpperCase().slice(-4)}</font>
                          <CopyOutlined />
                        </Tooltip>
                      </font>
                    </span>
                    <Progress percent={(token.progress * 100).toFixed(2)} className='tokenProgress' />  {/* 你可以调整这个进度条 */}
                    <span className="titlesIcon">
                      {token.twitter && (
                        <Tooltip title={token.twitter} color="purple">
                          <i
                            className="fa-brands fa-x-twitter faIcon"
                            onClick={(e) => {
                              e.stopPropagation(); // 防止触发父级点击事件
                              goLink(token.twitter);
                            }}
                          >
                          </i>
                        </Tooltip>
                      )}
                      {token.telegram && (
                        <Tooltip title={token.telegram} color="purple">
                          <i
                            className="fa-solid fa-paper-plane faIcon"
                            onClick={(e) => {
                              e.stopPropagation(); // 防止触发父级点击事件
                              goLink(token.telegram);
                            }}
                          ></i>
                        </Tooltip>
                      )}
                      {token.website && (
                        <Tooltip title={token.website} color="purple">
                          <i
                            className="fa-solid fa-globe faIcon"
                            onClick={(e) => {
                              e.stopPropagation(); // 防止触发父级点击事件
                              goLink(token.website);
                            }}
                          ></i>
                        </Tooltip>
                      )}
                      <i className="fa-regular fa-user faIcon"></i>
                      <font className='holders'>{token.holderNum ? token.holderNum : 0}</font>  {/* 这里你可以替换为动态值 */}
                      <font className="cmapIconText">{token.marketValue.toFixed(2)}FB</font>  {/* 这里你可以替换为动态值 */}
                      <i className="fa fa-dollar-sign cmapIcon"></i>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          <center>
            <Pagination
              className='homePagination'
              simple={{
                readOnly: true,
              }}
              current={pageNum}
              pageSize={pageSize}
              total={total}
              onChange={(page) => {
                setPageNum(page);
              }}
            />
          </center>
        </div>
      </div>
      <TokenListModal
        isModalOpen={showTokenList}
        setShowTokenList={setShowTokenList}
        handleOk=''
        onSuccess={handleTokenSelection} // 传递回调函数
      />
    </div>
  );
};
export default Home;