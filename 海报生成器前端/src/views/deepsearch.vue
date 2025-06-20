<template>
  <div class="deepsearch">
    <!-- <center style="font-size: 50px;padding-top: 300px;color: rgb(190,190,190);">comming soon</center> -->
    <div class="mainBuild " style="width: 888px;">
      <div class="deepsearchBuild setBox">
        <input type="text" v-model="key" name="" id="" class="flex1 dsInput" placeholder="聚合信息、深度搜索">
        <span class="doSearch">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        </span>
      </div>
      <div class="hotWord">
        <center>
          <span class="tags" v-for="tag in hotKey" @click="setKey(tag)">
            #{{tag}}
          </span>
        </center>
      </div>
      <div class="searchMsg">
        <p class="stitlt">为您找到以下结果：</p>
      </div>
      <div style="height: 15px;"></div>
      <div class="flashItem setBox" v-for="item in flashNews">
        <div class="timeLine  noLine setBox">
          <div class="bDot">
            <div class="sDot"></div>
          </div>
          <div class="flex1 itemLine"></div>
        </div>
        <div class="fmsg flex1 ">
          <p>
            <font class="ftitle">{{item['标题']}}</font>
          </p>
          <p class="fmcon">
            {{item['内容']}}
          </p>
          <div class="btool ">
            <font class="times">来源：{{ item.来源 }}</font>
            <font class="times">{{ item.时间 }}</font>
            <font class=" toFrom">
              <font-awesome-icon :icon="['fas', 'link']" style="font-size: 14px;" />
              查看原文
            </font>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router';
  let hotKey = ref([ "DeFi", "GameFi", "NFT", "SEC", "Bybit", "比特币"])
  const route = useRoute(); // 获取当前路由对象
  const key = ref(route.query.key || '');
  
  const setKey =(val: any)=>{
    key.value = val
  }
  const flashNews = ref([
    {
      "时间": "2025-02-27",
      "标题": "Safe钱包不Safe？速览Bybit取证调查报告",
      "内容": "2025年2月21日，Bybit检测到其ETH冷钱包的未授权活动，攻击者通过操纵Safe{Wallet}的交易签名过程，将资产转移到其控制的钱包中。调查发现，恶意JavaScript代码被注入到Safe{Wallet}的AWS S3存储桶中，攻击源头可能来自Safe{Wallet}的AWS基础设施[^31^]。",
      "来源": "X"
    },
    {
      "时间": "2025-02-22",
      "标题": "Bybit Confirms Record-Breaking $1.5 Billion Crypto Heist in Sophisticated Cold Wallet Attack",
      "内容": "Bybit在2025年2月21日确认其以太坊冷钱包发生大规模盗窃事件，被盗资产超过15亿美元。攻击者通过操纵智能合约逻辑和签名界面，成功控制了冷钱包并转移了资产。TRM Labs将此次攻击归因于朝鲜的Lazarus Group[^35^]。",
      "来源": "The Hacker News"
    },
    {
      "时间": "2025-02-21",
      "标题": "Bybit被盗15亿美金引发的“蝴蝶效应”：OTC群体将迎来冻结潮",
      "内容": "Bybit在2025年2月21日发生史上最大规模的加密货币盗窃案，被盗金额达15亿美元。此次事件可能引发针对OTC群体和Crypto支付公司的大规模冻结潮[^34^]。",
      "来源": "X"
    },
    {
      "时间": "2025-02-25",
      "标题": "Bybit Releases Forensic Report Linking $1.5B Hack to Safe Wallet Compromise",
      "内容": "Bybit发布的取证报告指出，2025年2月21日的攻击是通过在Safe{Wallet}的AWS S3存储桶中注入恶意JavaScript代码实现的。该代码在签名过程中篡改了交易内容，导致冷钱包资产被盗[^33^]。",
      "来源": "Crypto News"
    },
    {
      "时间": "2025-02-21",
      "标题": "Bybit遭黑客入侵盗走15亿美元虚拟资产，加密市场难“加密”",
      "内容": "Bybit在2025年2月21日遭受黑客攻击，损失约15亿美元的ETH资产。攻击者利用复杂的钓鱼技术和社交工程手段获取内部凭证，并通过操纵多重签名认证过程完成资产转移。",
      "来源": "Forbes"
    }
  ])
  // const sp = ref('123')
  // const cd =ref(true)
  // const toChange =()=>{
  //   sp.value = 456
  // }
