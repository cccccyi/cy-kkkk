<template>
  <div class="xDt">
    <div class="mainBuild setBox">
      <div class="mainSection ">
        <div class="ndTitle">
          <!-- {{newsDt.fullText}} -->
          <!-- <div class="tIcon">

          </div> -->
          <div class="tIcon" :style="{ backgroundImage: `url(${newsDt['profilePicture'] || './image/1.png'})` }"></div>
          <span class="userName">{{newsDt['name']}}</span>
        </div>
        <p style="overflow: hidden;" class="inpam">

          <span class="ndTime">
            <font-awesome-icon :icon="['far', 'clock']" /> &nbsp;{{formatDate(newsDt.createdAt)}}


            <el-tag size="small" style="position: relative;top:-1px;margin-left: 20px;">
              <font-awesome-icon :icon="['fas', 'chart-simple']" />
              {{ newsDt.views >= 1000 ? (newsDt.views / 1000).toFixed(1) + 'K' : newsDt.views }}
            </el-tag>
            <span class="xsitems">
              <font-awesome-icon :icon="['far', 'comment-dots']" />
              {{newsDt.replyCount}}
            </span>
            <span class="xsitems">
              <font-awesome-icon :icon="['fas', 'retweet']" />
              {{newsDt.retweetCount}}
            </span>
            <span class="xsitems">
              <font-awesome-icon :icon="['far', 'heart']" />
              {{newsDt.favoriteCount}}
            </span>

          </span>
        </p>
        <p class="ndMsg">
          {{newsDt.fullText}}
          <img v-if="newsDt.mediaUrlHttps" class="mediaUrlHttps" :src="newsDt.mediaUrlHttps" alt="">
        </p>
        <!-- <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts.png" class="tts tl" alt="">
        <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts_dark.png" style="display: none;" class="tts tdrk" alt=""> -->
        <ClientOnly>
          <div>
            <!-- <font-awesome-icon :icon="['fas', 'volume-high']" class="flIcon" style="margin-right: 10px !important;" />
            <font-awesome-icon :icon="['fas', 'image']" class="flIcon"  /> -->
            <font-awesome-icon :icon="['fas', 'copy']" class="flIcon"
              @click="copy(newsDt['title'],newsDt['detailContent'])" />
          </div>
        </ClientOnly>

        <div class="getMore" @click="getMore">
          返回
        </div>
      </div>
      <ClientOnly>
        <div class="subSection flex1 mobileNone" v-if="type=='whale'&&!isMobile">
          <whale tag="whale" title="巨鲸动态" :isHot="false" />
          <xListView class="mt" tag="kol" title="热门kol" :isHot="true" style="margin-top: 20px;" />
          <EChartsGauge style="margin-top: 20px;" />
        </div>
        <div class="subSection flex1 mobileNone" v-if="type=='x'&&!isMobile">
          <xListView class="mt" tag="kol" title="热门kol" :isHot="true" />
          <whale tag="whale" title="巨鲸动态" :isHot="false" style="margin-top: 20px;" />
          <EChartsGauge style="margin-top: 20px;" />
        </div>
      </ClientOnly>
    </div>
    <!-- <mobileFooter /> -->
  </div>
</template>
<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import mobileFooter from './components/mobileFooter.vue';
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import { _URL } from "@/api/url";
  import EChartsGauge from './components/EChartsGauge.vue';
  import xListView from './components/xListView.vue';
  import whale from './components/whale.vue';
  const { $device } = useNuxtApp();
  const isMobile = $device.isMobile;
  const newsDt = ref({})
  const news = ref < any > ({})
  const router = useRouter()  // 获取路由实例  
  const type = router.currentRoute.value.query.t

  const copy = () => {

    navigator.clipboard.writeText('哈世链闻消息：' + newsDt.value.fullText).then(res => {
      //getNotification('消息', '复制成功', 'success')
      ElMessage({
        message: '复制成功',
        type: 'success',
      })

    }).catch(error => {

    })
  }
  //加载数据方法
  const { data } = await useAsyncData('xDt', () =>
    $fetch(_URL.tweet + "/" + router.currentRoute.value.query.tid, {
      method: 'GET'
    })
  );
  if (data.value) {
    let response = data.value.data;
    // console.log(response)
    newsDt.value = response;
    //配置网页头
    console.log(response.title)
    const url = useRequestURL();
    useHead({
      title: response.fullText.substring(0.50) + '...',
      meta: [
        { name: 'keywords', content: 'hashnews 哈世链闻' },
        { name: 'description', content: response.fullText.substring(0.50) + '...' },
        // Open Graph（OG）标签
        { property: 'og:image', content: `${url.origin}/image/share.png` },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'hashnews' },
        { property: 'og:title', content: response.fullText.substring(0.50) + '...' },
        { property: 'og:description', content: response.fullText.substring(0.50) + '...' },
        // Twitter 标签
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: `${url.origin}/image/share.png` }
      ]
    });
  }
  //加载更多
  const getMore = () => {
  if (process.client && window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo('/');
  }
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

    // if (isToday) {
    //  return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
    // } else {
    return time.toLocaleString('zh-CN', options);
    // }
  };


</script>
<style lang="scss" scoped>
  .xDt {
    .flIcon {
      font-size: 16px;
      color: #bbc7c7;
      float: right;
      margin-right: 0px;
      cursor: pointer;
    }

    .copy {
      font-size: 20px;
      color: #a3a2a2;
      cursor: pointer;
      float: right;
      margin-bottom: 30px;
    }

    .mediaUrlHttps {
      width: 100%;
      margin-left: 0;
      margin-top: 30px;
    }

    .xsitems {
      display: inline-block;
      margin-left: 20px;
    }

    .inpam {
      margin-top: -20px;
      margin-left: 5px;
    }

    .tIcon {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      float: left;
    }

    .userName {
      position: relative;
      top: -5px;
      left: 10px;
    }

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
      margin-top: 150px !important;
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
      float: left;
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
      .mt {
        margin-top: 20px;
      }

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