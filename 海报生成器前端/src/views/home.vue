<template>
  <div class="home" >
    <div class="mainBuild setBox">
      <div class="mainSection">
          <!-- <div class="title HeadTitle setBox">
            快讯
          </div> -->
          <div style="height: 3px;" class="zw"></div>
          <!-- 手机端头部 -->
          <!-- <div class="flashTop">
            <span class="topItem">
              <img src="@/assets/new.png" class="topIcon" alt="">
              <font-awesome-icon class="topIconSpeak" :icon="['fas', 'volume-high']" />
              02-28资讯早报
            </span>
            <span class="topItem"><font-awesome-icon class="topIconSpeak" :icon="['fas', 'volume-high']" />🔥&nbsp;特朗普新政，ETF将会何去何从？</span>
            <span class="topItem"><font-awesome-icon class="topIconSpeak" :icon="['fas', 'volume-high']" />02-26资讯早报</span>
          </div> -->
          <div class="flashBox" style="margin-top: 10px;">
            <!-- 电脑端头部 -->
            <div class="flashTags">
              <span  v-for="item in newsStore.m1.slice(0,12)"  class="flashTagsItem" :class="{'flashTagsItemActive': newsStore.primaryCategory === item}"  @click="newsStore.setPrimaryCategory(item);">
                {{item}}
                <div class="tbItem" v-if="newsStore.primaryCategory === item">

                </div>
              </span>
              <font-awesome-icon
                :icon="['fas', 'arrows-rotate']"
                :class="['refreshBtnPc', { 'fa-spin fast-spin': newsStore.refresh }]"
                @click="toRefresh"
              />
              <el-checkbox  v-model="onlyImportant" label="只看重要" class="onipPc custom-checkbox" />
            </div>
            <!-- {{列表}} -->
             <div v-for="item in list">
              <div class="flashItem setBox" @click="goDt(item.uniqueCode)">
                <div class="timeLine  noLine setBox" >
                  <div class="bDot">
                    <div class="sDot"></div>
                  </div>
                  <div class="flex1 itemLine"></div>
                </div>
                <div class="fmsg flex1">
                  <p class="" style="padding-left: 20px;">
                    <font class="times">{{formatDate(item.createTime)}}</font>
                  
                    <font style="display: inline-block;width: 5px;"></font>
                   
                    <font class="ftitle" :class="{ ipMsg: item.pushFlag === 'y' }">{{item['title']}}</font>
                   
                  </p>
                  <p class="fmcon" :class="{ ipMsg: item.pushFlag === 'y' }">
                    {{item['detailContent']}}
                    <!-- <el-tooltip
                      class="box-item"
                      content="朗读"
                      placement="top"
                    > -->
                      <img @click.stop="playAudio(item['sounds'])" v-if="item['sounds']" src="@/assets/tts.png" class="tts tl" alt="">
                      <img @click.stop="playAudio(item['sounds'])" v-if="item['sounds']" src="@/assets/tts_dark.png" style="display: none;" class="tts tdrk" alt="">
                    <!-- </el-tooltip> -->
                    <br>
                  </p>
                  <!-- <div class="btool ">
                    <span class="tags"v-for="tag in (item['tags'] ? item['tags'].replace(/、|,/g, ',').split(',').map((tag: string) => tag.trim()) : [])"  :key="tag" @click.stop="toSearch(tag)">
                      #{{tag}}
                    </span>
                  </div> -->
                </div>
              </div>
             </div>
            <div class="getMore" @click="getMore">
              <font v-if="!loading">
                加载更多
              </font>
              <font v-if="loading">
                <div class="loader"></div>
              </font>
            </div>
          </div>
      </div>
      <div class="subSection flex1">
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
  import { ref, onMounted,onBeforeUnmount,computed ,watch} from 'vue'
  import ApexCharts from 'apexcharts'
  import { useRouter } from 'vue-router'  // 导入useRouter
  import request from "@/utils/request"; // 引入封装的 Axios 实例
  import { _URL } from "@/api/url";
  import { useNewsStore } from '@/stores/news';  //引入状态
  const router = useRouter()  // 获取路由实例
  const newsStore = useNewsStore();
  const pageNum = ref(1) 
  const pageSize = ref(20)
  const primaryCategory = ref('') //资讯分类
  const loading = ref(false);
  const list = ref<any>([])

  // 搜索
  const toSearch = (val: any) => {
    router.push('/deepsearch?key=' + val);  // 使用router.push进行路由跳转
  }
  //获取列表
  const getList = (type: any) => {
        let data =  {
              pageNum: pageNum.value,
              pageSize: pageSize.value,
              primaryCategory:primaryCategory.value,
              pushFlag:newsStore.pushFlag
        }
        request.get(_URL.news_list,data)
        .then((response: any) => {
        //    console.log(JSON.stringify(response));
            type=='set'?list.value=response.data.list:list.value.push(...response.data.list);  
            setTimeout(()=>{
              loading.value = false;
              newsStore.setRefresh(false);
            },1388)
            if(type=='set'){
              window.scrollTo({
              top: 0,
              behavior: 'smooth', // 平滑滚动
            });
            }
        })
        .catch((err: any) => {
         // error.value = err.message || "请求失败";
          loading.value = false;
          pageNum.value --
        })
  }
  //刷新
  const refresh = () =>{
    if(!loading.value){  //使加载过程中点击无效
      pageNum.value = 1
      loading.value = !loading.value
      getList('set');
    }
  }
  //加载更多
  const getMore = () => {
    if(!loading.value){  //使加载过程中点击无效
      pageNum.value++
      loading.value = !loading.value
      getList('push');
    }
  }
  watch(
    () => newsStore.primaryCategory, // 监听的源
    (newVal, oldVal) => {
      if(newVal == '全部'){
        primaryCategory.value = ''; // 更新本地引用
      }else{
        primaryCategory.value = newVal; // 更新本地引用
      }
      getList('set');
    }
  );

  watch(
    () => newsStore.refresh, // 监听的源
    (newVal, oldVal) => {
      getList('set');
    }
  );

  watch(
    () => newsStore.pushFlag, // 监听的源
    (newVal, oldVal) => {
      getList('set');
    }
  );

  //跳转到详情页面
  const goDt = (uniqueCode :any) =>{
    router.push('/news-detail?code=' + uniqueCode);  // 使用router.push进行路由跳转
  }
  let timer;
  // 页面卸载时清除定时器
  onBeforeUnmount(() => {
    clearInterval(timer);
  });
  onMounted(() => {
    // timer = setInterval(() => {
    //     getList('set');
    // }, 8000);  // 10000 毫秒 = 10 秒
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
  const openLink =(url:any)=>{
    window.open(url);
  }
  //刷新
  const toRefresh = () =>{
    if(!newsStore.refresh){  //使加载过程中点击无效
      //要刷新了，广播出去
      newsStore.setRefresh(true);
    }
  }
  //只看重要
  const onlyImportant = ref(newsStore.pushFlag === 'y');
  watch(onlyImportant, (newVal, oldVal) => {
    if (newVal) {
      newsStore.setPushFlag('y');
    } else {
      newsStore.setPushFlag('');
    }
  });

  
    // 用来保存当前播放的音频对象
    let currentAudio = null;
    let nowUrl = null
    const playAudio = (url, index) => {
      if(nowUrl == url){
        currentAudio.pause();
        nowUrl = null;
        currentAudio.currentTime = 0; // 重置播放位置
        return;
      }
      
      let allurl =  _URL.sounds + url
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

    //处理时间显示
    const  formatDate = (createTime) =>{
      const now = new Date();
      const time = new Date(createTime);
      const isToday = now.toDateString() === time.toDateString();

      if (isToday) {
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return time.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      }
    }

</script>
<style lang="scss" scoped>
  .home {
    .tts{
      width: 18px;
      position: relative;
      top:4px;
      left: 10px;
    }
    .fast-spin {
      animation: fa-spin 0.5s linear infinite !important;
    }
    .refreshBtnPc{
      float: right;
      font-size: 15px !important;
      margin-top: 10px !important;
      color: #002fa7;
      cursor: pointer;
    }
    .onipPc{
      float: right;
      margin-top: 2px;
      margin-right: 15px;
    }
    .ipMsg{
      color: #3a74ce !important;
    }
    min-height: calc(100vh - 135px) !important;
    .hotNum{
      border: solid 1px #efeeee;
      border-radius: 10px;
      margin-top: 10px;
      padding-top: 10px;
      padding-bottom: 10px;
      .hotNumItem{
        text-align: center;
        border-right: solid 1px #efeeee;
        .itemNum{
          font-size: 25px;
          line-height: 30px;
          position: relative;
          top:2px
        }
        .itemTitle{
          font-size: 13px;
          color: #7b8485;
          line-height: 30px;
          position: relative;
          top:2px
        }
      }
    }
    
    .whale{
      border: solid 1px blue;
      height: 200px;
    }
    .newsItem {
      border-bottom: 1px solid #efeeee;
      position: relative;
      padding-top: 20px;
      .toX{
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
    .flashTags{
      border-bottom: solid 1px #eaedf7;
      margin-bottom: 20px;
      margin-top: -10px;
      padding-bottom: 10px;
      .flashTagsItem{
        text-align: center;
        color: rgb(120, 123, 138);
        display: inline-block;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        margin-right: 25px;
        .tbItem{
          width: calc(100% - 2px);
          height: 3px;
          border-radius: 10px;
          background: linear-gradient(148deg, #4d83ee, #6898f8 72%, #4b81ed);
          position: absolute;
          left: 0;
          bottom: -10px;
        }
      }
      .flashTagsItemActive{
        color: black;
        font-size: 20px;
        font-weight: bold;
      }
    }
    .topItem:first-child{
      margin-left: -12px;
    }
    .topItem{
      line-height: 40px;
      padding: 0 30px 0 30px;
      cursor: pointer;
      border-right: solid 1px #dbdfed;
      color: #333;
      font-size: 14px;
      font-weight: bold;
      .topIcon{
        width: 25px;
        position: relative;
        top:3px
      }
      .topIconSpeak{
        font-size: 14px;
        margin-left: 5px;
        margin-right: 3px;
        color: #cba62a;
      }
    }
    .flashTop{
      border: solid 1px #efeeee;
      border-radius: 10px;
    }
    .flashBox{
      /* border: solid 1px #efeeee;
      padding: 20px; */
      border-radius: 10px;
      padding-top: 0 !important;
    }
    .flashItem {
      cursor: pointer;
      .btool {
        margin-left: 20px;
        margin-top: 10px;
        margin-bottom: 40px;

        .tags {
          color: #999;
          margin-right: 20px;
          cursor: pointer;
          color: #4065f6;
          font-size: 14px;
        }
      }
      

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
        padding-bottom:40px;
        .times {
          color: #868686 !important;
        }
        .ftitle {
          font-size: 18px;
          font-weight: bold;
          position: relative;
          top: 1px
        }
        .fmcon {
          display: block;
          text-overflow: ellipsis;
          font-size: 14px;
          line-height: 25px;
          color: rgb(100, 100, 100);
          margin-top: 10px;
          margin-left: 20px;
          margin-right: 10px;
        }
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
    .getMore{
          cursor: pointer;
          width: 95%;
          margin-top: 20px !important;
          height:50px;
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
      .loader {
        border: 2px solid rgb(23, 142, 233); /* Light gray background */
        border-top: 2px solid rgba(0,0,0,0) !important; /* Blue color */
        border-radius: 50%;
        width: 18px;
        height: 18px;
        animation: spin 1s linear infinite, gradient-spin 3s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    /* 适配手机样式 */
    @media (max-width: 1100px) {
      .flashTop{
        border-radius: 5px !important;
        width: 100%;
        padding-top: 7px;
        padding-bottom: 7px;
        .topItem{
          display: block;
          width: 100%;
          line-height:30px;
          border-right: none;
          padding: 0;
          padding-left: 10px;
          font-size: 16px;
          font-weight: normal !important;
        }
        .topItem:first-child{
          margin-left:0px;
        }
        .topItem:last-child{
          display: none;
        }
        
      }
      .flashTags{
        overflow:hidden;
      }
      .flashBox{
        /* border: solid 1px #efeeee; */
        border: none;
        padding: 0;
        border-radius: 10px;
        padding-top: 0 !important;
      }
      .title{
        display: none;
      }
      #coinNum{
        display: none;
      }
      #hot{
        display: none;
      }
      #hotX{
        display: none;
      }
      .flashTags{
        display: none;
      }
      .flashTagsMobile{
        position: fixed;
        background: white;
        width: 100%;
        top:60px;
        left: 0;
        padding-left:15px;
        z-index: 999;
        height: 45px;
        margin-bottom:20px;
        .flashTagsItem{
          font-size: 17px;
          margin-left: 20px;
          color: #999;
          height: 40px;   
          display: inline-block;
          margin-top: 5px;
        }
        .flashTagsItem:first-child{
          margin-left: 0;
        }
        .flashTagsItemActive{
          font-size: 20px;
          color: black;
          font-weight: bold;
          border-bottom: solid 2px #2e61e0;
        }
       
      }
   
    }
  
  }

    /* 适配电脑样式 */
    @media (min-width: 1100px) {
      .flashTagsMobile{
        display: none;
      }
     
    }


 
</style>