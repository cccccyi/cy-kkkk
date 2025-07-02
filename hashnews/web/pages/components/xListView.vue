<template>
  <div>
    <p class="mhTitle">
      {{title}}
      <!-- <span style="font-size:20px;">🔥</span> -->
    </p>
    <div class="hot">
      <ClientOnly>
        <swiper-container v-if="xList.length>10" ref="containerRef" direction="vertical"  :mousewheel="true" slidesPerView="3" :autoplay="{ 
                delay: 3800, 
                disableOnInteraction: false,
                pauseOnMouseEnter: true  // 鼠标悬停时暂停滚动
              }" style="height:400px;margin-top:-10px;position: relative;bottom:-1px" :loop="true" :freeMode="true">
          <swiper-slide v-for="item,index in xList">
            <div class="newsItem setBox " @click="goDt(item.tweetId)">
              <div class="flex1">
                <div class="newsTitle">
                  <div class="xIcon" :style="{ backgroundImage: `url(${item['profilePicture'] || './image/1.png'})` }">
                  </div>
                  <span>{{item['name']}}</span>

                  <span class="cctime" >
                    {{formatDate(item.createdAt)}}
                  </span>
                </div>
                <p class="newsMsg">
                  {{item['fullText']}}
                </p>
                <p class="timeW">
                  <el-tag size="small" style="position: relative;top:-1px">
                    <font-awesome-icon :icon="['fas', 'chart-simple']" />
                    {{ item.views >= 1000 ? (item.views / 1000).toFixed(1) + 'K' : item.views }}
                  </el-tag>
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
                  <span class="toX" @click="openLink(item.original_link)">
                    <font-awesome-icon @click.stop="copy(item['fullText'])" class="micon" :icon="['far', 'copy']" />

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
  // 接收父组件传递的 `val` 和 `status`
  const props = defineProps({
    title: String,  // 当前数值
    tag: String, // 状态（如“极度恐惧”、“贪婪”）
    isHot: Boolean
  });
  onMounted(() => {
    getXlist()
  });
  const copy = (val) =>{
     console.log(val);
      navigator.clipboard.writeText(val).then(res => {
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
        pageSize: 50,
        tag: props.tag != 'all' ? props.tag : ''
      };
      const res = await $fetch(_URL.tweetList, {
        method: 'GET',
        query: requestData,  // 将参数传递到查询字符串中
      });
      if (res?.data) {
        // console.log(JSON.stringify(res.data));
        xList.value = res.data.list
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  //跳转到详情页面
  const goDt = (tid: any) => {
    //  navigateTo('newsx?uid=' + uid+'&tid='+tid);  // 使用router.push进行路由跳转
    window.open('x_kol?tid=' + tid+'&t=x');  // 使用router.push进行路由跳转
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

    // if (isToday) {
    //  return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
    // } else {
    return time.toLocaleString('zh-CN', options);
    // }
  };
</script>
<style lang="scss" scoped>
  
  .cctime{
    font-size: 13px;
      color: #868686;
      float: right;
      margin-right: 5px;
      margin-top: -2px;
  }
  .hot {
    padding: 0 5px 0 5px;
    border-radius: 10px;
    margin-top: 10px;
    overflow: hidden;
    min-height: 300px;
  }

  .newsItem {
    border-bottom: 1px solid #f5f2f2;
    position: relative;
    padding-top: 20px;

    .toX {
      float: right;
      color: #375cba !important;
      cursor: pointer;
    }

    .newsTitle {
      font-size: 15px;
      color: #333;
      line-height: 26px;
      display: inline;
      cursor: pointer;
      position: relative;

      span {
        margin-left: 30px;
        position: relative;
        top: -1px
      }

      .xIcon {
        width: 25px;
        height: 25px;
        display: inline-block;
        position: absolute;
        border-radius: 20px;
        background-size: cover;
      }
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
      cursor: pointer;
    }

    .timeW {
      font-size: 13px;
      color: #868686;
      margin-top: 5px;
      margin-bottom: 10px;

      .xsitems {
        display: inline-block;
        margin-left: 20px;
      }
    }
  }
</style>