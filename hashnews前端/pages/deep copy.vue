<template>
    <div class="news">
        <div class="mainBuild setBox">
            <div class="mainSection">
                <div class="newsItem setBox " v-for="(item, index) in newsList" :key="index" @click="goDt(item.uniqueCode)">
                    <div class="flex1 nmsg">
                        <p class="newsTitle">
                            {{ item['title'] }}
                        </p>
                        <p class="newsMsg">
                            {{ item['description'] }}
                        </p>
                        <div class="btool">
                            <span class="tags" v-for="tag in getProcessedTags(item.tags).slice(0, 3)" @click="toSearch(tag)">
                                {{ tag }}
                            </span>
                            <span class="sendTime">
                                <font-awesome-icon :icon="['far', 'clock']" /> {{ formatTime(item['createTime']) }}
                            </span>
                        </div>
                    </div>

                    <!-- 骨架屏 -->
                    <el-skeleton v-if="!item.loaded" class="newsImg" animated>
                        <template #template>
                            <el-skeleton-item variant="image" style="width: 100%; height: 100%; border-radius: 10px;" />
                        </template>
                    </el-skeleton>

                    <!-- 图片加载完成后显示背景图 -->
                    <div v-if="item.loaded" class="newsImg" :style="{ backgroundImage: `url(${item.img})` }"></div>

                    <div class="btoolM" style="margin-bottom: 10px;">
                        <span class="tags" v-for="tag in getProcessedTags(item.tags).slice(0, 3)" @click="toSearch(tag)">
                            {{ tag }}
                        </span>
                        <span class="sendTime">
                            <font-awesome-icon :icon="['far', 'clock']" /> {{ formatTime(item['createTime']) }}
                        </span>
                    </div>
                </div>

                <ClientOnly>
                    <div class="getMore" @click="getMore">
                        <span v-if="!loading">加载更多</span>
                        <span v-if="loading"><div class="loader"></div></span>
                    </div>
                </ClientOnly>
            </div>

            <ClientOnly>
                <div class="subSection flex1 mobileNone" v-if="!isMobile">
                    <xListView tag="kol" title="热门kol" :isHot="true" />
                    <whale tag="whale" title="巨鲸动态" :isHot="true" style="margin-top: 30px;" />
                    <EChartsGauge style="margin-top: 30px;" />
                </div>
            </ClientOnly>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNewsStore } from '@/stores/news';  //引入状态
import EChartsGauge from './components/EChartsGauge.vue';
import xListView from './components/xListView.vue';
import whale from './components/whale.vue';
import { _URL } from "@/api/url";
const { $device } = useNuxtApp();
const isMobile = $device.isMobile;
const newsStore = useNewsStore();
const pageNum = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const newsList = ref([]);

// 图片加载完成后触发
const loadImageForItem = (item, index) => {
  const img = new Image();
  img.onload = () => {
    // 图片加载完成后设置loaded状态
    newsList.value[index].loaded = true;
  };
  img.onerror = () => {
    console.error('图片加载失败:', item.img);
  };
  img.src = item.img;
};

const getList = async (type: any) => {
  let requestData = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  };

  const { data } = await useAsyncData('news', () =>
    $fetch(_URL.articleList, {
      method: 'GET',
      query: requestData,
    })
  );

  if (data.value) {
    let response = data.value.data.list.map(item => ({
      ...item,
      loaded: false,  // 初始化为 false，表示图片尚未加载
    }));

    type == 'set' ? newsList.value = response : newsList.value.push(...response);

    // 加载图片
    response.forEach((item, index) => loadImageForItem(item, index));

    setTimeout(() => {
      loading.value = false;
      newsStore.setRefresh(false);
    }, 666);

    if (process.client && type == 'set') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }
};
getList('set');

// 跳转到详情页面
const goDt = (uniqueCode: any) => {
  navigateTo('/deepNews?code=' + uniqueCode);
};

// 加载更多按钮
const getMore = () => {
  if (!loading.value) {
    pageNum.value++;
    loading.value = true;
    getList('push');
  }
};

// 搜索
const toSearch = (val: any) => {
  router.push('/deepsearch?key=' + val);
};

// 格式化 tags
const getProcessedTags = (tagsString) => {
  return tagsString.split(/[ ,、]/).filter(tag => tag);
};

// 格式化时间
const formatTime = (isoTime) => {
  const date = new Date(isoTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};
</script>
<style lang="scss" scoped>
    .news {
        min-height: calc(100vh - 135px);
    
        .getMore {
            cursor: pointer;
            width: 98%;
            margin-top: 50px !important;
            height: 50px;
            margin: 0px auto;
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
    
        .newsItem {
            border-bottom: 1px solid #efeeee;
            height: 180px;
            position: relative;
            padding-top: 20px;
    
            .newsTitle {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                line-height: 26px;
                display: inline;
                cursor: pointer;
            }
    
            .newsImg {
                width: 200px;
                height: 130px;
                margin-left: 30px;
                border-radius: 10px;
                background-size: cover;
                margin-top: 5px;
            }
    
            .newsMsg {
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                display: -webkit-box;
                overflow: hidden;
                text-overflow: ellipsis;
                color: rgb(100, 100, 100);
                line-height: 25px;
                margin-top: 10px;
            }
    
            .btool {
                position: absolute;
                bottom: 20px;
                width: calc(100% - 230px);
    
                .tags {
                    color: #999;
                    margin-right: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    position: relative;
                    top: -3px;
                    user-select: none;
                    padding: 1px 3px 1px 3px;
                    border: solid 1px rgb(200, 200, 200);
                    border-radius: 2px;
                }
    
                .sendTime {
                    float: right;
                    font-size: 14px;
                    color: #868686;
                }
            }
        }
    
        .flashBox {
            margin-top: 10px;
            border-bottom: solid 1px #e1e0e0;
            padding-bottom: 10px;
        }
    }
    </style>
    