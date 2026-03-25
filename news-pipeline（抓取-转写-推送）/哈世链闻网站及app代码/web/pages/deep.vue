<template>
    <div class="news">
        <div class="pinkBgs">
            <img v-for="item in 50" class="mainSectionImg" src="../assets/hlogo6.png" />
        </div>
        <div class="mainBuild  setBox">

            <div class="mainSection mainSectionDeep">
                <!-- <div class="tMsgBox"></div> -->

                <div class="newsItem setBox " v-for="item,index in newsList" @click="goDt(item.uniqueCode)">
                    <div class="flex1  nmsg">
                        <p class="newsTitle">
                            {{item['title']}}
                        </p>
                        <p class="newsMsg">
                            {{item['description']}}
                        </p>
                        <div class="btool ">
                            <span class="tags" v-for="tag in getProcessedTags(item.tags).slice(0,3)"
                                @click="toSearch(tag)">
                                {{tag}}
                            </span>
                            <span class="sendTime ">
                                <font-awesome-icon :icon="['far', 'clock']" /> 
                                
                                <!-- {{formatTime(item['createTime'])}} -->
                                     {{formatDate(item.publishTime).date}}
                        {{formatDate(item.publishTime).time}}
                            </span>
                        </div>
                    </div>
                    <div v-if="item.imgLoaded" class="newsImg" :style="{ backgroundImage: `url(${item.img})` }">
                    </div>

                    <el-skeleton v-else class="newsImg" animated>
                        <template #template>
                            <el-skeleton-item variant="image" style="width: 100%;height: 100%;border-radius: 10px;" />
                        </template>
                    </el-skeleton>


                    <div class="btoolM" style="margin-bottom: 10px;">
                        <span class="tags" v-for="tag in getProcessedTags(item.tags).slice(0,3)" @click="toSearch(tag)">
                            {{tag}}
                        </span>

                        <span class="sendTime ">
                            <font-awesome-icon :icon="['far', 'clock']" /> 
                            
                            <!-- {{formatTime(item['createTime'])}} -->
                                 {{formatDate(item.publishTime).date}}
                        {{formatDate(item.publishTime).time}}
                        </span>
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
    import { ref, onMounted } from 'vue'
    import { useNewsStore } from '@/stores/news';  //引入状态
    import EChartsGauge from './components/EChartsGauge.vue';
    import xListView from './components/xListView.vue';
    import whale from './components/whale.vue';
    import { _URL } from "@/api/url";
    const { $device } = useNuxtApp();
    const isMobile = $device.isMobile;
    const newsStore = useNewsStore();
    const pageNum = ref(1)
    const pageSize = ref(20)
    const loading = ref(false);
    const route = useRoute();
    const router = useRouter();
    // const router = useRouter()  // 获取路由实例
    // // 跳转到新闻快讯页面
    // const toflash = () => {
    //   router.push('/');  // 使用router.push进行路由跳转
    // }
    onMounted(() => {

    });

    //跳转到详情页面
    const goDt = (uniqueCode: any) => {
        //   navigateTo('/deepNews?code=' + uniqueCode);  // 使用router.push进行路由跳转
        window.open('/deepNews?code=' + uniqueCode);  // 使用router.push进行路由跳转
    }
    //加载更多按钮
    const getMore = () => {
        if (!loading.value) {  //使加载过程中点击无效
            pageNum.value++
            loading.value = !loading.value
            getList('push');
        }
    }
    // 搜索
    const toSearch = (val: any) => {
        router.push('/deepsearch?key=' + val);  // 使用router.push进行路由跳转
    }
    //格式化tags
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
    const newsList = ref([])


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
            let response = data.value.data.list;

            // 初始化每一项的 imgLoaded 为 false，并监听图片加载
            response.forEach((item) => {
                item.imgLoaded = false;
                const img = new Image();
                img.src = item.img;
                img.onload = () => {
                    item.imgLoaded = true;
                };
                img.onerror = () => {
                    item.imgLoaded = false;
                };
            });

            // 设置或追加列表
            if (type === 'set') {
                newsList.value = response;
            } else {
                newsList.value.push(...response);
            }

            setTimeout(() => {
                loading.value = false;
                newsStore.setRefresh(false);
            }, 666);

            if (process.client && type === 'set') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            }
        }
    };
 const formatDate = (timestamp) => {

                    if (!timestamp) return { time: '-', date: '' }; // 处理无效输入

                    const now = new Date(); // 当前时间
                    const time = new Date(timestamp * 1000); // 时间戳转换为毫秒

                    // 辅助函数：确保数字为两位数
                    function padZero(num) {
                        return num < 10 ? '0' + num : num;
                    }

                    // 获取时间部分（24小时制）
                    const hours = padZero(time.getHours());
                    const minutes = padZero(time.getMinutes());
                    const formattedTime = `${hours}:${minutes}`;

                    // 判断是否是今天
                    const isToday = now.toDateString() === time.toDateString();

                    if (isToday) {
                        // 今天只显示时间（时:分）
                        return {
                            time: formattedTime,
                            date: ''
                        };
                    } else {
                        // 非今天显示日期（月-日）和时间（时:分）
                        const month = padZero(time.getMonth() + 1);
                        const day = padZero(time.getDate());
                        const formattedDate = `${month}/${day}`;

                        return {
                            time: formattedTime,
                            date: formattedDate
                        };
                    }
                }
    // const getList = async (type: any) => {
    //     let requestData = {
    //         pageNum: pageNum.value,
    //         pageSize: pageSize.value,
    //     };
    //     const { data } = await useAsyncData('news', () =>
    //         $fetch(_URL.articleList, {
    //             method: 'GET',
    //             query: requestData,  // 将参数传递到查询字符串中
    //         })
    //     );
    //     if (data.value) {
    //         let response = data.value.data.list;
    //         type == 'set' ? newsList.value = response : newsList.value.push(...response);
    //         setTimeout(() => {
    //             loading.value = false;
    //             newsStore.setRefresh(false);
    //         }, 666)
    //         if (process.client && type == 'set') {
    //             window.scrollTo({
    //                 top: 0,
    //                 behavior: 'smooth', // 平滑滚动
    //             });
    //         }
    //     }
    // };
    getList('set');


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
                    color: rgb(163, 162, 162);
                    cursor: pointer;
                    font-size: 12px;
                    user-select: none;
                    padding: 2px 3px 2px 3px;
                    border: solid 1px rgb(235, 232, 232);
                    border-radius: 2px;
                    line-height: 15px;
                    margin-left: 10px;
                    position: relative;
                    top: -4px
                }

                .tags:first-child {
                    margin-left: 0px;
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

        .flashItem {
            .timeLine {
                width: 15px;

                .bDot {
                    width: 15px;
                    height: 15px;
                    background: #dde0ff;
                    border-radius: 50%;
                    position: relative;
                    margin-top: 5px;

                    .sDot {
                        width: 7px;
                        height: 7px;
                        background: #3881e1;
                        position: absolute;
                        top: 4px;
                        left: 4px;
                        border-radius: 50%;
                    }
                }

                .itemLine {
                    border-left: 1px dashed #d9d9d9;
                    width: 0px;
                    margin-left: 7px;
                    margin-top: 5px;
                    margin-bottom: 5px;
                }
            }

            .fmsg {
                .times {
                    font-size: 13px;
                    color: #868686 !important;
                    margin-left: 10px;
                }

                .ftitle {
                    font-size: 15px;
                    margin-left: 10px;
                    font-weight: bold;
                }

                .fmcon {
                    display: block;
                    font-size: 13px;
                    text-overflow: ellipsis;
                    color: rgb(100, 100, 100);
                    line-height: 25px;
                    margin-top: 10px;
                    margin-bottom: 30px;
                    margin-left: 10px;
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

        .pinkBgs {
            display: none;
        }

        @media (max-width: 1100px) {
       

            .pinkBgs {
                background: linear-gradient(to bottom right, #f3c7a5, #ec8787);
                width: 1000px;
                height: 1000px;
                position: fixed;
                z-index: -1;
                transform: rotate(45deg);
                margin-left: -260px;
                display: block;
            }

            .mainSection {
                margin-top: 20px;
                background: rgba(255, 255, 255, .95);
                border-radius: 15px;
                padding-left: 13px;
                padding-right: 13px;
                padding-bottom: 30px;
            }

            .mainSectionImg {
                width: 20%;
                opacity: 0.15;
                margin-top: 100px;
                margin-left: 10px;
                float: left;
            }

            .title {
                display: none;
            }

            #hot {
                display: none;
            }

            .flashBox {
                display: none;
            }

            .newsImg {
                width: 100px !important;
                height: 75px !important;
                margin-left: 10px !important;
                border-radius: 5px !important;
                background-size: cover;
                margin-top: 5px;
                float: left;
            }

            .newsTitle {
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                display: -webkit-box !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;


                font-size: 17px;
                font-weight: 500 !important;
                color: #333;
                line-height: 26px;
                display: inline;
                cursor: pointer;
          
            }

             .newsMsg {
                -webkit-line-clamp: 1 !important;
                      color: #898d94 !important;
                margin-top:2px !important;
                font-size: 15px;
            }


            .btool {
                /* border: solid 1px blue;
          width: 100% !important; */
                display: none;
            }

            .newsItem {
                display: block !important;
                overflow: hidden;
                height: auto !important;
                padding-top: 15px;
            }

            .nmsg {
                width: calc(100% - 110px);
                float: left;
            }

            .btoolM {
                width: 100%;
                float: left;
                margin-top: 10px;

                .tags {
                    color: rgb(163, 162, 162);
                    cursor: pointer;
                    font-size: 12px;
                    user-select: none;
                    padding: 2px 3px 2px 3px;
                    border: solid 1px rgb(235, 232, 232);
                    border-radius: 2px;
                    line-height: 15px;
                    margin-left: 10px;
                    position: relative;
                    top: -4px
                }

                .tags:first-child {
                    margin-left: 0px;
                }

                .sendTime {
                    float: right;
                    font-size: 13px;
                       color: rgb(163, 162, 162);
                }

                .writer {
                    float: right;
                    font-size: 14px;
                    color: #868686;
                }
            }
        }

        /* 适配电脑样式 */
        @media (min-width: 1100px) {
            .flashTagsMobile {
                display: none;
            }

            .btoolM {
                display: none;
            }
        }
    }
</style>