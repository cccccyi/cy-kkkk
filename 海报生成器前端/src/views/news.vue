<template>
  <div class="news">
    <div class="mainBuild  setBox">
      <div class="mainSection ">
        <!-- <div class="tMsgBox"></div> -->
        <div>
        
        </div>
        <div class="newsItem setBox " v-for="item,index in newsList">
          <div class="flex1  nmsg">
            <p class="newsTitle">
              {{item['标题']}}
            </p>
            <p class="newsMsg">
              {{item['内容']}}
            </p>
            <div class="btool ">
              <span class="tags" v-for="tag in item['关键词']" @click="toSearch(tag)">
                #{{tag}}
              </span>
              <span class="sendTime ">
                <font-awesome-icon :icon="['far', 'clock']" /> {{item['时间'].slice(0, 16)}}
              </span>
            </div>
          </div>
          <div class="newsImg" :style="{ backgroundImage: 'url(demoImg/'+(index+1)+'.webp)' }">
          </div>
         
          <div class="btoolM">
            <span class="sendTime ">
              <font-awesome-icon :icon="['far', 'clock']" /> {{item['时间'].slice(0, 16)}}
            </span>
            <span class="writer">
              <font-awesome-icon :icon="['far', 'user']" /> hsahnews
            </span>
          </div>
          <div class="btoolM"  style="margin-bottom: 10px;">
            <span class="tags" v-for="tag in item['关键词']" @click="toSearch(tag)">
              #{{tag}}
            </span>
          </div>
        </div>
      </div>
      <div class="subSection  flex1">
        <p class="title">
          快讯
          <font class="moreFlash" @click="toflash()">
            more
            <font-awesome-icon class="micon" :icon="['fas', 'arrow-right']" />
          </font>
        </p>
        <div class="flashBox">
          <div class="flashItem setBox" v-for="item in flashNews">
            <div class="timeLine  noLine setBox">
              <div class="bDot">
                <div class="sDot"></div>
              </div>
              <div class="flex1 itemLine"></div>
            </div>
            <div class="fmsg flex1 ">
              <p>
                <font class="times">{{ item.时间.split(" ")[1] }}</font>
                <font class="ftitle">{{item['标题']}}</font>
              </p>
              <p class="fmcon">
                {{item['内容']}}
              </p>
            </div>
          </div>
        </div>
        <p class="title" style="margin-top: 20px;">热词</p>
        <div class="hot" id="hot">
          
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import ApexCharts from 'apexcharts'
  import { useRouter } from 'vue-router'  // 导入useRouter
  const router = useRouter()  // 获取路由实例
  // 跳转到新闻快讯页面
  const toflash = () => {
    router.push('/');  // 使用router.push进行路由跳转
  }
  // 搜索
  const toSearch = (val: any) => {
    router.push('/deepsearch?key='+val);  // 使用router.push进行路由跳转
  }
  onMounted(() => {
    var options = {
      series: [
        {
          data: [
            {
              "x": "RWA",
              "y": 218
            },
            {
              "x": "LSD",
              "y": 149
            },
            {
              "x": "以太坊",
              "y": 184
            },
            {
              "x": "比特币",
              "y": 55
            },
            {
              "x": "DeFi",
              "y": 84
            },
            {
              "x": "NFT",
              "y": 31
            },
            {
              "x": "AI代理",
              "y": 70
            },
            {
              "x": "抗量子",
              "y": 30
            },
            {
              "x": "Meme币",
              "y": 44
            },
            {
              "x": "Token化",
              "y": 68
            },
            {
              "x": "Layer2",
              "y": 28
            },
            {
              "x": "智能合约",
              "y": 19
            },
            {
              "x": "零知识证明",
              "y": 29
            }
          ]
        }
      ],
      legend: {
        show: false
      },
      chart: {
        height: 388,
        type: 'treemap',
        toolbar: {
          show: false  // 禁用右上角的菜单按钮
        },
        events: {
          dataPointSelection: function(event: any, chartContext: any, config: any) {
            // 获取点击的数据点的x值
            const xValue = config.seriesIndex !== undefined ? config.w.config.series[config.seriesIndex].data[config.dataPointIndex].x : '';
            // 弹出x的值
            toSearch(xValue)
          }
        }
      }
    };

    var chart = new ApexCharts(document.querySelector("#hot"), options);
    chart.render();

  });
  const newsList = ref([
    {
      "标题": "区块链重点动态2025年2月25日早参考",
      "内容": "Bernstein：流动性将从无用meme回流至DeFi、GameFi与NFT，看好稳定币与RWA。FOX记者：Michael Saylor于上周五会见SEC加密特别行动小组，富达代表上周会见SEC加密小组，提及流动性挖矿等链上激励的监管认定。MITRE代表会见SEC加密小组，提及揭示DeFi协议背后的隐性中心化。Bybit遭黑客攻击成史上最大金融盗窃案。美SEC或将重新考虑针对ConsenSys MetaMask质押服务的诉讼。美SEC计划裁减地区高管，准备接受DOGE的审查。南达科他州否决比特币储备法案。贝莱德高管对Solana ETF计划保持沉默。特朗普：新任期内美国获逾1.63万亿美元巨额投资。",
      "主图链接": "https://www.jinse.cn/news/blockchain/3709337.html",
      "时间": "2025-02-25 08:00:00",
      "关键词": ["DeFi", "GameFi", "NFT", "SEC"]
    },
    {
      "标题": "2月24日市场关键情报，你错过了多少？",
      "内容": "精选要闻：Bybit CEO称已回归1:1刚性兑付，即将上线被盗资金流向网站。Four代币符号更新为FORM，旨在让Four代币名称回归BNB。解读稳定币赛道现状，赌博+AI的GambleFAI模式。慢雾分析Bybit近15亿美元被盗背后的黑客手法与疑问。",
      "主图链接": "https://www.nervedaily.com/",
      "时间": "2025-02-24 12:30:00",
      "关键词": ["Bybit", "稳定币", "GambleFAI", "黑客攻击"]
    },
    {
      "标题": "本周回顾 | Bybit被盗事件难以通过回滚解决；FTX赔付暂时排除中国用户惹争议",
      "内容": "Bybit被盗事件难以通过回滚解决，FTX赔付暂时排除中国用户引发争议。朝鲜如何培养出黑客高手的分析。",
      "主图链接": "https://www.nervedaily.com/",
      "时间": "2025-02-22 18:00:00",
      "关键词": ["Bybit", "FTX", "黑客攻击", "朝鲜"]
    },
    {
      "标题": "机构投资者比特币持仓情况详解：超8000份13F文件透露了哪些信号",
      "内容": "分析机构投资者比特币持仓情况，超8000份13F文件揭示市场动态。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-21 09:00:00",
      "关键词": ["比特币", "机构投资者", "13F文件"]
    },
    {
      "标题": "加密赌场：为什么大多数Meme玩家？",
      "内容": "探讨加密赌场中Meme玩家的困境",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-21 14:00:00",
      "关键词": ["加密赌场", "Meme玩家"]
    },
    {
      "标题": "Glassnode：看懂加密市场未来资本走向及牛熊阈值",
      "内容": "Glassnode分析加密市场的未来资本走向及牛熊阈值。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-20 10:00:00",
      "关键词": ["Glassnode", "加密市场", "资本走向"]
    },
    {
      "标题": "Grayscale：五大案例看懂DePIN如何连通加密与现实",
      "内容": "Grayscale通过五大案例分析DePIN如何连接加密与现实。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-20 11:00:00",
      "关键词": ["Grayscale", "DePIN", "加密与现实"]
    },
    {
      "标题": "加密ETF新热潮：2025年最新申请进展与展望",
      "内容": "分析2025年加密ETF的申请进展与未来展望。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-19 15:00:00",
      "关键词": ["加密ETF", "申请进展", "展望"]
    },
    {
      "标题": "LIBRA闹剧：DEX、内幕团队与投资者的信任危机及破局之路",
      "内容": "探讨LIBRA事件中的DEX、内幕团队与投资者信任危机及其破局之路。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-18 16:00:00",
      "关键词": ["LIBRA", "DEX", "信任危机"]
    },
    {
      "标题": "链上数据释放见顶信号了吗？",
      "内容": "分析链上数据是否释放出市场见顶的信号。",
      "主图链接": "https://www.jinse.cn/lives",
      "时间": "2025-02-17 17:00:00",
      "关键词": ["链上数据", "市场见顶"]
    }
  ])
  const flashNews = ref([
    {
      "时间": "2025-02-26 22:03",
      "标题": "Ondo Finance加入万事达卡多代币网络",
      "内容": "代币化RWA发行商Ondo Finance宣布加入万事达卡的多代币网络，其短期美国政府国债基金（OUSG）投资产品将向万事达卡多代币网络上的机构用户开放。[^11^]"
    },
    {
      "时间": "2025-02-26 15:34",
      "标题": "Raise获得6300万美元构建区块链支持的礼品卡项目",
      "内容": "Raise获得6300万美元融资，旨在加速将礼品卡和忠诚度计划整合到区块链上，增强其区块链驱动的礼品卡计划。[^10^]"
    },
    {
      "时间": "2025-02-26 12:34",
      "标题": "亚马逊推出AI技术驱动的Alexa Plus",
      "内容": "亚马逊推出Alexa Plus，这是其虚拟助手的生成式人工智能版本，具备增强的对话能力和个性化响应功能。[^10^]"
    },
    {
      "时间": "2025-02-26 09:00",
      "标题": "Multicoin完成800万美元GEOD代币收购",
      "内容": "Multicoin牵头从Geodnet基金会完成对其GEOD代币800万美元的战略收购，GEOD是Geodnet网络的原生代币。[^9^]"
    }
  ])
  // const sp = ref('123')
  // const cd =ref(true)
  // const toChange =()=>{
  //   //alert(1)
  //   sp.value = 456
  // }
