import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown ,Modal,message,notification } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { SunOutlined, MoonOutlined ,RightOutlined ,SearchOutlined} from '@ant-design/icons';
import styles from './AppSelf.css';
import Home from './pages/home';
import Swap from './pages/swap';
import Limit from './pages/limit';
import Pool from './pages/pool';
import Createpool from './pages/createpool';
import axios from 'axios'; 
import {_URL} from "./api/url";
import { useDispatch,useSelector } from 'react-redux';
import { setAddress,setisCting } from './store/userSlice'; // 用户状态
const App = () => {
  const dispatch = useDispatch();   //获取修改方法
  const address = useSelector((state) => state.user.address); // 读取 Redux 状态中的地址
  const isCting = useSelector((state) => state.user.isCting); 
  const { Header, Content, Footer } = Layout;
  const [theme, setTheme] = useState('light'); // 默认主题为 light
  const [selectedKey, setSelectedKey] = useState('/page1'); // 默认选中的菜单项
  const [scrollOpacity, setScrollOpacity] = useState(0); // 用于控制头部透明度
  const [borderOpacity, setBorderOpacity] = useState(0); // 用于控制头部边框透明度
  const [percent, setPercent] = useState(0); //通知类
  //开始钱包连接处理
  const [unisatAvailable, setUnisatAvailable] = useState(false); // 新增状态用于检查 Unisat 是否安装
  // useEffect(() => {
  //   // 检查是否安装了 Unisat 钱包
  //   setTimeout(() => {
  //     if (window.unisat) {
  //       setUnisatAvailable(true);
  //     } else {
  //       setUnisatAvailable(false);
  //     }
  //   }, 1000); // 延迟1秒,等待uniswap程序加载
  // }, []);
  // useEffect(() => {
  //   // 检查是否安装了 Unisat 钱包
  //   setTimeout(async () => {
  //     if (window.unisat) {
  //       setUnisatAvailable(true);
  //       try {
  //         // 尝试获取用户的地址,判断钱包是否在线
  //         const lsAds = await window.unisat.getAccounts();
  //         if (!lsAds || lsAds.length == 0) {
  //           // 若不在线，则清除本地缓存和状态
  //           dispatch(setAddress(''));
  //           localStorage.setItem('address', '');
  //         }
  //       } catch (error) {
  //         console.error('获取钱包地址失败:', error);
  //       }
  //     } else {
  //       setUnisatAvailable(false);
  //       console.log('Unisat钱包未安装');
  //     }
  //   }, 1000); // 延迟1秒，等待uniswap程序加载
  // }, []); // 空依赖数组，确保仅在组件挂载时执行一次
  useEffect(() => {
    // 检查是否安装了 Unisat 钱包并初始化
    const checkWalletConnection = async () => {
      if (window.unisat) {
        setUnisatAvailable(true);
        try {
          const lsAds = await window.unisat.getAccounts();
          if (!lsAds || lsAds.length == 0) {
            dispatch(setAddress(''));
            localStorage.setItem('address', '');
          }
        } catch (error) {
          console.error('获取钱包地址失败:', error);
        }
      } else {
        setUnisatAvailable(false);
        console.log('Unisat钱包未安装');
      }
    };
    setTimeout(() => {
          checkWalletConnection();
    }, 1000);
    // 注册accountsChanged监听器
    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        dispatch(setAddress(accounts[0]));
        localStorage.setItem('address', accounts[0]);
        console.log('钱包地址已更新:', accounts[0]);
      } else {
        dispatch(setAddress(''));
        localStorage.removeItem('address');
        console.log('钱包地址已断开');
      }
    };
    if (window.unisat) {
      window.unisat.on('accountsChanged', handleAccountsChanged);
    }
    // 清理函数，在组件卸载时移除监听器
    return () => {
      if (window.unisat) {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []); // 依赖为空，意味着仅在组件加载时运行一次

  // 监听账户变化（钱包地址变化）
  const handleAccountsChanged = (accounts) => {
    // alert(1)
    if (accounts && accounts.length > 0) {
      // 如果账户有变化，更新 Redux 状态和 localStorage
      dispatch(setAddress(accounts[0]));
      localStorage.setItem('address', accounts[0]);
   //   console.log('钱包地址已更新:', accounts[0]);
    } else {
      // 如果账户变空，清除状态
      dispatch(setAddress(''));
      localStorage.removeItem('address');
     // console.log('钱包地址已断开');
    }
  };

  const personClick = (e) => {
    if (e.key === '1') {

    }
    if (e.key === '2') {
      
    }
    if (e.key === '3') {
          // 清除 Redux 状态中的地址
          dispatch(setAddress(''));
          // 清除本地存储
          localStorage.removeItem('address');
          // 提示用户
          message.success('已断开');
    }
  }
  const goConnect = async (e) => {
    console.log('_URL in goConnect:', _URL.nonce);

    const unisat = window.unisat;
    if (!unisatAvailable) {
      message.info('Unisat wallet is not installed');
      return;
    }
    if (e.key === '1') {
      try {
        // 连接Unisat钱包
        message.open({
          key:'cw',
          type: 'loading',
          content: '钱包连接中...',
          duration: 0,
        })
        dispatch(setisCting(true));
        let userAddress = await unisat.requestAccounts();    
     
      //  alert(userAddress[0]);
        let currentNetwork = await unisat.getChain();
        console.log(JSON.stringify(currentNetwork));
        
          // 检查是否为指定网络
          if (currentNetwork.enum !== 'FRACTAL_BITCOIN_TESTNET') {
            // 尝试切换网络
            try {
              message.open({
                key:'cw',
                type: 'loading',
                content: '请允许切换网络',
                duration: 0,
              });
              //  let res = await window.unisat.switchChain("BITCOIN_MAINNET");
              await unisat.switchChain("FRACTAL_BITCOIN_TESTNET");
             
            } catch (err) {
              message.error({
                key: 'cw',
                content: '切换网络失败，请切换到FRACTAL_TESTNET网络后重试。',
                duration: 2,
              });
              dispatch(setisCting(false));
              return; // 阻止后续逻辑执行
            }
          }

        const response = await axios.get(_URL.nonce+'/'+userAddress[0]);  //从服务端获取nonce
        if (response.data && response.data.nonce) {
          message.open({
            key:'cw',
            type: 'loading',
            content: '请确认签名请求',
            duration: 0,
          });
          // 进行签名认证（根据你的具体需求进行签名）
          const msg = `Welcome to CatSwap!\n\nClick to sign in.\n\nThis request will not trigger a blockchain transaction.\n\nNonce:\n${response.data.nonce}`;
          const signature = await unisat.signMessage(msg);
          message.open({
            key:'cw',
            type: 'loading',
            content: '签名成功，正在验证...',
            duration: 0,
          });
          // 向服务端验证签名
          const verifyResponse = await axios.post(_URL.verify, {
            address: userAddress[0],
            signature,
          });
         // console.log(JSON.stringify(verifyResponse.data));
          if (verifyResponse.data.code='200') {
            dispatch(setAddress(userAddress[0]));
            localStorage.setItem('address',userAddress[0])
            message.success({
              key:'cw',
              content: '连接成功',
              duration: 1,
            });
            dispatch(setisCting(false));
          }else{
            dispatch(setAddress(''));
            localStorage.setItem('address','')
            message.success({
              key:'cw',
              content: '连接失败：验证未通过',
              duration: 1,
            });
            dispatch(setisCting(false));
          }
        } else {
          message.error({
            key:'cw',
            content: '连接失败:Failed to fetch nonce from server',
            duration: 1,
          });
          dispatch(setisCting(false));
          // message.error('Failed to fetch nonce from server.');
        }
        // alert(currentNetwork);
        // 获取nonce并进行签名认证
       
      } catch (e) {
       // message.error('Connection failed: ' + e.message);
        message.error({
          key:'cw',
          content: '连接失败:'+e.message,
          duration: 1,
        });
        dispatch(setisCting(false));
      }
    }
    if (e.key === '2') {
      // 连接OKX钱包的处理代码
        message.open({
          key:'cw',
          type: 'loading',
          content: '正在唤醒钱包...',
          duration: 0,
        })
        setTimeout(() => {
          message.open({
            key:'cw',
            type: 'loading',
            content: '连接中...',
            duration: 0,
          });
        }, 2000);
        setTimeout(() => {
          message.open({
            key:'cw',
            type: 'loading',
            content: '请确认签名请求',
            duration: 0,
          });
        }, 5000);
        setTimeout(() => {
          message.success({
            key:'cw',
            content: '连接成功',
            duration: 2,
          });
        }, 7000);
      //  message.success('Loading finished', 2.5)
    }
  };
  //钱包连接下拉菜单
  const items = [
    {
      key: '1',
      label: (
        <div className='walletItem' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="./image/color.svg"
            alt="icon"
            style={{ width: '30px', height: '30px',borderRadius:'5px' }}
          />
          <font className="walletName">unisat</font>
          <font className="walletNameIcon">Connect</font>
          <RightOutlined className="walletNamePic"/>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className='walletItem' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
           src="./image/okx_wallet_icon.svg"
            alt="icon"
            style={{ width: '30px', height: '30px',borderRadius:'5px'  }}
          />
          <font className="walletName">okx</font>
          <font className="walletNameIcon">Connect</font>
          <RightOutlined className="walletNamePic"/>
        </div>
      ),
    }
  ];

  const itemPerson = [
    {
      key: '1',
      label: (
        <div style={{ display: 'flex', alignItems: 'center',width:'100px',height:'30px',fontSize:'15px'}}>
          <font>交易明细</font>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <div style={{ display: 'flex', alignItems: 'center',width:'100px',height:'30px',fontSize:'15px'}}>
          <font>我的流动性</font>
        </div>
      )
    },
    {
      danger: true,
      key: '3',
      label: (
        <div style={{ display: 'flex', alignItems: 'center',width:'100px',height:'30px',fontSize:'15px'}}>
          <font>断开连接</font>
        </div>
      )
    },
  ];
  //钱包连接下拉菜单结束
  const navigate = useNavigate();
  const location = useLocation(); // 获取当前路径

  // 根据主题设置背景色
  const backgroundColor = theme === 'light' ? '#ffffff' : '#001529';
  // 判断当前路由是否为首页
  const isHome = location.pathname === '/home';

  // 根据是否为首页和滚动状态设置头部样式
  const headerStyle = {
    backgroundColor: isHome
      ? `rgba(${theme === 'light' ? '255,255,255' : '0,21,41'}, ${scrollOpacity})`
      : backgroundColor,
    borderBottom: `1px solid rgba(34, 34, 34, ${borderOpacity * 0.07})`,
    zIndex: '1001',
    transition: 'background-color 0.3s ease, border-bottom 0.3s ease',
  };
  const marginTopSize = {
    marginTop: isHome ? '0' : '64px',
  };

  // 默认加载时如果是根路径则跳转到 page1
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/home');
      setSelectedKey('/home'); // 设置默认选中的菜单项
    } else {
      setSelectedKey(location.pathname); // 根据当前路径设置选中的菜单项
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (isHome) {
        const scrollTop = window.scrollY;
        const opacity = Math.min(scrollTop / 800, 1); // 最大透明度为 1
        setScrollOpacity(opacity);
        setBorderOpacity(opacity); // 同步调整边框透明度
      } else {
        setScrollOpacity(1); // 非首页时直接设置为不透明
        setBorderOpacity(1); // 非首页时边框直接设置为不透明
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHome]);

  const menuItems = [
    // {
    //   label: '主页',
    //   key: '/home',
    // },
    {
      label: '交易',
      key: 'menu1',
      children: [
        { label: '兑换', key: '/swap' },
        { label: '限额交易', key: '/limit' },
      ],
    },
    {
      label: '资金池',
   
       key: '/pool'
      // children: [
      //   { label: '资金池', key: '/pool' },
      //   // { label: '添加流动性', key: '/createpool' },
      //   { label: '我的', key: '/page5' },
      // ],
    },
  ];

  const handleMenuClick = (e) => {
    navigate(e.key);
    setSelectedKey(e.key); // 点击菜单时设置选中的菜单项
  };

  // 切换主题的函数
  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  // 下拉菜单内容
  const themeMenu = (
    <Menu onClick={(e) => toggleTheme(e.key)}>
      <Menu.Item key="light" icon={<SunOutlined />}>
        亮色主题
      </Menu.Item>
      <Menu.Item key="dark" icon={<MoonOutlined />}>
        暗色主题
      </Menu.Item>
    </Menu>
  );

  // 点击头部跳转到首页的事件处理
  const handleLogoClick = () => {
    navigate('/home');
  };

  return (
    <Layout>
      <Header className="header" style={headerStyle}>
        <img
          className="demo-logo"
          src="image/logo4.png"
          alt="logo"
          onClick={handleLogoClick} // 添加点击事件
          style={{ cursor: 'pointer' }} // 设置鼠标悬停样式
        />
         {/* {status && <p>{status}</p>} */} 
        <div className='tokenSearch setBox '>
            <SearchOutlined  className='searchIcon'/>
            <input placeholder='输入代币名称 / 合约地址搜索' className='searchInput flex1'/>
        </div>
        <Menu
          theme={theme}
          mode="horizontal"
          items={menuItems}
          onClick={handleMenuClick}
          selectedKeys={[selectedKey]} // 设置选中的菜单项
        />
        <Dropdown overlay={themeMenu} trigger={['hover']}>
          <Button
            style={{
              position: 'absolute',
              top: '16px',
              right: '165px',
              backgroundColor: theme === 'light' ? '#ffffff' : '#001529',
              color: theme === 'light' ? '#001529' : '#ffffff',
            }}
          >
            {theme === 'light' ? <SunOutlined /> : <MoonOutlined />}
          </Button>
        </Dropdown>
        {address?(
           <Dropdown
              menu={{
                items:itemPerson,
                onClick: personClick, // 点击事件
              }}
              placement="bottomLeft"
            >
              <Button style={{   width:'131px', position: 'absolute', top: '16px', right: '20px',zIndex:'999' }} type="primary">
              {address.slice(0, 5)}...{address.slice(-5)}
              </Button>
            </Dropdown>
        ):(
          <Dropdown
            menu={{
              items,
              onClick: goConnect, // 点击事件
            }}
            placement="bottomLeft"
          >
            <Button disabled={isCting}  style={{   width:'131px', position: 'absolute', top: '16px', right: '20px',zIndex:'999' }} type="primary">
              Connect wallet
            </Button>
          </Dropdown>
        )}
       
     
     
      </Header>
      <Content style={marginTopSize}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/limit" element={<Limit />} />
          <Route path="/pool" element={<Pool />} />
          <Route path="/createpool" element={<Createpool />} />
        </Routes>
      </Content>
      <Footer className="footer">2024 - CAT20 SWAP</Footer>
    </Layout>
  );
};

export default App;
