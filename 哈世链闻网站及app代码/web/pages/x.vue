<template>
    <ClientOnly>
  <div class="xDt">
    <div class="mainBuild setBox">
      <div class="mainSection ">
        <div class="ndTitle">
          <!-- {{newsDt.fullText}} -->
          <!-- <div class="tIcon">

          </div> -->
        
          <span class="userName">{{splitString(newsDt['fullText']).title}}</span>
        </div>
        <p style="overflow: hidden;" class="inpam">

          <span class="ndTime">
            <font-awesome-icon :icon="['far', 'clock']" /> &nbsp;{{formatDate(newsDt.createdAt)}}
          </span>
        </p>
      


          <p class="ndMsg">{{ splitString(newsDt['fullText']).content }}</p>
         
           <center>
  <img v-for="imgUrl,index in getIarr(newsDt.mediaUrlHttpsJson)" :src="imgUrl" class="ttImg" style="width: 96%;margin-top: 20px;" alt="">
           </center>
         
            
            
          
        <!-- <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts.png" class="tts tl" alt="">
        <img @click.stop="playAudio(newsDt['sounds'])" v-if="newsDt['sounds']" src="@/assets/tts_dark.png" style="display: none;" class="tts tdrk" alt=""> -->
      
          <div>
            <!-- <font-awesome-icon :icon="['fas', 'volume-high']" class="flIcon" style="margin-right: 10px !important;" />
            <font-awesome-icon :icon="['fas', 'image']" class="flIcon"  /> -->
            <font-awesome-icon :icon="['fas', 'copy']" class="flIcon"
                @click.stop="copy(splitString(newsDt['fullText']).title+'\n'+splitString(newsDt['fullText']).content,'')" />
          </div>
       

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
  </ClientOnly>
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
  const newsDt = ref()
  const news = ref < any > ({})
  const router = useRouter()  // 获取路由实例  
  const type = router.currentRoute.value.query.t

  const copy = (val) => {
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
          // const urlRegex = /(https?:\/\/[^\s<]+)/g;
          // content = content.replace(urlRegex, (url) => {
          //   // 创建一个包含点击事件的链接元素，防止事件穿透
          //   return `<a href="#" onclick="event.stopPropagation(); openUrl('${url}'); return false;">${url}</a>`;
          // });


          // 返回JSON对象
          return { title, content };
        };
  //加载数据方法
  const { data } = await useAsyncData('xDt', () =>
    $fetch(_URL.tweet + "/" + router.currentRoute.value.query.tid, {
      method: 'GET'
    })
  );
  if (data.value) {
    let response = data.value.data;
   // console.log(JSON.stringify(response))


    newsDt.value = response;

       
    //配置网页头
    console.log(response.title)
    const url = useRequestURL();
    useHead({ 
      title: splitString(response['fullText']).content.substring(0.50) + '...',
      meta: [
        { name: 'keywords', content: 'hashnews 哈世链闻' },
        { name: 'description', content: splitString(response['fullText']).content.substring(0.50) + '...' },
        // Open Graph（OG）标签
        { property: 'og:image', content: `${url.origin}/image/share.png` },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'hashnews' },
        { property: 'og:title', content:splitString(response['fullText']).content.substring(0.50) + '...' },
        { property: 'og:description', content: splitString(response['fullText']).content.substring(0.50) + '...' },
        // Twitter 标签
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: `${url.origin}/image/share.png` }
      ]
    });
  }
   
        const getIarr =(val)=>{
          if(val){
            return JSON.parse(val)
          } else {
            return []
          }
        }
  //加载更多
  const getMore = () => {
     window.close();
  // if (process.client && window.history.length > 1) {
  //   window.history.back();
  // } else {
  //   navigateTo('/');
  // }
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
      font-size: 16px;
      color: #bbc7c7;
      float: right;
      margin-right: 0px;
      cursor: pointer;
      margin-top: 30px;
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
