<template>
  <div>
    <p class="title">
      &nbsp; &nbsp; &nbsp;
    </p>
    <div class="hot">
      <!-- <ClientOnly> -->
        <!-- <swiper-container 
          v-if="xList.length>10" 
          ref="containerRef" 
          direction="vertical" 
          :mousewheel="true"
          slidesPerView="auto"
          :freeMode="true"
          style="height:870px;margin-top:-10px;position: relative;bottom:-1px" 
        >
          <swiper-slide style="height: auto !important;">
           
          </swiper-slide>
        </swiper-container> -->
        <div  v-for="item,index in xList" class="newsItem setBox " @click="goDt(item.tweetId)" style="border: none !important;">
          <div class="timeLine  noLine setBox">
            <div class="bDot">
              <div class="sDot"></div>
            </div>
            <div class="flex1 itemLine"></div>
          </div>
          <div class="flex1" style="padding:0px 0 10px 0;">
            <div class="newsTitle">
              <span class="cctime">{{formatDate(item.createdAt)}}</span>
             <!-- <div class="xIcon" :style="{ backgroundImage: `url(${item['profilePicture'] || './image/1.png'})` }">
              </div> -->
              <span class="xName">{{splitString(item['fullText']).title}}</span> 
            </div>
            <p class="newsMsg" v-html="splitString(item['fullText']).content">
            
            </p>
            <!-- <img :src="item['mediaUrlHttps']"  class="ttImg" alt=""> -->
            <div v-if="item.mediaUrlHttpsJson.length == 1">
              <img :src="item.mediaUrlHttpsJson[0]" class="ttImg" alt="">
            </div>
            <div v-if="item.mediaUrlHttpsJson.length > 1" style="overflow: hidden;width:93%" >
              <div  v-for="imgUrl,index in item.mediaUrlHttpsJson"
                class=" imgItem" :style="{ backgroundImage: 'url(' + imgUrl + ')' }" style="background-size: cover;">
              </div>
            </div>
            <p class="timeW">
             
              <span class="toX" >
                  <font-awesome-icon :icon="['fas', 'copy']" class="flIcon " @click.stop="copy(splitString(item['fullText']).title+'\n'+splitString(item['fullText']).content)" />
              </span>
            </p>
          </div>
        </div>
      <!-- </ClientOnly> -->
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
    console.log(val);
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
      
        const newList = res.data.list
        newList.forEach(item => {
              if (item.mediaUrlHttpsJson) {
                try {
                  item.mediaUrlHttpsJson = JSON.parse(item.mediaUrlHttpsJson);
                } catch (e) {
                  console.warn('JSON 解析失败:', item.mediaUrlHttpsJson, e);
                  item.mediaUrlHttpsJson = [];
                }
              } else {
                item.mediaUrlHttpsJson = [];
              }
            });
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
    window.open('x?tid=' + tid+'&t=whale');  // 使用router.push进行路由跳转
  }
    const splitString = (input) => {
          // 检查输入是否为字符串
          if (typeof input !== 'string') {
            return { error: '输入必须是字符串' };
          }

          // 查找分隔符的位置
          const separatorIndex = input.indexOf('<->');

          // 如果找不到分隔符，返回错误
          if (separatorIndex === -1) {
            return { error: '未找到分隔符 "<->"', fullText: input };
          }

          // 分割字符串为标题和内容
          let title = input.substring(0, separatorIndex).trim();
          let content = input.substring(separatorIndex + 3).trim();

          // 替换连续的换行符为单个换行符
          title = title.replace(/\n{2,}/g, '\n');
          content = content.replace(/\n{2,}/g, '\n');

          // 识别链接并添加点击事件，防止事件穿透
          const urlRegex = /(https?:\/\/[^\s<]+)/g;
          content = content.replace(urlRegex, (url) => {
            // 创建一个包含点击事件的链接元素，防止事件穿透
            return `<a href="#" onclick="event.stopPropagation(); openUrl('${url}'); return false;">${url}</a>`;
          });

          // 返回JSON对象
          return { title, content };
        };
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
    .imgItem {
      aspect-ratio: 1 / 1;
      float: left;
      width: 32%;
      margin-left: 2%;
      margin-top: 8px;
    }

    .imgItem:nth-child(3n + 1) {
      margin-left: 0 !important;
    }
    .flIcon {
     font-size: 15px;
      color: #ccd8d8;
      float: right;
      margin-right: 30px;
    }
  .timeLine {
    width: 30px;
    margin-left: 3px;
    .bDot {
      width: 17px;
      height: 17px;
      background: #dde0ff;
      border-radius: 50%;
      position: relative;
      margin-top: 5px;

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
      margin-left: 8px;
      margin-top: 5px;
      margin-bottom: 5px;
    }
  }

  .hot {
    /* border: solid 1px #efeeee; */
    /* padding: 0 15px 0 15px; */
    border-radius: 10px;
    margin-top: 10px;
    overflow: hidden;
    min-height: 300px;
    padding-top: 10px;
    width: 94%;
    margin-left: 3%;
  }

  .newsItem {
    position: relative;
    .ttImg{
      width: 93%;
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
      bottom: 30px;
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
        float: left;
        margin-top: -1px;
        margin-right: 10px;
        color: #002fa7;
        font-weight: bold;
        font-size: 15px;
        width: 38px;
        position: relative;
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
          font-size: 17px;
          font-weight: 500;
          position: relative;
          top: -1px

      }
    }

    .newsMsg {
      font-size: 14px;
      text-overflow: ellipsis;
      color: rgb(100, 100, 100);
      line-height: 25px;
      cursor: pointer;
      margin-bottom: 10px;
      margin-top: 2px;
      white-space: pre-wrap;
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
      margin-top: 40px;
      margin-bottom:5px;
overflow: hidden;
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