</script>
<style lang="scss" scoped>
  .news {
    min-height: calc(100vh - 135px);
    .newsItem {
      border-bottom: 1px solid #efeeee;
      height: 180px;
      position: relative;
      padding-top: 20px;

      .newsTitle {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        line-height: 26px;
        display: inline;
        cursor: pointer;
      }

      .newsImg {
        width: 200px;
        height: 130px;
        margin-left: 30px;
        border-radius: 10px;
        background-size: cover;
        margin-top: 5px;
      }

      .newsMsg {
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgb(100, 100, 100);
        line-height: 25px;
        margin-top: 10px;
      }

      .btool {
        position: absolute;
        bottom: 20px;
        width: calc(100% - 230px);

        .tags {
          color: #999;
          margin-right: 20px;
          cursor: pointer;
          color: #4065f6;
          font-size: 14px;
        }

        .sendTime {
          float: right;
          font-size: 14px;
          color: #868686;
        }
      }
    }

    .flashBox {
      margin-top: 10px;
      border-bottom: solid 1px #e1e0e0;
      padding-bottom: 10px;
    }

    .flashItem {
      .timeLine {
        width: 15px;

        .bDot {
          width: 15px;
          height: 15px;
          background: #dde0ff;
          border-radius: 50%;
          position: relative;
          margin-top: 5px;

          .sDot {
            width: 7px;
            height: 7px;
            background: #3881e1;
            position: absolute;
            top: 4px;
            left: 4px;
            border-radius: 50%;
          }
        }

        .itemLine {
          border-left: 1px dashed #d9d9d9;
          width: 0px;
          margin-left: 7px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
      }

      .fmsg {
        .times {
          font-size: 13px;
          color: #868686 !important;
          margin-left: 10px;
        }
        .ftitle {
          font-size: 15px;
          margin-left: 10px;
          font-weight: bold;
        }
        .fmcon {
          display: block;
          font-size: 13px;
          text-overflow: ellipsis;
          color: rgb(100, 100, 100);
          line-height: 25px;
          margin-top: 10px;
          margin-bottom: 30px;
          margin-left: 10px;
        }
      }
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      .moreFlash{
        font-size: 18px;
        color: #002fa7;
        float: right;
        cursor: pointer;
        margin-right: 10px;
        .micon{
          font-size: 14px;
        }
      }
    }
    .hot {
      margin-top: -10px;
    }

    @media (max-width: 1100px) {
      .title{
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
       
      }
      .btool{
        /* border: solid 1px blue;
        width: 100% !important; */
        display: none;
      }
      .newsItem{
        display: block !important;
        overflow: hidden;
        height: auto !important;
      }
      .nmsg{
        width: calc(100% - 140px);
        float: left;
      }
      .btoolM{
        width: 100%;
        float: left;
        margin-top:10px;
        .tags {
          color: #999;
          margin-right: 20px;
          cursor: pointer;
          color: #4065f6;
          font-size: 14px;
        }
        .sendTime {
          float: left;
          font-size: 14px;
          color: #868686;
        }
        .writer{
          float: right;
          font-size: 14px;
          color: #868686;
        }
      }
    }
    /* 适配电脑样式 */
    @media (min-width: 1100px) {
      .flashTagsMobile{
        display: none;
      }
      .btoolM{
        display: none;
      }
    }
  }
</style>