</script>
<style lang="scss" scoped>
  .deepsearch {
    min-height: calc(100vh - 135px);
    .deepsearchBuild {
      width: 888px;
      border: solid 2px #002fa7;
      margin: 0 auto;
      height: 50px;
      border-radius: 10px;

      .dsInput {
        border: 0;
        outline: none;
        border-radius: 10px;
        padding-left: 20px;
        font-size: 20px;
      }

      .doSearch {
        width: 100px;
        background: #002fa7;
        display: inline-block;
        border-radius: 0 7px 7px 0;
        color: white;
        font-size: 20px;
        line-height: 45px;
        text-align: center;
        cursor: pointer;
      }
    }

    .hotWord {
      width: 888px;
      margin: 0 auto;
      padding-left: 2px;
      margin-top: 15px;

      .tags {
        color: #999;
        margin-right: 20px;
        cursor: pointer;
        color: #4065f6;
        font-size: 14px;
      }
    }

    .stitlt {
      margin-top: 10px;
      color: #9195a3;
    }

    .flashItem {
      .btool {
        margin-top: 10px;
        margin-bottom: 40px;

        .toFrom {
          color: #002fa7 ;
          margin-left: 20px;
          cursor: pointer;
        }

        .tags {
          color: #999;
          margin-right: 20px;
          cursor: pointer;
          color: #4065f6;
          font-size: 14px;
        }
      }

      min-height:150px;

      .timeLine {
        width: 15px;

        .bDot {
          width: 25px;
          height: 25px;
          background: #dde0ff;
          border-radius: 50%;
          position: relative;
          margin-top: 5px;

          .sDot {
            width: 11px;
            height: 11px;
            background: #3881e1;
            position: absolute;
            top: 7px;
            left: 7px;
            border-radius: 50%;
          }
        }

        .itemLine {
          border-left: 1px dashed #d9d9d9;
          width: 0px;
          margin-left: 12px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
      }

      .fmsg {
        .times {
          color: #868686 !important;
          margin-left: 20px;
        }

        .ftitle {
          display: inline-block;
          padding-left: 20px;
          font-size: 18px;
          font-weight: bold;
          position: relative;
          top: 2px
        }

        .fmcon {
          display: block;
          text-overflow: ellipsis;
          color: rgb(100, 100, 100);
          line-height: 25px;
          margin-top: 10px;
          margin-left: 20px;
          margin-right: 10px;
        }
      }
    }
    @media (max-width: 1100px) {
      .tags {
        margin-right: 10px !important;
      }
      .mainBuild{
        width: 100% !important;

      }
      .mainBuild{
        padding-top: 20px;
      }
      .deepsearchBuild{
        width: 100% !important;
    
      }
      .doSearch{
        width: 70px !important;
      }
      .hotWord{
        width: 100% !important;
      }
      .toFrom{
        display: block;
        width: 100%;
        margin-top: 10px;
      }
      /* .title{
        display: none;
      }
      #hot{
        display: none;
      }
      .flashBox{
        display: none;
      }
      .newsImg{
        width: 130px !important;
        height: 100px !important;
        margin-left: 10px !important;
        border-radius: 5px !important;
        background-size: cover;
        margin-top: 5px;
        float: left;
      }
      .newsTitle{
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        display: -webkit-box !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      } */
    
    }
    /* 适配电脑样式 */
    @media (min-width: 1100px) {
      .flashTagsMobile{
        display: none;
      }
    }
  }
</style>