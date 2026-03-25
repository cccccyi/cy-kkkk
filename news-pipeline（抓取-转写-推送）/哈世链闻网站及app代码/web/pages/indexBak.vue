<template>
    <div class="index">
      <!-- 这里是海报 -->
      <ClientOnly>
        <div>
          <div class="poster" ref="posterRef">
            <div class="pheader">
                <img class="headerHlogo" src="@/assets/elogo.png" alt="">
                <p class="headerTitle">
                    <img class="fhtit" src="@/assets/clogo.png" alt="">
                    <span class="fhtitle">&nbsp;·&nbsp;&nbsp;快讯</span>
                </p>
            </div>
            <p class="fhMsg1">
              {{posterMsg.title}}
            </p>
            <p class="fhMsg2">
              <font-awesome-icon :icon="['far', 'clock']"
                style="font-size: 25px;" />&nbsp;&nbsp;{{formatDateImg(posterMsg.publishTime)}}
            </p>
            <p class="fhMs3">
              {{posterMsg.detailContent}}
            </p>
            <div style="overflow: hidden;position: relative;margin-top: -20px;">
              <!-- 左下角图标 -->
              <div style="
                 
                  overflow:hidden;
                  width: 306px;
                  margin-left: 30px;
                  margin-bottom: 30px;
                  position: absolute;
                  bottom: 5px;
                  right: 20px;
                ">
                <img src="@/assets/posterFooter.png" style="float: left;width: 300px;" alt="">
                <span style="
                    border-top:solid 2px #004ab6;
                    font-size: 23px;
                    width: 330px;
                    letter-spacing: 3px;
                    display: inline-block;
                    margin-top: 10px;
                    color: #004ab6;font-weight: bold;
                  ">
                  链上新闻，一个哈世就够了
                </span>
              </div>
              <!-- 原文二维码 -->
              <div style="
                  float: right;
                  overflow:hidden;
                  margin-right: 30px;
                  margin-bottom: 30px;
                ">
                <div style="width: 130px;height: 130px;">
                  <!-- <img :src="qrData" style="width: 100%;" alt=""> -->
  
                </div>
                <span style="
                    font-size: 23px;
                    letter-spacing: 3px;
                    display: inline-block;
                    color: #002fa7;font-weight: bold;
                    width: 100%;
                  ">
                  <center>
                    <!-- 查看原文 -->
                  </center>
                </span>
              </div>
              <!-- 推特二维码 -->
              <div style="
                float: right;
                overflow:hidden;
                margin-right: 30px;
                margin-bottom: 30px;
              ">
                <div style="width: 130px;height: 130px;">
                  <!-- <img src="@/assets/xlink.png" style="width: 100%;" alt=""> -->
                </div>
                <span style="
                  font-size: 23px;
                  letter-spacing: 3px;
                  display: inline-block;
                  color: #002fa7;font-weight: bold;
                  width: 100%;
                ">
                  <center>
                    <!-- <font-awesome-icon :icon="['fab', 'x-twitter']" /> -->
                  </center>
                </span>
              </div>
            </div>
          </div>
          <!-- <div id="poster" v-if="posterShow"> -->
          <div v-if="posterShow" class="posterImg" @click="closePoster()">
            <center>
              <div class="imgBox">
                <img :src="posterImg" alt="生成的海报" @click.stop="" />
                <p class="saveMsg" style="color: white;">长按图片空白处保存</p>
                <div class="posterBtns setBox">
                  <div class=" flex1 mmhide">
                    <center>
                      <a @click.stop="" :href="posterImg" :download="posterMsg.title+'.png'"
                        style="color: white !important;">
                        <div class="btnItem">
                          <font-awesome-icon :icon="['fas', 'floppy-disk']" />
                        </div>
                      </a>
                    </center>
                  </div>
                  <div class=" flex1">
                    <center>
                      <div class="btnItem">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                      </div>
                    </center>
                  </div>
                </div>
              </div>
            </center>
          </div>
        </div>
      </ClientOnly>
      <div class="mainBuild setBox">
        <div class="mainSection">
          <div class="flashBox" style="margin-top: 10px;">
            <!-- 电脑端头部 -->
            <div class="flashTags">
              <span v-for="item in newsStore.m1.slice(0,12)" class="flashTagsItem"
                :class="{'flashTagsItemActive': newsStore.primaryCategory === item}"
                @click="newsStore.setPrimaryCategory(item);">
                {{item}}
                <div class="tbItem" v-if="newsStore.primaryCategory === item">
                </div>
              </span>
              <font-awesome-icon :icon="['fas', 'arrows-rotate']"
                :class="['refreshBtnPc', { 'fa-spin fast-spin': newsStore.refresh }]" @click="toRefresh" />
              <!-- <el-checkbox v-model="" label="只看重要" class="onipPc custom-checkbox" /> -->
              <!-- <el-button :icon="Search">Search</el-button> -->
              <!-- <el-button key="primary" type="primary" text bg size="small" class="onipPc" @click="copyAll">
                复制全部
              </el-button> -->
              <el-button key="primary" type="primary" text bg size="small" class="onipPc" @click="onlyImportant=!onlyImportant" >
                <span v-if="onlyImportant"><font-awesome-icon :icon="['fas', 'check']" />&nbsp;</span>
                只看重要
              </el-button>
            </div>
            <!-- {{列表}} -->
            <div id="mescroll" class="mescroll">
              <div class="mpd">
                <div v-for="item in list">
                  <div class="flashItem setBox" @click="goDt(item.uniqueCode)">
                    <div class="timeLine  noLine setBox">
                      <div class="bDot">
                        <div class="sDot"></div>
                      </div>
                      <div class="flex1 itemLine"></div>
                    </div>
                    <div class="fmsg flex1">
                      <p class="" style="padding-left: 20px;">
                        <span class="times">{{formatDate(item.publishTime)}}</span>
                        <span style="display: inline-block;width: 5px;"></span>
                        <span class="ftitle" :class="{ ipMsg: item.pushFlag === 'y' }">{{item['title']}}</span>
                      </p>
                      <p class="fmcon" :class="{ ipMsg: item.pushFlag === 'y' }">
                        {{item['detailContent']}}
                        <span style="overflow: hidden;margin-top: 5px;display: block;">
                          <font-awesome-icon :icon="['fas', 'volume-high']" class="flIcon"
                            style="margin-right: 10px !important;" />
                          <font-awesome-icon :icon="['fas', 'image']" class="flIcon" @click.stop="showPoster(item)" />
                          <font-awesome-icon :icon="['fas', 'copy']" class="flIcon"
                            @click.stop="copy(item['title'],item['detailContent'])" />
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <!-- 加载更多 -->
                <!-- -->
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
              <!-- <mobileFooter /> -->
            </div>
          </div>
        </div>
        <ClientOnly>
          <div class="subSection flex1">
            <xListView class="mobileNone" tag="kol" title="热门kol" :isHot="true" />
            <whale class="mobileNone" tag="whale" title="巨鲸动态" :isHot="true"  style="margin-top: 20px;"/>
            <EChartsGauge class="mobileNone" style="margin-top: 20px;" />
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
    import whale from './components/whale.vue';
    import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
    import { _URL } from "@/api/url";
    import { useNewsStore } from '@/stores/news';  //引入状态
    import html2canvas from "html2canvas";
    import QRCode from 'qrcode';
    import { ElLoading } from 'element-plus'
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
    //海报相关
    let posterMsg = ref({});
    let posterShow = ref(false);
    //海报二维码
    const qrData = ref('');
    let posterImg = ref(""); // 存储生成的图片
    const posterRef = ref(null); // 获取 poster 组件的引用
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
  
    const showPoster = async (item) => {
      let url = useRequestURL()
      let domain = url.origin // 获取完整的域名（如 https://example.com）
      console.log(domain);
      // 显示全屏 loading
      const loadingInstance = ElLoading.service({
        fullscreen: true, // 设置为全屏加载
        text: '正在生成海报...', // 显示的提示文本
      });
  
      // 定义一个异步函数来执行生成海报的逻辑
      const generatePoster = async () => {
        posterMsg.value = item;
        const options = { margin: 0 }; // 设置二维码外部的边距为 0
        qrData.value = await QRCode.toDataURL(domain + '/news?code=' + item.uniqueCode, options);
        await nextTick(); // 等待 DOM 更新
  
        if (posterRef.value) {
          html2canvas(posterRef.value, {
            scale: 1, // 提高清晰度，2-3倍比较合适
            useCORS: true, // 允许跨域图片
            backgroundColor: null, // 背景透明
          }).then((canvas) => {
            posterImg.value = canvas.toDataURL("image/png"); // 生成 base64 高清图片
            posterShow.value = true;
            loadingInstance.close(); // 关闭 loading
          });
        }
      };
  
      // 使用 setTimeout 延迟执行异步函数
      setTimeout(async () => {
        await generatePoster();
      }, 166); // 延迟 666 毫秒
    };
  
    //关闭海报
    const closePoster = async (item) => {
      posterShow.value = false;
      qrData.value = '';
      posterImg.value = '';
      posterMsg.value = {}
    }
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
        pushFlag: newsStore.pushFlag
      };
      const { data } = await useAsyncData('news', () =>
        $fetch(_URL.news_list, {
          method: 'GET',
          query: requestData,  // 将参数传递到查询字符串中
        })
      );
      if (data.value) {
        let response = data.value.data.list;
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
    const formatDate = (timestamp: number) => {
      if (!timestamp) return '-'; // 处理无效输入
  
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
        return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
      } else {
        return time.toLocaleString('zh-CN', options);
      }
    };
  
    //处理时间显示，海报中的
    const formatDateImg = (timestamp: number): string => {
      if (!timestamp) return '-'; // 处理无效输入
  
      const time = new Date(timestamp * 1000); // 转换为毫秒级时间戳
  
      // 获取年、月、日、小时、分钟，确保东八区时间
      const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 使用24小时制
      });
  
      // 获取星期
      const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        weekday: 'long'
      });
  
      const formattedDate = dateFormatter.format(time).replace(/\//g, '-'); // 转换成 YYYY-MM-DD 格式
      const weekday = weekdayFormatter.format(time); // 获取星期几
  
      return `${formattedDate} ${weekday}`;
    };
    // // 示例
    // console.log(formatDate(1711507200)); // 2024/03/27 上午08:00 星期三
  
    //跳转到详情页面
    const goDt = (uniqueCode: any) => {
      navigateTo('/news?code=' + uniqueCode);  // 使用router.push进行路由跳转
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
  
      .posterBtns {
        width: 180px;
  
        .btnItem {
          width: 40px;
          height: 40px;
          border: solid 2px white;
          border-radius: 30px;
          margin-top: 20px;
          color: white !important;
          line-height: 37px;
          font-size: 16px !important;
          cursor: pointer;
        }
      }
  
      .posterImg {
        width: 100vw;
        height: 100vh;
        position: fixed;
        left: 0;
        right: 0;
        margin: 0 auto;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.6);
  
        /* .imgBox {
          width: 40vw;
          img {
            width: 100%;
          }
        } */
        .imgBox {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40vw;
            height: auto !important;
            margin-top: 0 !important;
  
            img {
              width: 100%;
              height: auto !important;
            }
          }
      }
  
      .poster {
        width: 1500px;
        z-index: 9999;
        left: 0;
        top: 0px !important;
        background: white;
        word-break: break-word;
        position: fixed;
         left: -2000px;
     
  
        /* scale: 0.5; */
        .pheader {
          height: 280px;
          border: none !important;
          position: relative;
          background: linear-gradient(to bottom,
              #0042b9 0%,
              #0042b9 30%,
              rgba(0, 66, 185, 0.6) 60%,
              rgba(0, 47, 122, 0) 100%);
  
          .fhtit {
            width: 300px;
            margin-top: 80px;
          }
  
          .fhtitle {
            font-size: 66px;
            color: white;
            line-height: 40px !important;
            position: relative;
            top: -6px;
            font-weight: bold;
          }
  
          .headerHlogo {
            width: 50%;
            opacity: 0.3;
            margin-top: 30px;
            margin-left:30px;
          }
          .headerTitle{
     
            margin-top: -30px;
            margin-left: 20px;
            position: absolute;
            left: 0;
            right: 0;
            top:100px
          }
        }
  
        .fhMsg1 {
          text-align: left;
          font-weight: bold;
          font-size: 60px !important;
          padding: 30px;
          margin-top: 30px;
          background: white;
          position: relative;
          top: -32px;
          color: black;
        }
  
        .fhMsg2 {
          padding-left: 30px;
          font-size: 35px !important;
          color: rgb(130, 130, 130);
          margin-top: -35px;
        }
  
        .fhMs3 {
          color: black;
          padding: 30px;
          font-size: 40px;
          line-height: 75px;
        }
      }
  
      .flIcon {
        font-size: 16px;
        color: #bbc7c7;
        float: right;
        margin-right: 30px;
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
        font-size: 15px !important;
        margin-top: 10px !important;
        color: #002fa7;
        cursor: pointer;
      }
  
      .onipPc {
        float: right;
        margin-top: 6px;
        margin-right: 15px;
      }
  
      .ipMsg {
        color: #3a74ce !important;
      }
  
      min-height: calc(100vh - 135px) !important;
  
  
  
  
      .newsItem:first-child {}
  
  
      .flashTags {
        border-bottom: solid 1px #eaedf7;
        margin-bottom: 20px;
        margin-top: -10px;
        padding-bottom: 10px;
  
        .flashTagsItem {
          text-align: center;
          color: rgb(120, 123, 138);
          display: inline-block;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          margin-right: 25px;
  
          .tbItem {
            width: calc(100% - 2px);
            height: 3px;
            border-radius: 10px;
            background: linear-gradient(148deg, #4d83ee, #6898f8 72%, #4b81ed);
            position: absolute;
            left: 0;
            bottom: -10px;
          }
        }
  
        .flashTagsItemActive {
          color: black;
          font-size: 20px;
          font-weight: bold;
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
          padding-bottom: 30px;
  
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
          margin-top: 20px;
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