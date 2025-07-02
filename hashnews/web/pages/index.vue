<template>
  <div class="index">
    <!-- 这里是海报 -->
    <poster ref="posterRef"/>
    <div class="mainBuild setBox ">
      <!-- <div class="backgroundRound"></div> -->
      <div class="mainSection " style="margin-top: 10px;">
          <!-- 电脑端头部 -->
          <div class="flashTags setBox">
            <div class="flex1 menus">
              <span v-for="item in newsStore.m1.slice(0,12)" class="flashTagsItem"
                :class="{'flashTagsItemActive': newsStore.primaryCategory === item}"
                @click="newsStore.setPrimaryCategory(item);">
                {{item}}
                <!-- <div class="tbItem" v-if="newsStore.primaryCategory === item">
                </div> -->
              </span>
            </div>
            <div>
              <font-awesome-icon :icon="['fas', 'arrows-rotate']" 
              :class="['refreshBtnPc', { 'fa-spin fast-spin': newsStore.refresh }]" @click="toRefresh" />
              <el-button key="primary" text  size="small" class="onipPc" @click="onlyImportant=!onlyImportant" >
                <span  class="inChosed"  :class="{'hasBg':onlyImportant}">
                  <font-awesome-icon v-if="onlyImportant" :icon="['fas', 'check']" class="sure" />
                </span>
                只看重要
              </el-button>
            </div>
          </div>
          <!-- 手机端头部 -->
          <div class="mHeader">
            <span 
              v-for="item in newsStore.m1.slice(0,5)" 
              class="flashTagsItem" 
              :class="{'flashTagsItemActive': newsStore.primaryCategory === item}"
              @click="newsStore.setPrimaryCategory(item);"
            >
              {{item}}
            </span>
            <el-button key="primary" type="primary" text bg size="small" class="onip" @click="onlyImportant=!onlyImportant" >
              <span v-if="onlyImportant"><font-awesome-icon :icon="['fas', 'check']" />&nbsp;</span>
              只看重要
            </el-button>
          </div>
          <!-- 手机端头部 -->
          <!-- {{列表}} -->
          <div id="mescroll" class="mescroll ">
            <div class="mpd">
              <div v-for="item in list">
                <div class="flashItem setBox" @click="goDt(item.uniqueCode)" >
                  <div class="noLine setBox " style="position: relative;" v-if="!isMobile">
                    <span class="times">
                      {{formatDate(item.publishTime).time}}
                      <br>
                      <span style="font-size: 14px;color: #999999;">
                        {{formatDate(item.publishTime).date}}
                      </span>
                    </span>
                  </div>
                  <div class="timeLine  noLine setBox" >
                    <div class="bDot">
                      <div class="sDot"></div>
                    </div>
                    <div class="flex1 itemLine"></div>
                  </div>
                  <div class="fmsg flex1" >
                    <p class="" style="padding-left: 20px;">
                      <span class="times" v-if="isMobile">{{formatDate(item.publishTime).time}}</span>
                      <span class="ftitle" :class="{ ipMsg: item.pushFlag === 'y' }">{{item['title']}}</span>
                    </p>
                    <div  :class="{ ipMsg: item.pushFlag === 'y' , fmcon: item.pushFlag != 'y', fmconNc: item.pushFlag == 'y'}">
                      <span :class="{ 'hideLine': !item.open}" style="white-space: pre-wrap;">
                        {{item['detailContent']}}
                      </span>

                      <span style="margin-top: 13px;display: block;">
                          <span
                            class="tags"
                            v-for="tag in getProcessedTags(item.tags).slice(0, isMobile?2:3)"
                            :key="tag"
                            @click.stop="toSearch(tag)"
                          > 
                            {{tag}}
                          </span>

                          <span class="flIconText" v-if="!item['open']" @click.stop="item['open']=!item['open']">
                            <font-awesome-icon :icon="['fas', 'folder-closed']"/>
                            <span>展开</span>
                          </span>
                          <span class="flIconText" v-if="item['open']" @click.stop="item['open']=!item['open']">
                            <font-awesome-icon :icon="['fas', 'folder-open']"/>
                            <span>收起</span>
                          </span>
                        <!-- <AudioPlayer v-if="item.sounds" width="200px" class="custom-audio" :src="'https://hashnews.pro/sounds/'+item.sounds" @click.stop=""/> -->
                        <font-awesome-icon :icon="['fas', 'image']" class="flIcon fnm" @click.stop="showPoster(item)"/>
                        <font-awesome-icon :icon="['fas', 'copy']" class="flIcon " @click.stop="copy(item['title'],item['detailContent'])" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <ClientOnly>
                <div class="getMore" @click="getMore">
                  <span v-if="!loading">
                    加载更多
                  </span>
                  <span v-if="loading">
                    <div class="loader"></div>
                  </span>
                </div>
              </ClientOnly>
            </div>
          </div>
      </div>
      <ClientOnly>
        <div class="subSection flex1 mobileNone" v-if="!isMobile">
          <EChartsGauge   />
          <whale  tag="whale" title="巨鲸动态" :isHot="true"  style="margin-top: 30px;"/>
          <xListView  tag="kol" title="热门kol" :isHot="true" style="margin-top: 30px;"/>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import EChartsGauge from './components/EChartsGauge.vue';
  import mobileFooter from './components/mobileFooter.vue';
  import xListView from './components/xListView.vue';
  import AudioPlayer from './components/AudioPlayer.vue'
  //海报相关的
  import poster from './components/poster.vue';
  const posterRef = ref(null)
  //显示海报
  const showPoster = (item)=>{posterRef.value?.showPoster(item)}
  import whale from './components/whale.vue';
  import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
  import { _URL } from "@/api/url";
  import { useNewsStore } from '@/stores/news';  //引入状态
  import { useNuxtApp } from '#app';
  const { $device } = useNuxtApp();
  const isMobile = $device.isMobile;
  const route = useRoute();
  const router = useRouter();
  const newsStore = useNewsStore();
  const pageNum = ref(1)
  const pageSize = ref(20)
  const primaryCategory = ref('') //资讯分类
  const loading = ref(false);
  const list = ref < any > ([])  
  let mescroll; // 提前定义全局变量
  onMounted(() => {
  //如果是手机，才初始化下拉刷新
    if (isMobile) {
        mescroll = new MeScroll("mescroll", { //第一个参数"mescroll"对应上面布局结构div的id (1.3.5版本支持传入dom对象)
          down: {
            callback: downCallback //下拉刷新的回调,别写成downCallback(),多了括号就自动执行方法了
          },
        });
    }
  });
  //配置网页头
  const url = useRequestURL();
  useHead({
    title: '哈世链闻 - 区块链快讯、新闻、数据监控',
    meta: [
      { name: 'keywords', content: 'hashnews,哈世链闻' },
      { name: 'description', content: '哈世链闻-提供最新区块链快讯、数据监控，助你掌握Web3动态。' },
      // Open Graph（OG）标签
      { property: 'og:image', content: `${url.origin}/image/share.png` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: '哈世链闻' },
      { property: 'og:title', content: '哈世链闻 - 区块链快讯、新闻、数据分析' },
      { property: 'og:description', content: '哈世链闻-提供最新区块链快讯、数据监控，助你掌握Web3动态。' },
      // Twitter 标签
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:image', content: `${url.origin}/image/share.png` }
    ],
    link: [
      { rel: 'stylesheet', href: './mescroll/mescroll.min.css' }
    ],
    script: [
      { src: './mescroll/mescroll.min.js', defer: true }
    ]
  });

  

 
  // 搜索
  const toSearch = (val: any) => {
    router.push('/deepsearch?key=' + val);  // 使用router.push进行路由跳转
  }
  //格式化tags
  const getProcessedTags = (tagsString) => {
      return tagsString.split(/[ ,、]/).filter(tag => tag);
  };
  //复制全部
  const copyAll = () => {
    let list2 = list.value
    // 拼接字符串，格式为：序号. title - detailContent
    const result = list2.map((item, index) => `${index + 1}. ${item.title}\n${item.detailContent}`).join('\n\n');

    // 使用 Clipboard API 复制文本到剪贴板
    navigator.clipboard.writeText(result)
      .then(() => {
        ElMessage({
          message: '复制成功',
          type: 'success',
        })
      })
      .catch(err => {
        console.error("复制失败:", err);
      });
  }
  //复制单个
  const copy = (title, val) => {
    navigator.clipboard.writeText(  title + '\n' + val).then(res => {
      //getNotification('消息', '复制成功', 'success')
      ElMessage({
        message: '复制成功',
        type: 'success',
      })
    }).catch(error => {

    })
  }

  //加载数据方法
  const getList = async (type: any) => {
    let requestData = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      primaryCategory: primaryCategory.value,
      pushFlag: newsStore.pushFlag,
    };
    const { data } = await useAsyncData('news', () =>
      $fetch(_URL.news_list, {
        method: 'GET',
        query: requestData,  // 将参数传递到查询字符串中
      })
    );
    if (data.value) {
      // let response = data.value.data.list;
       let response = data.value.data.list.map(item => ({ ...item, open: false }));
      //    console.log(response)
      type == 'set' ? list.value = response : list.value.push(...response);
      setTimeout(() => {
        loading.value = false;
        newsStore.setRefresh(false);
      }, 888)
      if (process.client && type == 'set') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth', // 平滑滚动
        });
      }
    }
  };
  getList('set');

  //刷新
  const toRefresh = () => {
    if (!newsStore.refresh) {  //使加载过程中点击无效
      //要刷新了，广播出去
      newsStore.setRefresh(true);
    }
  }
  //监听刷新pinia
  watch(
    () => newsStore.refresh, // 监听的源
    (newVal, oldVal) => {
      if (newVal) {
        pageNum.value = 1;
        getList('set');
        if (isMobile) {
          setTimeout(() => {
            mescroll.endSuccess(); // 结束下拉刷新
          }, 1000)
        }
      }
    }
  );
  //监听类型切换pinia
  watch(
    () => newsStore.primaryCategory, // 监听的源
    (newVal, oldVal) => {
      if (newVal == '全部') {
        primaryCategory.value = ''; // 更新本地引用
      } else {
        primaryCategory.value = newVal; // 更新本地引用
      }
      pageNum.value = 1;
      getList('set');
    }
  );
  //监听复制全部pinia
  
  watch(
    () => newsStore.copyTime, (newVal, oldVal) => {
      
    }
  );

  //只看重要
  const onlyImportant = ref(newsStore.pushFlag === 'y');
  // 当只看重要被勾选时，改变pinia状态
  watch(onlyImportant, (newVal, oldVal) => {

    if (newVal) {
      newsStore.setPushFlag('y');
    } else {
      newsStore.setPushFlag('');
    }
  });
  //监听只看重要pinia
  watch(
    () => newsStore.pushFlag, // 监听的源
    (newVal, oldVal) => {
      getList('set');
    }
  );
  //加载更多按钮
  const getMore = () => {
    if (!loading.value) {  //使加载过程中点击无效
      pageNum.value++
      loading.value = !loading.value
      getList('push');
    }
  }
  //处理时间显示，列表中的
  // 处理时间显示，列表中的
