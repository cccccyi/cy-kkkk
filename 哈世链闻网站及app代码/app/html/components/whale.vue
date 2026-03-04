<template>
  <div>
    <p class="mhTitle">
      {{title}}
    </p>
    <div class="hot">
      <ClientOnly>
        <swiper-container 
          v-if="xList.length>10" 
          ref="containerRef" 
          direction="vertical" 
          :mousewheel="true"
          slidesPerView="auto"
          :freeMode="true"
          style="height:870px;margin-top:-10px;position: relative;bottom:-1px" 
        >
          <swiper-slide style="height: auto !important;">
               <div  v-for="item,index in xList" class="newsItem setBox " @click="goDt(item.tweetId)" style="border: none !important;">
              <div class="timeLine  noLine setBox">
                <div class="bDot">
                  <div class="sDot"></div>
                </div>
                <div class="flex1 itemLine"></div>
              </div>
              <div class="flex1" style="padding:0px 0 30px 0;">
                <div class="newsTitle">
                  <span class="cctime">{{formatDate(item.createdAt)}}</span>
                  <div class="xIcon" :style="{ backgroundImage: `url(${item['profilePicture'] || './image/1.png'})` }">
                  </div>
                  <span class="xName">{{item['name']}}</span>
                </div>
                <p class="newsMsg" :class="{ 'hideLine': !item.open }">
                  {{item['fullText']}}
                </p>
                <img :src="item['mediaUrlHttps']" v-if="item.open" class="ttImg" alt="">
                <p class="timeW">
                  <el-tag size="small" style="position: relative;top:-1px;left:-3px">
                    <span class="xsitems">
                      <font-awesome-icon :icon="['fas', 'chart-simple']" />
                        {{ item.views >= 1000 ? (item.views / 1000).toFixed(1) + 'K' : item.views }}
                      </span>
                      <span class="xsitems">
                        <font-awesome-icon :icon="['far', 'comment-dots']" />
                        {{item.replyCount}}
                      </span>
                      <span class="xsitems">
                        <font-awesome-icon :icon="['fas', 'retweet']" />
                        {{item.retweetCount}}
                      </span>
                      <span class="xsitems">
                        <font-awesome-icon :icon="['far', 'heart']" />
                        {{item.favoriteCount}}
                      </span>
                  </el-tag>
                  <span class="toX" @click="openLink(item.original_link)">
                    
                    <!-- <font-awesome-icon :icon="['far', 'folder-open']" /> -->
                    <!-- <font-awesome-icon :icon="['far', 'folder-closed']" /> -->
                     <span class="toolBar" @click.stop="item['open']=!item['open']" v-if="!item['open']">
                      <font-awesome-icon :icon="['far', 'folder-closed']" />
                      <span class="open">展开</span>
                     </span>
                     <span class="toolBar" @click.stop="item['open']=!item['open']" v-if="item['open']">
                      <font-awesome-icon :icon="['far', 'folder-open']" />
                      <span class="open">收起</span>
                     </span>
                     <span class="toolBar"  @click.stop="copy(item['fullText'])" >
                      <font-awesome-icon class="micon" :icon="['far', 'copy']" />
                      <span class="open">复制</span>
                    </span>
                    
                  </span>
                </p>
              </div>
            </div>
          </swiper-slide>
        </swiper-container>
      </ClientOnly>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
  import { _URL } from "@/api/url";
  import { ElMessage } from 'element-plus'
  const xList = ref < any > ([])
  let intervalId = null; // 存放定时器 ID

  // 接收父组件传递的 `val` 和 `status`
  const props = defineProps({
    title: String,  // 当前数值
    tag: String, // 状态（如“极度恐惧”、“贪婪”）
    isHot: Boolean
  });
  onMounted(() => {
    getXlist()
    intervalId = setInterval(getXlist, 60000); // 每 60秒调用一次

  });
  // 页面销毁或跳转时清除定时器
  onBeforeUnmount(() => {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('定时器已清除');
    }
  });
  const copy = (val) => {

    navigator.clipboard.writeText('哈世链闻消息：' + val).then(res => {
      //getNotification('消息', '复制成功', 'success')
      ElMessage({
        message: '复制成功',
        type: 'success',
      })

    }).catch(error => {

    })
  }



  // 获取热门推特数据
  const getXlist = async () => {
    try {
      let requestData = {
        pageNum: 1,
        pageSize: 88,
        tag: props.tag != 'all' ? props.tag : ''
      };
      const res = await $fetch(_URL.tweetList, {
        method: 'GET',
        query: requestData,  // 将参数传递到查询字符串中
      });
      if (res?.data) {
        const newList = res.data.list.map(item => ({ ...item, open: false }));
        xList.value = newList;
        // xList.value = res.data.list
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  //跳转到详情页面
  const goDt = (tid: any) => {
    //  navigateTo('newsx?uid=' + uid+'&tid='+tid);  // 使用router.push进行路由跳转
    navigateTo('x?tid=' + tid+'&t=whale');  // 使用router.push进行路由跳转
  }
  // 定义格式化日期的方法
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
</script>
<style lang="scss" scoped>
  .timeLine {
    width: 30px;
    .bDot {
      width: 20px;
      height: 20px;
      background: #dde0ff;
      border-radius: 50%;
      position: relative;
      margin-top: 5px;

      .sDot {
        width: 8px;
        height: 8px;
        background: #3881e1;
        position: absolute;
        top: 6px;
        left: 6px;
        border-radius: 50%;
      }
    }
    .itemLine {
      border-left: 1px dashed #d9d9d9;
      width: 0px;
      margin-left: 10px;
      margin-top: 5px;
      margin-bottom: 5px;
    }
  }

  .hot {
    /* border: solid 1px #efeeee; */
    /* padding: 0 15px 0 15px; */
    /* border-radius: 10px; */
    margin-top: 18px;
    overflow: hidden;
    min-height: 300px;
    padding-top: 10px;
  }

  .newsItem {
    position: relative;
    .ttImg{
      width: 100%;
    }
    .toolBar{
      float: right;
      margin-right: 20px;
    }
    .open{
      font-size: 11px;
      position: relative;
      top:-1px;
      left: 2px;
    }
    .toX {
      float: right;
      color: #5d7ac3 !important;
      cursor: pointer;
      position: absolute;
      width: 200px;
      right: -18px;
      bottom: 40px;
    }

    .newsTitle {
      width: 100%;
      font-size: 15px;
      color: #333;
      line-height: 26px;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      .cctime {
        font-size: 15px;
        float: left;
      }

      .xIcon {
        width: 18px;
        height: 18px;
        float: left;
        background-size: cover;
        border-radius: 10px;
        margin-left: 10px;
        position: relative;
        top: 5px
      }

      .xName {
        font-size: 15px;
        float: left;
        margin-left: 5px;
      }
    }

    .newsMsg {
      font-size: 13px;
      text-overflow: ellipsis;
      color: rgb(100, 100, 100);
      line-height: 25px;
      cursor: pointer;
    }

    .hideLine{
      display: -webkit-box;
      overflow: hidden;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }

    .timeW {
      font-size: 13px;
      color: #868686;
      margin-top: 5px;
      margin-bottom: 10px;

      .xsitems {
        display: inline-block;
        margin-left: 10px;
      }
      .xsitems:first-child{
        margin-left: 0px;
      }
    }
  }
</style>