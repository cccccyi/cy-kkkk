import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown ,Modal,message,notification } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { SunOutlined, MoonOutlined ,RightOutlined ,SearchOutlined} from '@ant-design/icons';
import styles from './AppSelf.css';
import Home from './pages/home';
import Token from './pages/token';
import Profile from './pages/profile';
import axios from 'axios'; 
import {_URL} from "./api/url";
import { useDispatch,useSelector } from 'react-redux';
import { setAddress,setisCting,setDeploy_token_addr,setToken_sell_addr,setToken_buy_receiving_addr} from './store/userSlice'; // 用户状态
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-free/css/all.min.css';
const App = () => {
  const navigate = useNavigate();  // 创建一个 navigate 实例
  const dispatch = useDispatch();   //获取修改方法
  const address = useSelector((state) => state.user.address); // 读取 Redux 状态中的地址
  const isCting = useSelector((state) => state.user.isCting); 
  const { Header, Content, Footer } = Layout;
  const [selectedKey, setSelectedKey] = useState('/home'); // 默认选中的菜单项
  const [percent, setPercent] = useState(0); //通知类
  const [scrollOpacity, setScrollOpacity] = useState(0); // 用于控制头部透明度
  const [borderOpacity, setBorderOpacity] = useState(0); // 用于控制头部边框透明度
  const location = useLocation(); // 获取当前路径
  //开始钱包连接处理
  const [unisatAvailable, setUnisatAvailable] = useState(false); // 新增状态用于检查 Unisat 是否安装

  const [unisatAvailableOkx, setUnisatAvailableOkx] = useState(false); // 新增状态用于检查 Unisat 是否安装
  useEffect(() => {
    // 检查是否安装了 Unisat 钱包并初始化
    const checkWalletConnectionUnisat = async () => {
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
    // 检查是否安装了 okx 钱包并初始化
    const checkWalletConnectionOkx = async () => {
      if (window.okxwallet) {
        setUnisatAvailableOkx(true);
        try {
          const lsAds =  await window.okxwallet.bitcoin.getAccounts();
          if (!lsAds || lsAds.length == 0) {
            dispatch(setAddress(''));
            localStorage.setItem('address', '');
          }
        } catch (error) {
          console.error('获取钱包地址失败:', error);
        }
      } else {
        setUnisatAvailableOkx(false);
        console.log('Unisat钱包未安装');
      }
    };
    setTimeout(() => {
      checkWalletConnectionUnisat();
      checkWalletConnectionOkx();
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
    //检测用户在线状态
    if(address){
      //alert(localStorage.getItem('token'));
      getInfo()
    }
    // 清理函数，在组件卸载时移除监听器
    return () => {
      if (window.unisat) {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []); // 依赖为空，意味着仅在组件加载时运行一次
  // 每次路由发生变化时，也就是页面跳转时，都调用一下getInfo
  useEffect(() => {
    if (address) {
      getInfo();
    }
  }, [location.pathname]); // 当路径发生变化时触发
  //检测用户在线状态
  const getInfo = () =>{
    axios.get(_URL.getInfo, {
      headers: {
         Authorization: `Bearer ${localStorage.getItem('token')}`  // 动态传递 Authorization 头
      }
    })
    .then((response) => {
      //token没失效,更新一下系统钱包地址
      console.log(JSON.stringify(response));
      dispatch(setDeploy_token_addr(response.data.data.deploy_token_addr));
      dispatch(setToken_sell_addr(response.data.data.token_sell_addr));
      dispatch(setToken_buy_receiving_addr(response.data.data.token_buy_receiving_addr));
    })
    .catch((error) => {
      //如果token失效，清除用户登录状态
      dispatch(setAddress(''));
      localStorage.setItem('address', '');
    });
  }
  const personClick = (e) => {
    if (e.key === '1') {
      navigate('/profile'); 
    }
    if (e.key === '2') {
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

  
  
    if (e.key === '1') {
      if (!unisatAvailable) {
        message.info('Unisat wallet is not installed');
        return;
      }
      const unisat = window.unisat;
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
          if (verifyResponse.data.code='200') {
            dispatch(setAddress(userAddress[0]));
            localStorage.setItem('address',userAddress[0])
            localStorage.setItem('token',verifyResponse.data.data.token)
            message.success({
              key:'cw',
              content: '连接成功',
              duration: 1,
            });
            dispatch(setisCting(false));
            //获取配置
            getInfo()
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
      if (!unisatAvailableOkx) {
        message.info('Unisat wallet is not installed');
        return;
      }
      const okxwallet = window.okxwallet;
      const unisat = window.okxwallet;
      try {
        // 连接Unisat钱包
        message.open({
          key:'cw',
          type: 'loading',
          content: 'ok钱包连接中...',
          duration: 0,
        })
        dispatch(setisCting(true));
        let userAddress =await okxwallet.bitcoin.requestAccounts()
        
       // alert(userAddress[0]);
   
   
        // let currentNetwork = await unisat.getChain();
        // console.log(JSON.stringify(currentNetwork));
        
          // 检查是否为指定网络
          // if (currentNetwork.enum !== 'FRACTAL_BITCOIN_TESTNET') {
          //   // 尝试切换网络
          //   try {
          //     message.open({
          //       key:'cw',
          //       type: 'loading',
          //       content: '请允许切换网络',
          //       duration: 0,
          //     });
          //     //  let res = await window.unisat.switchChain("BITCOIN_MAINNET");
          //     await unisat.switchChain("FRACTAL_BITCOIN_TESTNET");
             
          //   } catch (err) {
          //     message.error({
          //       key: 'cw',
          //       content: '切换网络失败，请切换到FRACTAL_TESTNET网络后重试。',
          //       duration: 2,
          //     });
          //     dispatch(setisCting(false));
          //     return; // 阻止后续逻辑执行
          //   }
          // }

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
          const signature = await okxwallet.bitcoin.signMessage(msg);
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
          if (verifyResponse.data.code='200') {
            dispatch(setAddress(userAddress[0]));
            localStorage.setItem('address',userAddress[0])
            localStorage.setItem('token',verifyResponse.data.data.token)
            message.success({
              key:'cw',
              content: '连接成功',
              duration: 1,
            });
            dispatch(setisCting(false));
            //获取配置
            getInfo()
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
          <font>My Profile</font>
        </div>
      )
    },
    {
      danger: true,
      key: '2',
      label: (
        <div style={{ display: 'flex', alignItems: 'center',width:'100px',height:'30px',fontSize:'15px'}}>
          <font>Disconnect</font>
        </div>
      )
    },
  ];
  // 判断当前路由是否为首页
  const isHome = location.pathname === '/home';
  const headerStyle = {
    backgroundColor: `rgba(0, 0, 0, ${scrollOpacity*0.5})`,
    borderBottom: `1px solid rgba(44, 48, 54, ${borderOpacity})`,
    zIndex: '1001',
    transition: 'background-color 0.3s ease, border-bottom 0.3s ease',
  };
  //在首页监听滚动
  useEffect(() => {
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const opacity = Math.min(scrollTop / 100, 1); // 最大透明度为 1
        setScrollOpacity(opacity);
        setBorderOpacity(opacity); // 同步调整边框透明度
      
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHome]);
  // 默认加载时如果是根路径则跳转到 home
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/home");
    } 
    if(!isHome){
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navigate]);
  const marginTopSize = {
    marginTop: isHome ? '0' : '0',
    height:'auto'
  };

  const menuItems = [
    // {
    //   label: '主页',
    //   key: '/home',
    // }
  ];
  const handleMenuClick = (e) => {
    navigate(e.key);
    setSelectedKey(e.key); // 点击菜单时设置选中的菜单项
  };
  // 点击头部跳转到首页的事件处理
  const handleLogoClick = () => {
    navigate('/home');
  };
  return (
    <Layout>
      <Header className="header" style={headerStyle}>
        <img src='./image/logo2.png' className='tlogo'/>
        {/* <span  className="demo-logo-text" > <i>Catlaunch</i></span> */}
        <Menu
          mode="horizontal"
          items={menuItems}
          onClick={handleMenuClick}
        />
        {address?(
           <Dropdown
              menu={{
                items:itemPerson,
                onClick: personClick, // 点击事件
              }}
              placement="bottomLeft"
            >
              <div 
                className='selfBtn selfSize'
                style={{   width:'131px', position: 'absolute', top: '12px', right: '20px',zIndex:'999' }}
              > 
                {address.slice(0, 5)}...{address.slice(-5)} 
              </div>
            </Dropdown>
        ):(
          <Dropdown
            menu={{
              items,
              onClick: goConnect, // 点击事件
            }}
            placement="bottomLeft"
          >
            <div 
              className='selfBtn selfSize'
              style={{   width:'131px', position: 'absolute', top: '12px', right: '20px',zIndex:'999' }} type="primary"
            > 
              Connect wallet
            </div>
          </Dropdown>
        )}
      </Header>
      <Content style={marginTopSize}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/token" element={<Token />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Content>
      <Footer className="footer">
        2025 - Cat launchPad
        <font style={{float:'right'}}>
            <i className="fa-brands fa-discord faIcon footerIcon"></i>
            <i className="fa-brands fa-x-twitter faIcon footerIcon"></i>
            <i className="fa-solid fa-paper-plane faIcon footerIcon"></i>
        </font>
      </Footer>
    </Layout>
  );
};
export default App;