const formatDate = (timestamp: number) => {
    if (!timestamp) return { time: '-', date: '' }; // 处理无效输入

    const now = new Date(); // 当前时间
    const time = new Date(timestamp * 1000); // 时间戳转换为毫秒

    // 获取东八区时间
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };

    // 判断是否是今天
    const isToday = now.toDateString() === time.toDateString();

    if (isToday) {
        return {
            time: time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }),
            date: ''
        };
    } else {
        return {
            time: time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }),
            date: time.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' })
        };
    }
};
  
  // // 示例
  // console.log(formatDate(1711507200)); // 2024/03/27 上午08:00 星期三

  //跳转到详情页面
  const goDt = (uniqueCode: any) => {
  //  navigateTo('/news?code=' + uniqueCode);  // 使用router.push进行路由跳转
   window.open('/news?code=' + uniqueCode);  // 使用router.push进行路由跳转
  }

  
  //下拉刷新的回调
  const downCallback = () => {
    if (mescroll) {
      newsStore.setRefresh(true);
    } else {
      console.error("mescroll is not initialized yet");
    }
  }
</script>
<style lang="scss" scoped>
  .index {
    .custom-audio{
      /* width: 260px; */
      /* height:30px;
      float: right;
      position: relative;
      top:-7px;
      margin-left:30px; */
      float: right;
      margin-left: 22px;
    }
    .backgroundRound{
      width: 600px;
      height: 600px;
      position: absolute;
      left: -120px;
      top:-60px;
      z-index: -1;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(202, 207, 250, 1) 0%,
        rgba(202, 207, 250, 0.4) 40%,
        rgba(202, 207, 250, 0.1) 70%,
        #ffffff 100%
      );
      filter: blur(20px); /* 模糊整个圆形 */
      opacity: 0.6;
    }
    .mHeader{
      display: none;
    }
    
    .flIcon {
     font-size: 15px;
      color: #ccd8d8;
      float: right;
      margin-right: 30px;
    }
    .fnm{
      margin-right: 5px;
    }
  .flIconText {
   display: none;
    }
    
    .tts {
      width: 18px;
      position: relative;
      top: 4px;
      left: 10px;
    }

    .fast-spin {
      animation: fa-spin 0.5s linear infinite !important;
    }

    .refreshBtnPc {
      float: right;
      font-size: 14px !important;
      margin-top: 18px !important;
      margin-right: 15px;
      color: #002fa7;
      cursor: pointer;
    }

    .onipPc {
      float: right;
      margin-top: 14px;
      margin-right: 6px;
      font-size: 13px;
      color: #002fa7;
      .hasBg{
        background:#002fa7 ;
        color: white;
      }
      .inChosed{
        width: 12px;
        height: 12px;
        border-radius: 10px;
        border: solid 1px #002fa7;
        margin-right: 3px;
        .sure{
          font-size: 9px;
          position: relative;
          top:-2px;
        }
      }
    }
    
    .onipPc:hover{
      background: rgba(0,0,0,0);
    }
    .ipMsg {
      color: #002fa7;
    }

    min-height: calc(100vh - 135px) !important;




    .newsItem:first-child {}


    .flashTags {
      /* border-bottom: solid 1px #eaedf7; */
      margin-top: -10px;
      margin-bottom: 20px;
      height: 51px;
      background: rgba(26,35,126,0.07);
      border-radius: 9px;
      .menus{
        overflow: hidden;
        margin-right: 10px;
        box-shadow: 0px 0px 6px 1px rgba(0,0,0,0.07);
        background: white;
        border-radius: 8px;
      }
      .flashTagsItem {
        text-align: center;
        color: #333333;
        display: inline-block;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        margin-left: 20px;
        font-size: 15px;
        padding:4px 7px 4px 7px;
        line-height: 14px;
        border-radius: 3px;
        margin-top: 13px;
      }

      .flashTagsItemActive {
        /* color: black;
        font-size: 20px;
        font-weight: bold; */
        background: #efeff4;
        border: 1px solid #1443bb;
        color: #3a62ca;
      }
    }

    .topItem:first-child {
      margin-left: -12px;
    }

    .topItem {
      line-height: 40px;
      padding: 0 30px 0 30px;
      cursor: pointer;
      border-right: solid 1px #dbdfed;
      color: #333;
      font-size: 14px;
      font-weight: bold;

      .topIcon {
        width: 25px;
        position: relative;
        top: 3px
      }

      .topIconSpeak {
        font-size: 14px;
        margin-left: 5px;
        margin-right: 3px;
        color: #cba62a;
      }
    }

    .flashTop {
      border: solid 1px #efeeee;
      border-radius: 10px;
    }

    .flashBox {
      /* border: solid 1px #efeeee;
      padding: 20px; */
      border-radius: 10px;
      padding-top: 0 !important;
    }

    .flashItem {
      cursor: pointer;
  



    /* .flashItem .tags {
      color: rgb(163, 162, 162);
      cursor: pointer;
      font-size: 11px;
      user-select: none;
      padding: 2px 4px 1px 4px;
      border: solid 1px rgb(235, 232, 232);
      border-radius: 2px;
      line-height: 15px;
      margin-left: 10px;
      position: relative;
      top: -4px;
    } */

      .tags {
        color: rgb(163, 162, 162);
        cursor: pointer;
        font-size: 12px;
        user-select: none;
        padding: 2px 3px 2px 3px;
        border: solid 1px rgb(235, 232, 232);
        border-radius: 2px;
        line-height: 15px;
        margin-left:10px;
        position: relative;
        top:-4px
      }
      .tags:first-child{
        margin-left:0px;
      }
      .times{
        margin-top: 4px;
        margin-right: 10px;
        color: #002fa7;
        font-weight: bold;
        font-size: 15px;
        width: 38px;
        position: relative;
      }
      .timeLine {
        width: 10px;

        .bDot {
          width: 17px;
          height: 17px;
          background: #dde0ff;
          border-radius: 50%;
          position: relative;
          margin-top: 7px;

          .sDot {
            width: 7px;
            height: 7px;
            background: #3881e1;
            position: absolute;
            top: 5px;
            left: 5px;
            border-radius: 50%;
          }
        }

        .itemLine {
          border-left: 1px dashed #d9d9d9;
          width: 0px;
          margin-left:8px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
      }

      .fmsg {
        padding-bottom: 25px;
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
        .fmconNc {
          display: block;
          text-overflow: ellipsis;
          font-size: 14px;
          line-height: 25px;
          margin-top: 10px;
          margin-left: 20px;
          margin-right: 10px;
        }
      }
    }
    .getMore {
      cursor: pointer;
      width: 95%;
      margin-top: 20px !important;
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
    /* 适配手机样式 */
    @media (max-width: 1100px) {
      .fmsg{
        padding-bottom: 18px !important;
      }
      .flIconText {
      font-size: 15px;
      color: #ccd8d8;
      float: right;
      margin-right: 0px;
      display: inline-block !important;
      margin-top: -4px;
    }
    .flIconText span{
      font-size: 12px;
      margin-left: 3px;
      color: #b8c7c7;
    }
        .hideLine{
          display: -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .ftitle {
          font-size: 17px !important;
          font-weight: 500 !important;
        }

         .fmcon {
       
          line-height: 23px !important;
          margin-top: 7px !important;
        }
        .fmconNc {
   
          line-height: 23px !important;
          margin-top: 7px !important;
        }
      .custom-audio{
        margin-left: 10px !important;
      
      }
      .flIcon {
        margin-right: 31px !important;
      }
      /* .tags {
        margin-left: 8px !important;
      }
      .tags:first-child {
        margin-left: 0px !important;
      } */
      .mHeader{
        display: block;
      }
      .getMore {
        margin-bottom: 100px;
      }
      .mHeader{
        position: fixed;
        background: white;
        width: 100%;
        top: 60px;
        left: 0;
        padding-left: 15px;
        z-index: 999;
        margin-bottom: 20px;
        box-shadow: 0 0px 3px 0 #e6e7ea;
        .flashTagsItem:first-child{
          margin-left: 0;
        }
        .flashTagsItem {
          -webkit-tap-highlight-color: transparent;
          /* 适用于iOS和Chrome */
          outline: none;
          /* 去除点击时的轮廓 */
          box-shadow: none;
          /* 去除点击时的阴影 */
          font-size: 17px;
          color: #999;
          height: 45px;
          line-height: 45px;
          display: inline-block;
          text-decoration: none;
          margin-left: 15px;
        }
        .flashTagsItemActive {
          line-height: 42px;
          font-size: 20px;
          color: black;
          font-weight: bold;
          border-bottom: solid 2px #2e61e0;
          span{
            font-size: 23px !important;
          }
        }
        .onip {
          float: right;
          margin-top: 11px;
          margin-right: 10px;
        }
      }
      .mescroll {
        position: fixed;
        width: 100%;
        /* 继承父级宽度 */
        left: 0;
        bottom: 0;
        top: 106px;
        height: auto
      }

      .mpd {
        padding-left: 15px;
        padding-right: 15px;
        margin-top: 10px;
      }

      .mmhide {
        display: none !important;
      }

      .posterImg {
        .imgBox {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 95vw;
          height: auto !important;
          margin-top: 0 !important;
          img {
            width: 100%;
            height: auto !important;
          }
        }
      }

      .flashTop {
        border-radius: 5px !important;
        width: 100%;
        padding-top: 7px;
        padding-bottom: 7px;

        .topItem {
          display: block;
          width: 100%;
          line-height: 30px;
          border-right: none;
          padding: 0;
          padding-left: 10px;
          font-size: 16px;
          font-weight: normal !important;
        }

        .topItem:first-child {
          margin-left: 0px;
        }

        .topItem:last-child {
          display: none;
        }

      }

      .flashTags {
        overflow: hidden;
      }

      .flashBox {
        /* border: solid 1px #efeeee; */
        border: none;
        padding: 0;
        border-radius: 10px;
        padding-top: 0 !important;
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

      .flashTagsMobile {
        position: fixed;
        background: white;
        width: 100%;
        top: 60px;
        left: 0;
        padding-left: 15px;
        z-index: 999;
        height: 45px;
        margin-bottom: 20px;

        .flashTagsItem {
          font-size: 17px;
          margin-left: 20px;
          color: #999;
          height: 40px;
          display: inline-block;
          margin-top: 5px;
        }

        .flashTagsItem:first-child {
          margin-left: 0;
        }

        .flashTagsItemActive {
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
    .flashTagsMobile {
      display: none;
    }
   
    .saveMsg {
      display: none;
    }
  }
</style>