<template>
  <div class="deepsearch">
    <!-- 这里是海报 -->
    <poster ref="posterRef"/>
    <div class="mainBuild " style="width: 888px;">
      <div class="deepsearchBuild setBox">
        <input type="text" v-model="key" name=""  id="" class="flex1 dsInput" placeholder="搜索感兴趣的内容" @keyup.enter="search">
        <span class="doSearch" @click="search">
          <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        </span>
      </div>
      <div class="hotWord">
      </div>
      <div style="height: 15px;"></div>
      <center>
        <div class="loader" style="position: relative;top:-11px" v-if="loading"></div>
      </center>
      <center>
         <div v-if="list.length==0&&end">
           <el-empty description="暂无数据" />
         </div>
      </center>
      <div class="flashItem setBox" v-for="item in list"  @click="goDt(item.uniqueCode)">
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

          <p class="fmcon">
            {{item['detailContent']}}
            <span style="overflow: hidden;margin-top: 5px;display: block;">
              <!-- <font-awesome-icon :icon="['fas', 'volume-high']" class="flIcon"
                style="margin-right: 10px !important;" /> -->
              <font-awesome-icon :icon="['fas', 'image']" class="flIcon" @click.stop="showPoster(item)" style="margin-right:5px !important;"/>
              <font-awesome-icon :icon="['fas', 'copy']" class="flIcon"
                @click.stop="copy(item['title'],item['detailContent'])" />
            </span>
          </p>
        </div>
      </div>
      <ClientOnly>
        <div class="getMore"  v-if="list.length>0&&end">
          <span v-if="!loading">
            没有更多了
          </span>
        </div>
        <div class="getMore" @click="getMore" v-if="list.length>0&&!end">
          <span v-if="!loading">
            加载更多
          </span>
          <span v-if="loading">
            <div class="loader"></div>
          </span>
        </div>
      </ClientOnly>
    </div>
    <mobileFooter />
  </div>
</template>
<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import mobileFooter from './components/mobileFooter.vue';
  import { ref } from 'vue'
  const route = useRoute(); // 获取当前路由对象
  const key = ref(route.query.key || '');
  import { _URL } from "@/api/url";
  //海报相关的
  import poster from './components/poster.vue';
  const posterRef = ref(null)
  //显示海报
  const showPoster = (item)=>{posterRef.value?.showPoster(item)}
  const list = ref < any > ([])
  const pageNum = ref(1)
  const pageSize = ref(20)
  const loading = ref(true);
  let end = ref(false);
 
  //跳转到详情页面
  const goDt = (uniqueCode: any) => {
    navigateTo('/news?code=' + uniqueCode);  // 使用router.push进行路由跳转
  }
  const search = () =>{
    if (!loading.value) {  //使加载过程中点击无效
      end.value = false;
      loading.value = !loading.value
      list.value = []
      pageNum.value = 1;
      getList('set');
    }
  }
  const copy = (title, val) => {
    navigator.clipboard.writeText('【' + title + '】' + val).then(res => {
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
      keyword: key.value
    };
    const { data } = await useAsyncData('news', () =>
      $fetch(_URL.news_list, {
        method: 'GET',
        query: requestData,  // 将参数传递到查询字符串中
      })
    );
    if (data.value) {
      let response = data.value.data.list;
      if(response.length==0){
        end.value = true;
      }
      //    console.log(response)
      type == 'set' ? list.value = response : list.value.push(...response);
      setTimeout(() => {
        loading.value = false;

      }, 188)
      if (process.client && type == 'set') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth', // 平滑滚动
        });
      }
    }
  };
  getList('set');

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
</script>
<style lang="scss" scoped>
  .deepsearch {
    min-height: calc(100vh - 135px);
    .flIcon {
      font-size: 16px;
      color: #bbc7c7;
      float: right;
      margin-right: 30px;
    }
    .getMore {
      cursor: pointer;
      width: 97%;
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
    .deepsearchBuild {
      width: 888px;
      border: solid 2px #002fa7;
      margin: 0 auto;
      height: 50px;
      border-radius: 10px;

      .dsInput {
        border: 0;
        outline: none;
        border-radius: 10px;
        padding-left: 20px;
        font-size: 20px;
      }

      .doSearch {
        width: 100px;
        background: #002fa7;
        display: inline-block;
        border-radius: 0 7px 7px 0;
        color: white;
        font-size: 20px;
        line-height: 45px;
        text-align: center;
        cursor: pointer;
      }
    }

    .hotWord {
      width: 888px;
      margin: 0 auto;
      padding-left: 2px;
      margin-top: 15px;

      .tags {
        color: #999;
        margin-right: 20px;
        cursor: pointer;
        color: #4065f6;
        font-size: 14px;
      }
    }

    .stitlt {
      margin-top: 10px;
      color: #9195a3;
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
    @media (max-width: 1100px) {
      .deepsearchBuild {
        margin-top: 35px;
      }

      .tags {
        margin-right: 10px !important;
      }

      .mainBuild {
        width: 100% !important;

      }

      .mainBuild {
        padding-top: 20px;
      }

      .deepsearchBuild {
        width: 100% !important;

      }

      .doSearch {
        width: 70px !important;
      }

      .hotWord {
        width: 100% !important;
      }

      .toFrom {
        display: block;
        width: 100%;
        margin-top: 10px;
      }

      /* .title{
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
      } */

    }

    /* 适配电脑样式 */
    @media (min-width: 1100px) {
      .flashTagsMobile {
        display: none;
      }
    }
  }
</style>