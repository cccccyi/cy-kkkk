<template>
    <div>
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
    </div>
</template>
<script setup lang="ts">
    import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
    import { _URL } from "@/api/url";
    import { ElMessage } from 'element-plus'
    import html2canvas from "html2canvas";
    import QRCode from 'qrcode';
  import { ElLoading } from 'element-plus'
    //海报相关
    let posterMsg = ref({});
    let posterShow = ref(false);
    //海报二维码
    const qrData = ref('');
    let posterImg = ref(""); // 存储生成的图片
    const posterRef = ref(null); // 获取 poster 组件的引用

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
        //使用 setTimeout 延迟执行异步函数
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
    defineExpose({
        showPoster
    })
</script>
<style lang="scss" scoped>
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
          width: 30vw;
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
          margin-top: 58px;
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


 /* 适配手机样式 */
 @media (max-width: 1100px) {
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

     
    }
</style>