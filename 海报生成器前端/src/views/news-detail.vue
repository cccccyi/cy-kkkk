<template>
  <div class="newDt">
    <div class="mainBuild setBox">
      <div class="mainSection ">
        <p class="ndTitle">
          {{newsDt.title}}
        </p>
        <p style="overflow: hidden;" class="inpam">
          <img src="@/assets/ndlight.png" style="width: 128px;margin-top: 5px;" class="pticon plight" alt="">
          <img src="@/assets/nddark.png" style="width: 128px;display: none;margin-top: 5px;" class="pticon pldark"
            alt="">
          <font class="ndTime">
            <font-awesome-icon :icon="['far', 'clock']" /> &nbsp;{{formatDate(newsDt.createTime)}}
          </font>
        </p>
        <p class="ndMsg">
          {{newsDt.detailContent}}
        </p>
        <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts.png" class="tts tl"
          alt="">
        <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts_dark.png"
          style="display: none;" class="tts tdrk" alt="">
        <!-- <div class="btool">
          <span class="tags" v-for="tag in (newsDt['tags'] ? newsDt['tags'].replace(/、|,/g, ',').split(',').map((tag: string) => tag.trim()) : [])"  :key="tag" @click.stop="toSearch(tag)">
            #{{tag}}
          </span>
        </div> -->
        <div class="getMore" @click="getMore">
          查看全部快讯
        </div>
      </div>
      <div class="subSection flex1 ">
        <p class="title">
          热推
          <font style="font-size:20px;">🔥</font>
        </p>
        <div class="hot" id="hotX">
          <div class="newsItem setBox " v-for="item,index in newsList">
            <div class="flex1">
              <p class="newsTitle">
                <el-tag size="small" style="position: relative;top:-1px">
                  <font-awesome-icon :icon="['fas', 'chart-simple']" />
                  {{ item.metrics.views >= 1000 ? (item.metrics.views / 1000).toFixed(1) + 'K' : item.metrics.views }}
                </el-tag>
                {{item['title']}}
              </p>
              <p class="newsMsg">
                {{item['content']}}
              </p>
              <p class="timeW">
                {{item.timestamp.substring(0,16)}}
                <font style="margin-left: 10px;">
                  {{item.author}}
                </font>
                <font class="toX" @click="openLink(item.original_link)">
                  查看原文
                  <font-awesome-icon class="micon" :icon="['fas', 'arrow-right']" />
                </font>
              </p>
            </div>
          </div>
        </div>
        <p class="title" style="margin-top: 20px;">加密货币指数</p>
        <div class="hotNum setBox" id="coinNum">
          <div class="flex1 hotNumItem">
            <p class="itemNum">20</p>
            <p class="itemTitle">昨天</p>
          </div>
          <div class="flex1 hotNumItem">
            <p class="itemNum">39</p>
            <p class="itemTitle">实时</p>
          </div>
          <div class="flex1 hotNumItem" style="border: none;">
            <p class="itemNum" style="font-size: 22px;">恐惧</p>
            <p class="itemTitle">状态</p>
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
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import ApexCharts from 'apexcharts'
  import { useRouter } from 'vue-router'  // 导入useRouter
  import request from "@/utils/request"; // 引入封装的 Axios 实例
  import { _URL } from "@/api/url";
  const newsDt = ref({})

  const router = useRouter()  // 获取路由实例  
  const news = ref < any > ({})
  // 定义格式化日期的方法
  function formatDate(dateString: string): string {
    const date = new Date(dateString); // 将 ISO 字符串转换为 Date 对象
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
    const day = String(date.getUTCDate()).padStart(2, '0'); // 日
    const hours = String(date.getUTCHours()).padStart(2, '0'); // 小时
    const minutes = String(date.getUTCMinutes()).padStart(2, '0'); // 分钟

    return `${month}-${day} ${hours}:${minutes}`;
  }
  // 搜索
  const toSearch = (val: any) => {
    router.push('/deepsearch?key=' + val);  // 使用router.push进行路由跳转
  }
  //获取列表
  const getList = (type: any) => {
    request.get(_URL.news + "/" + router.currentRoute.value.query.code)
      .then((response: any) => {
        console.log(JSON.stringify(response));
        newsDt.value = response.data;
      })
      .catch((err: any) => {
        // error.value = err.message || "请求失败";
      })
  }
  //刷新
  const refresh = () => {
    if (!loading.value) {  //使加载过程中点击无效
      pageNum.value = 1
      loading.value = !loading.value
      getList('set');
    }
  }
  //加载更多
  const getMore = () => {
    router.push('/');  // 使用router.push进行路由跳转
  }
  let timer;
  // 页面卸载时清除定时器
  onBeforeUnmount(() => {
    clearInterval(timer);
  });
  // 用来保存当前播放的音频对象
  let currentAudio = null;
  let nowUrl = null
  const playAudio = (url, index) => {
    if (nowUrl == url) {
      currentAudio.pause();
      nowUrl = null;
      currentAudio.currentTime = 0; // 重置播放位置
      return;
    }
    let allurl = _URL.sounds + url
    // 如果有当前播放的音频，停止它
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0; // 重置播放位置
    }
    // 创建新的音频并播放
    currentAudio = new Audio(allurl);
    nowUrl = url;
    currentAudio.play();
    // 监听音频播放完成事件
    currentAudio.onended = () => {
      nowUrl = null;
      currentAudio = null;
    };
  };
  onMounted(() => {
    getList('set');
    var options = {
      series: [
        {
          "data": [
            {
              "x": "RWA",
              "y": 220
            },
            {
              "x": "比特币",
              "y": 190
            },
            {
              "x": "区块链",
              "y": 180
            },
            {
              "x": "MetaMask",
              "y": 170
            },
            {
              "x": "SOL",
              "y": 160
            },
            {
              "x": "礼品卡",
              "y": 150
            },
            {
              "x": "DePIN",
              "y": 140
            },
            {
              "x": "AI",
              "y": 130
            },
            {
              "x": "DOG代币",
              "y": 120
            },

            {
              "x": "Layer2",
              "y": 100
            },
            {
              "x": "智能合约",
              "y": 90
            },
            {
              "x": "清算",
              "y": 80
            },
            {
              "x": "CEX",
              "y": 70
            },

            {
              "x": "融资",
              "y": 40
            },

            {
              "x": "零知识证明",
              "y": 20
            },

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
          dataPointSelection: function (event: any, chartContext: any, config: any) {
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
      "title": "Phantom收购SimpleHashInc",
      "content": "Phantom宣布收购SimpleHashInc，增强多链支持能力，提供精准资产管理和市场洞察。",
      "author": "@phantom",
      "timestamp": "2025-02-26 09:00 PST",
      "original_link": "https://x.com/phantom/status/1894794622226075970",
      "metrics": { "views": 135719, "likes": 1889 }
    },
    {
      "title": "通过持有IBR赚取免费BTC",
      "content": "Whale_Guru称持有Solana上的IBR代币可赚比特币，但社区质疑其真实性。",
      "author": "@Whale_Guru",
      "timestamp": "2025-02-26 11:47 PST",
      "original_link": "https://x.com/Whale_Guru/status/1894836732442615998",
      "metrics": { "views": 263660, "likes": 315 }
    },
    {
      "title": "Bybit黑客事件解析",
      "content": "分析Bybit黑客事件，黑客通过ETH兑BTC并转混币器，涉及15亿美元。",
      "author": "@evilcos",
      "timestamp": "2025-02-26 00:38 PST",
      "original_link": "https://x.com/evilcos/status/1894679800670494720",
      "metrics": { "views": 156789, "likes": 2345 }
    }
  ])
  //查看原文
  const openLink = (url: any) => {
    window.open(url);
  }
</script>
<style lang="scss" scoped>
  .newDt {
    .tts {
      width: 20px;
      position: relative;
      top: 4px;
      left: 3px;
    }

    min-height: calc(100vh - 36px) !important;

    .getMore {
      cursor: pointer;
      width: 100%;
      margin-top: 50px !important;
      height: 50px;
      margin: 0 auto;
      background: rgba(234, 238, 243, 0.5);
      border-radius: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #457ded;
      position: relative;
      z-index: 5;
      user-select: none;
    }

    .ndTitle {
      font-size: 28px;
      line-height: 50px;
      color: #333;
      margin-bottom: 24px;
      word-break: break-word;
      margin-top: 0;
      font-weight: 600;
    }

    .ndTime {
      float: right;
      font-size: 15px;
      color: #868686;
      line-height: 35px;
      padding-right: 5px;
    }

    .ndMsg {
      display: block;
      width: 100%;
      font-size: 16px;
      line-height: 37px;
      margin-bottom: 25px;
      white-space: pre-wrap;
      color: #222;
      margin-top: 20px;
    }

    .hotNum {
      border: solid 1px #efeeee;
      border-radius: 10px;
      margin-top: 10px;
      padding-top: 10px;
      padding-bottom: 10px;

      .hotNumItem {
        text-align: center;
        border-right: solid 1px #efeeee;

        .itemNum {
          font-size: 25px;
          line-height: 30px;
          position: relative;
          top: 2px
        }

        .itemTitle {
          font-size: 13px;
          color: #7b8485;
          line-height: 30px;
          position: relative;
          top: 2px
        }
      }
    }

    .whale {
      border: solid 1px blue;
      height: 200px;
    }

    .newsItem {
      border-bottom: 1px solid #efeeee;
      position: relative;
      padding-top: 20px;

      .toX {
        float: right;
        color: #002fa7;
        cursor: pointer;
      }

      .newsTitle {
        font-size: 15px;
        font-weight: bold;
        color: #333;
        line-height: 26px;
        display: inline;
        cursor: pointer;
      }

      .newsMsg {
        font-size: 13px;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgb(100, 100, 100);
        line-height: 25px;
      }

      .timeW {
        font-size: 13px;
        color: #868686;
        margin-top: 5px;
        margin-bottom: 10px;
      }
    }



    .title {
      font-size: 20px;
      font-weight: bold;

      .moreFlash {
        font-size: 18px;
        color: #002fa7;
        float: right;
        cursor: pointer;
        margin-right: 10px;

        .micon {
          font-size: 14px;
        }
      }
    }

    .hot {
      margin-top: -10px;
    }

    .tags {
      color: #999;
      margin-right: 20px;
      cursor: pointer;
      color: #4065f6;
      font-size: 14px;
    }

    /* 适配手机样式 */
    @media (max-width: 1100px) {
      .ndTitle {
        font-size: 23px;
        line-height: 38px;
        margin-top: 10px;
        padding-top: 10px;
      }

      .inpam {
        margin-top: -15px;

        .pticon {
          width: 108px !important;
          margin-top: 8px;
        }
      }

      .ndMsg {
        line-height: 30px;
        color: #4d4d4d;
      }

      .title {
        display: none;
      }

      #coinNum {
        display: none;
      }

      #hot {
        display: none;
      }

      #hotX {
        display: none;
      }

      .flashTags {
        display: none;
      }
    }

    /* 适配电脑样式 */
    @media (min-width: 1100px) {}
  }
</style>