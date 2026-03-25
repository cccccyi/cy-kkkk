import React, { useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';  // 导入 useNavigate 钩子
import './home.scss';
import './going.scss';
import homeBg from '../assets/homeBg.svg';
import IconBg from '../assets/bg.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { RightOutlined } from '@ant-design/icons';
const PageTwo = () => {
  const goAno = (val) => {
    window.open('https://catprotocol.org/'); 
  };
  const navigate = useNavigate();  // 创建一个 navigate 实例
  const handleLimitClick = () => {
    navigate('/swap');  // 跳转到 /swap 路由
  };
  return (
    <div className="homePage">
      <img className="homeTopBg" src={homeBg} />
      <div className='going' >
        <div className="container">
          <div className="street-lamps">
            <div className="street-lamp"></div>
            <div className="street-lamp" style={{ marginTop: '30px' }}></div>
          </div>
          <div className="cars-incoming">
            <div className="car"></div>
            <div className="car"></div>
            <div className="car"></div>
            <span className="reflect"></span>
            <span className="reflect"></span>
            <span className="reflect"></span>
          </div>
          <div className="cars-going">
            <div className="car"></div>
            <span className="reflect"></span>
          </div>
          <div className="cars-going-flash">
            <div className="car"></div>
            <span className="reflect"></span>
          </div>
          <div className="city-lights">
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
          </div>
        </div>
      </div>
      <div className='homeContent'>
        <div className="titleBuild">
          <h1 className="fp">CAT-20 SWAP</h1>
          <h1 className="sp">
            Decentralization，Miner Verification
            <br />
            &Based on CAT20
          </h1>
          <font className="homeMessage">
            A Decentralized Exchange Using CAT20 Protocol
            <br />
          </font>
          <div className=' setBox typeBtn'>
            <div className='typeMsgItem flex1 '>
               <center>
                 <div onClick={handleLimitClick} className='typeBtnItem'>swap</div>
               </center>
            </div>
            <div className='typeMsgItem flex1 '>
            <center>
                <div onClick={handleLimitClick} className='typeBtnItem typeBtnItemWhite'>Add Liquidity</div>
                </center>
            </div>
          </div>
          <div className=' setBox typeMsg'>
            <div className='typeMsgItem flex1 '>
                <p className='typeNum'>5899FB</p>
                <p className='typeTitle'>TVL</p>
            </div>
            <div className='typeMsgItem flex1 '>
                <p className='typeNum'>88999FB</p>
                <p className='typeTitle'>24h Volume</p>
            </div>
            <div className='typeMsgItem flex1 '>
                <p className='typeNum'>589</p>
                <p className='typeTitle'>Transactions</p>
            </div>
            <div className='typeMsgItem flex1 '>
                <p className='typeNum'>10</p>
                <p className='typeTitle'>Days</p>
            </div>
          </div>
        </div>
        <div className='contentBuild'>
          <h2 className='titles'>What is CAT-20?</h2>
          <div className='contentItem  setBox'>
            <img src='image/bitcoincat.jpg' className='coinIcon' />
            <div className='catMsg flex1'>
              <b>CAT20 is a Bitcoin-based token protocol that uses smart contracts to manage token minting and transfers, validated directly by miners, and offers more advantages compared to other token protocols.
              </b>
              <div className='borderLine'></div>
              <font style={{fontSize:'18px'}}>
                1.No indexer needed
                <br />
                2. Modular
                <br />
                3.Programmable minting
                <br />
                4.Cross-chain interoperable
                <br />
                5.SPV-compatible
              </font>
          
            </div>
          </div>
          <Button  onClick={goAno} className='goBtn' type="primary" shape="round" icon={<RightOutlined />} size='large'>
            view more
          </Button>
          <h2 className='titles'>Why choose us?</h2>
          <div className='contentItem setBox noLine'>
              <div className='lineItem setBox'>
                  <div className='niceItem flex1'>
               
                    <i className="fa-brands fa-btc" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>BTC native</p>
                    <p className='nMsg'>Executed by Bitcoin Layer 1 script, it outperforms other Bitcoin token protocols.</p>
                  </div>
                  <div className='niceItem flex1'>
                  <i className="fa-solid fa-exchange-alt" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>Simple swap</p>
                    <p className='nMsg'>Users can easily exchange cryptocurrencies with a straightforward and user-friendly process.</p>
                  </div>
                  <div className='niceItem flex1'>
                    <i className="fa-solid fa-shield-alt" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>trustless</p>
                    <p className='nMsg'>Transactions occur in a decentralized environment, ensuring security without intermediaries.</p>
                  </div>
              </div>
              <div className='lineItem setBox'>
                 <div className='niceItem flex1'>
                 <i className="fa-solid fa-gift" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>Additional Rewards</p>
                    <p className='nMsg'>Users earn extra rewards by providing liquidity, boosting engagement.</p>
                  </div>
                  <div className='niceItem flex1'>
                  <i className="fa-solid fa-mobile-alt" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>Accessible</p>
                    <p className='nMsg'>The platform works across multiple devices and wallets, enabling users to trade anywhere, anytime.</p>
                  </div>
                  <div className='niceItem flex1'>
                  <i className="fa-solid fa-lock" style={{ fontSize: '3.5rem', color: '#005df2' }}></i>
                    <p className='nTitle'>Secure</p>
                    <p className='nMsg'>Robust encryption protects users' transaction data from unauthorized access.</p>
                  </div>
              </div>
          </div>
          <Button  onClick={handleLimitClick} className='goBtn' type="primary" shape="round" icon={<RightOutlined />} size='large'>
            go swap
          </Button>
          {/* <Button  onClick={handleLimitClick} className='goBtn' type="primary" shape="round" icon={<RightOutlined />} style={{ marginRight: '20px' }} size='large'>
            add Liquidity
          </Button> */}
          <h2 className='titles'>Additional rewards</h2>
          <div className='contentItem'>
            <p className='giftMsg'>
            Each liquidity pool corresponds to an additional token reward pool, where users can earn extra token rewards in addition to liquidity earnings!
            </p>
            <center>
        
            <div className='borderLine'></div>
            <br/>
            </center>
            <img className='homeGift' src='image/gift.png'/>
          </div>
          <Button  onClick={handleLimitClick} className='goBtn' type="primary" shape="round" icon={<RightOutlined />} size='large'>
            add liquidity
          </Button>
        </div>
      </div>
    </div>
  );
};
export default PageTwo;