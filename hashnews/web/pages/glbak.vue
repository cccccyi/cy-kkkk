<template>
    <div class="goodluck">
      <ClientOnly>
        <div class="pics" ref="picsRef">
          <img src="@/assets/cbtc.png" class="picsIcon" alt="">
          <!-- <img src="@/assets/laicai.png" class="picsLaicai" alt=""> -->
          <div class="picsBuild">
            <div class="picsTitle">
              <img src="@/assets/laicai.png" class="picsLaicai" alt="">
              来财大师说：
            </div>
            <div class="picsX">
              <br>
          
            </div>
            <div class="picsMsg">
              <br>
            
            </div>
            <div class="picsFooter">
           
              <img src="@/assets/posterFooter.png" class="fimgLogo" alt="">
              <img src="@/assets/xlink.png" class="fimg" alt="">
            </div>
          </div>
        </div>
        <div class="posterImg" v-if="posterShow" @click="closePoster()">
          <center>
            <div class="imgBox">
              <img :src="posterImg" alt="生成的海报" @click.stop="" />
              <p class="saveMsg" style="color: white;">长按图片空白处保存</p>
              <div class="posterBtns setBox">
                <div class=" flex1 mmhide">
                  <center>
                    <a @click.stop="" :href="posterImg" :download="'$.png'"
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
      </ClientOnly>
      <img src="@/assets/cbtc.png" class="micons" style="position: absolute;
        width: 200px;
        top:230px;
        left: 150px;
        opacity: 0.5;
        " alt="">
      <div class="mainBuild " style="width:600px;">
        <div class="luckPage">
          <div class="topMsg">
            <span>何为“来财”？</span>
            <br>
            以周易为基，融合财爻卦象，洞察命理与市场的微妙联系，揭示投资的契机与风险。周易定势，财爻点睛，天机已现，一测便知！
          </div>
          <div class="from">
            <div class="fromBg">
              <ClientOnly>
                <center>
                  <span class="ctitle">请输入测算所需信息</span>
                </center>
                <el-form :model="form" label-width="auto" class="datas">
                  <el-form-item label="代币名称">
                    <el-input v-model="form.coin" id="search-key-word-input-wrapper" />
                  </el-form-item>
                  <el-form-item label="合约地址">
                    <el-input v-model="form.address" placeholder="选填" />
                  </el-form-item>
                  <el-form-item label="所属公链">
                    <el-select v-model="form.chain" placeholder="选填">
                      <el-option v-for="item in chainList" :label="item" :value="item" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="twitter账号">
                    <el-input v-model="form.twitter" placeholder="填写后测算结果中有头像哦(@开头)" />
                  </el-form-item>
                  <el-form-item label="您的生日">
                    <el-input v-model="form.birth" />
                  </el-form-item>
                  <el-form-item label="生日类型">
                    <el-radio-group v-model="form.type">
                      <el-radio value="公历生日">公历生日</el-radio>
                      <el-radio value="农历生日">农历生日</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="您的性别">
                    <el-radio-group v-model="form.male">
                      <el-radio value="男">男</el-radio>
                      <el-radio value="女">女</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <div class="subbtn" @click="gooluck()">
                    <center>
                      <span class="subText">
                        提交测算
                      </span>
                    </center>
                  </div>
                </el-form>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
    <mobileFooter/>
  </template>
  <script setup lang="ts">
    import { ElMessage } from 'element-plus'
    import mobileFooter from './components/mobileFooter.vue';
    import { reactive } from 'vue'
    import html2canvas from "html2canvas";
     import { ElLoading } from 'element-plus'
     //配置网页头
    const url = useRequestURL();
    useHead({
      title: '来财 - web3周易测算',
      meta: [
        { name: 'keywords', content: '区块链,算卦,数字币测算,算命,周易,八卦,web3' },
        { name: 'description', content: '来财 - web3周易测算' },
        // Open Graph（OG）标签
        { property: 'og:image', content: `${url.origin}/image/share.png` },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '哈世链闻' },
        { property: 'og:title', content: '来财 - web3周易测算' },
        { property: 'og:description', content: '来财 - web3周易测算'},
        // Twitter 标签
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: `${url.origin}/image/share.png` }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://unpkg.com/mescroll.js@1.4.1/mescroll.min.css' }
      ],
      script: [
        { src: 'https://unpkg.com/mescroll.js@1.4.1/mescroll.min.js', defer: true }
      ]
    });
    //海报相关
    let posterMsg = ref({});
    let posterShow = ref(false);
    let posterImg = ref(""); // 存储生成的图片
    const picsRef = ref(null); // 获取 poster 组件的引用
    // const route = useRoute(); // 获取当前路由对象
    // const key = ref(route.query.key || '');
    // import { _URL } from "@/api/url";
    // do not use same name with ref
    const chainList = ref([
      'Ordinals','Runes','BTC','ETH','BSC','SOLANA','TRON','BASE','Lightning Network','Arbitrum','Optimism','Linea','Polygon','Sui','Avalanche','其他EVM生态','其他BTC生态'
    ])
    const form = reactive({
      coin: '',
      address: '',
      chain: '',
      twitter: '',
      birth:'',
      type: '',
      male: ''
    })
    // const gooluck = () =>{
    //   alert(1);
    // }
    const gooluck = async (item) => {
      // let url = useRequestURL()
      // let domain = url.origin // 获取完整的域名（如 https://example.com）
      // console.log(domain);
      // 显示全屏 loading
      const loadingInstance = ElLoading.service({
        fullscreen: true, // 设置为全屏加载
        text: '正在测算...', // 显示的提示文本
      });
  
      // 定义一个异步函数来执行生成海报的逻辑
      const generatePoster = async () => {
       // posterMsg.value = item;
        // const options = { margin: 0 }; // 设置二维码外部的边距为 0
        // qrData.value = await QRCode.toDataURL(domain + '/news?code=' + item.uniqueCode, options);
      //  await nextTick(); // 等待 DOM 更新
  
       // if (posterRef.value) {
        html2canvas(picsRef.value, {
            scale: 3, // 提高清晰度，2-3倍比较合适
            useCORS: true, // 允许跨域图片
            backgroundColor: null, // 背景透明
          }).then((canvas) => {
            posterImg.value = canvas.toDataURL("image/png"); // 生成 base64 高清图片
            posterShow.value = true;
            loadingInstance.close(); // 关闭 loading
          });
       // }
      };
  
      // 使用 setTimeout 延迟执行异步函数
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
  </script>
  <style lang="scss" scoped>
    .posterImg {
        width: 100vw;
        height: 100vh;
        position: fixed;
        left: 0;
        right: 0;
        margin: 0 auto;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.6);
  
        .imgBox {
          height: 76vh;
          margin-top: 9vh;
  
          img {
            height: 100%;
          }
        }
      }
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
    :deep(.el-form-item__label) {
      color: #7d0305;
      /* 修改为您想要的颜色 */
    }
  
    :deep(.el-radio__label) {
      color: #7d0305;
      /* 修改为您想要的颜色 */
    }
  
    :deep(.el-input) {
      --el-input-border-color: #7d0305;
     --el-input-text-color:#7d0305;
    }
  
    .el-select {
      --el-text-color:#7d0305;
      --el-input-text-color:#7d0305;
      --el-border-color: #7d0305;
    }
    .pics{
      width: 450px;
      border: solid  3px white;
      position: fixed;
      top:-1000px;
      left:-1000px;
      background-image: url('@/assets/bg2.jpg');
      background-size: cover;
      overflow: hidden;
      .picsBuild{
          width: calc(100% - 40px);
          margin-left: 20px;
          margin-top: 20px;
          margin-bottom: 20px;
          background-color: rgba(255,255,255,0.6);
          border-radius: 10px;
          overflow: hidden;
      }
      .picsTitle{
        font-size: 30px;
        font-family: KaiTi;
        padding-top: 10px;
        padding-left: 10px;
        color: #7d0305;
        overflow: hidden;
      }
      .picsX{
        margin-top: -55px;
        padding: 20px;
        font-size: 27px;
        color: #7d0305;
        overflow: hidden;
        
        .xiCon{
          width: 55px;
          border-radius: 50px;
          border: solid 2px white;
          float: left;
          margin-left:10px;
          position: relative;
          top:-5px
        }
      }
      .picsMsg{
        font-size: 17px;
        word-break: break-all;
        padding: 20px;
        padding-top: 0;
        line-height: 30px;
        letter-spacing: 1px;
        color: #7d0305;
        margin-top: -40px;
      }
      .picsIcon{
        position: absolute;
        right: 20px;
        top:20px;
        width: 130px;
        z-index: -1;
        opacity: 0.5;
      }
     
      .picsLaicai{
       float: left;
       width: 50px;
       position: relative;
       top:-2px
      }
      .fimg{
        width: 40px;
        float: right;
        margin-bottom: 20px;
        margin-right: 18px;
        opacity: 0.8;
      }
      .fimgLogo{
        width: 60px;
        opacity: 0.8;
        position: absolute;
        bottom: 30px;
        right: 30px;
      }
    }
    .goodluck {
      .ctitle {
        color: #7d0305;
        font-family: KaiTi;
        position: relative;
        top: -20px;
        font-size: 20px;
      }
  
      .fromBg {
        background-image: url('@/assets/imgBg.webp');
        aspect-ratio: 1 / 1;
        /* 高度自动等于宽度 */
        background-size: 100% 100%;
        /* 拉伸图片以适应宽度和高度 */
        margin-left: 20px;
        margin-right: 20px;
        padding-top: 50px;
        margin-top: 20px;
        position: relative;
        opacity: 0.8;
  
        .datas {
          width: 90%;
          margin-left: 5%;
        }
  
        .subbtn {
          width: 300px;
          position: absolute;
          bottom: 50px;
          left: 0;
          right: 0;
          margin: 0 auto;
          height: 50px;
          background-image: url('@/assets/button.png');
          background-size: cover;
          cursor: pointer;
  
          .subText {
            line-height: 50px;
            font-family: KaiTi;
            font-size: 20px;
            color: #a42123;
            user-select: none;
          }
        }
      }
      .topMsg {
        color: #7d0305;
        font-family: KaiTi;
        font-size: 25px;
        margin: 0 15px 0 15px;
        letter-spacing: -1px;
        padding-top: 20px;
      }
  
      .luckPage {
        width: 100%;
        height: 850px;
        width: 100%;
        border-left: solid 1px #bd4849;
        border-right: solid 1px #bd4849;
        background-color: rgba(255, 255, 255, 0.2);
        margin-top: -20px;
        margin-bottom: -100px;
      }
  
       /* 适配手机样式 */
      @media (max-width: 1100px) {
        
        background-image: url('@/assets/bg2.jpg');
        background-size: cover;
        background-position: -40px center;
       
        margin-bottom: -50px;
        .posterImg {
          .imgBox {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90vw;
            height: auto !important;
            margin-top: 0 !important;
          
            img {
              width: 100%;
              height: auto !important;
            }
          }
        }
        .mmhide {
          display: none !important;
        }
        .micons{
          opacity: 0.2 !important;
        }
        .topMsg {
          color: rgb(77, 8, 8) !important;
          font-size: 23px !important;
        }
  
        .mainBuild {
          width: 100% !important;
          padding: 0 !important;
  
          .luckPage {
            width: 100%;
            margin-bottom: -100px;
            width: 100%;
            border: none !important;
            padding-top: 120px;
            background-color: rgba(255, 255, 255, 0.2);
            .fromBg {
              width: 96%;
              margin-left: 2%;
              height: 550px;
            }
          }
        }
  
      }
  
      /* 适配电脑样式 */
      @media (min-width: 1100px) {
        background-image: url('@/assets/bg2.jpg');
        background-size: cover;
        .flashTagsMobile {
          display: none;
        }
        .saveMsg {
          display: none !important;
        }
      }
    }
  </style>