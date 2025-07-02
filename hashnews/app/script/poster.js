const MyPoster = {
    name: "MyPoster",
    props: {
      posterMsg: {
        type: Object,
        default: () => ({})
      },
      posterShow: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        qrData: '',
        posterImg: '',
        posterRef: null
      };
    },
    methods: {
      async showPoster(item) {
        let url = window.location.origin; // 获取完整的域名
        console.log(url);
  
        // 显示全屏 loading
        const loadingInstance = this.$loading({
          fullscreen: true,
          text: '正在生成海报...',
        });
  
        // 定义一个异步函数来执行生成海报的逻辑
        const generatePoster = async () => {
          this.posterMsg = item;
          const options = { margin: 0 }; // 设置二维码外部的边距为 0
          this.qrData = await this.$qrcode.toDataURL(url + '/news?code=' + item.uniqueCode, options);
          await this.$nextTick(); // 等待 DOM 更新
  
          if (this.posterRef) {
            html2canvas(this.posterRef, {
              scale: 1, // 提高清晰度，2-3倍比较合适
              useCORS: true, // 允许跨域图片
              backgroundColor: null, // 背景透明
            }).then((canvas) => {
              this.posterImg = canvas.toDataURL("image/png"); // 生成 base64 高清图片
              this.posterShow = true;
              loadingInstance.close(); // 关闭 loading
            });
          }
        };
  
        // 使用 setTimeout 延迟执行异步函数
        setTimeout(async () => {
          await generatePoster();
        }, 166); // 延迟 166 毫秒
      },
      closePoster() {
        this.posterShow = false;
        this.qrData = '';
        this.posterImg = '';
        this.posterMsg = {};
      },
      formatDateImg(timestamp) {
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
      }
    },
    template: `
      <div>
        <div v-if="posterShow" class="posterImg" @click="closePoster">
          <center>
            <div class="imgBox">
              <img :src="posterImg" alt="生成的海报" @click.stop="" />
              <p class="saveMsg" style="color: white;">长按图片空白处保存</p>
              <div class="posterBtns setBox">
                <div class="flex1 mmhide">
                  <center>
                    <a @click.stop="" :href="posterImg" :download="posterMsg.title+'.png'" style="color: white !important;">
                      <div class="btnItem">
                        <font-awesome-icon :icon="['fas', 'floppy-disk']" />
                      </div>
                    </a>
                  </center>
                </div>
                <div class="flex1">
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
            <font-awesome-icon :icon="['far', 'clock']" style="font-size: 25px;" />&nbsp;&nbsp;{{formatDateImg(posterMsg.publishTime)}}
          </p>
          <p class="fhMs3">
            {{posterMsg.detailContent}}
          </p>
          <div style="overflow: hidden;position: relative;margin-top: -20px;">
            <div style="overflow:hidden;width: 306px;margin-left: 30px;margin-bottom: 30px;position: absolute;bottom: 5px;right: 20px;">
              <img src="@/assets/posterFooter.png" style="float: left;width: 300px;" alt="">
              <span style="border-top:solid 2px #004ab6;font-size: 23px;width: 330px;letter-spacing: 3px;display: inline-block;margin-top: 10px;color: #004ab6;font-weight: bold;">
                链上新闻，一个哈世就够了
              </span>
            </div>
            <div style="float: right;overflow:hidden;margin-right: 30px;margin-bottom: 30px;">
              <div style="width: 130px;height: 130px;">
                <!-- <img :src="qrData" style="width: 100%;" alt=""> -->
              </div>
              <span style="font-size: 23px;letter-spacing: 3px;display: inline-block;color: #002fa7;font-weight: bold;width: 100%;">
                <center>
                  <!-- 查看原文 -->
                </center>
              </span>
            </div>
            <div style="float: right;overflow:hidden;margin-right: 30px;margin-bottom: 30px;">
              <div style="width: 130px;height: 130px;">
                <!-- <img src="@/assets/xlink.png" style="width: 100%;" alt=""> -->
              </div>
              <span style="font-size: 23px;letter-spacing: 3px;display: inline-block;color: #002fa7;font-weight: bold;width: 100%;">
                <center>
                  <!-- <font-awesome-icon :icon="['fab', 'x-twitter']" /> -->
                </center>
              </span>
            </div>
          </div>
        </div>
      </div>
    `,
    style: `
      .posterBtns {
        width: 180px;
      }
      .posterBtns .btnItem {
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
      .posterImg {
        width: 100vw;
        height: 100vh;
        position: fixed;
        left: 0;
        right: 0;
        margin: 0 auto;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.6);
      }
      .posterImg .imgBox {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30vw;
        height: auto !important;
        margin-top: 0 !important;
      }
      .posterImg .imgBox img {
        width: 100%;
        height: auto !important;
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
      }
      .poster .pheader {
        height: 280px;
        border: none !important;
        position: relative;
        background: linear-gradient(to bottom, #0