<template>
  <div class="goodluck">
    <ClientOnly>
      <div class="pics" ref="picsRef">
        <!-- <img src="@/assets/cbtc_g.png" class="picsIcon" alt=""> -->
         <center>
          <span class="picsIcon">
            ${{form.coin}}
           </span>
         </center>
        <div class="picsBuild">
          <div class="picsX" v-if="userDt.name">
            <br>
            <img :src="userDt.profile_image_url" class="xiCon" alt="">
            <!-- <img src="@/assets/laicai.png" class="xiCon" alt=""> -->
            <span class="xName">
              {{userDt.name}}:
               <!-- 凉兮大将军: -->
            </span>
          </div>
          <div style="height: 20px ;" v-if="!userDt.name"></div>
          <div class="picsTitle">
            <!-- <img src="@/assets/laicai.png" class="picsLaicai" alt=""> -->
              我给<span 
              style="
                font-family: sans-serif;
                font-size: 25px;
                font-weight: bold;
                position: relative;
                top:-2px;
              ">
                "${{form.coin}}"
              </span>算了一卦！
          </div>
         
         
          <div class="picsMsg">
            <br>
            {{fdata.coinAndMe}}
            <br>
            总结：{{fdata.talk}}
          </div>
          <div class="picsFooter">
            <div class="ewCode">
              <center>
                <img src="@/assets/xlink.png" class="fimg" alt="">
                <p class="fimgLogo">扫码免费测算</p>
              </center>
            </div>
            <p class="tips">*测算结果仅供娱乐，不作为真实投资建议</p>
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
                  <a @click.stop="" :href="posterImg" :download="'$.png'" style="color: white !important;">
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
              <el-form :model="form" :rules="rules" label-width="auto" class="datas" ref="formRef">
                <el-form-item label="代币名称" prop="coin">
                  <el-input v-model="form.coin" id="search-key-word-input-wrapper" placeholder="请输入感兴趣的代币名称" />
                </el-form-item>
                <el-form-item label="所属公链">
                  <el-select v-model="form.chain" placeholder="请选择代币所属链">
                    <el-option v-for="item in chainList" :label="item" :value="item" />
                  </el-select>
                </el-form-item>

                <!-- <el-form-item label="合约地址">
                  <el-input v-model="form.address" id="search-key-word-input-wrapper" placeholder="输入合约地址测算准确" />
                </el-form-item> -->
                
                <el-form-item label="推特用户名">
                  <el-input v-model="form.username" placeholder="填写后生成专属测算海报" />
                </el-form-item>
                <el-form-item label="农历生日" prop="birth">
    
                  <el-date-picker style="width:100%" v-model="form.birth" type="date"
                    placeholder="选择日期"></el-date-picker>
                </el-form-item>
                <el-form-item label="您的性别">
                  <el-radio-group v-model="form.gender">
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
</template>
<script setup lang="ts">
  //引入汉化语言包


  import { ElMessage } from 'element-plus';
  import mobileFooter from './components/mobileFooter.vue';
  import { reactive } from 'vue';
  import html2canvas from "html2canvas";
  import { ElLoading } from 'element-plus';
  import { _URL } from "@/api/url";
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
      { property: 'og:description', content: '来财 - web3周易测算' },
      // Twitter 标签
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:image', content: `${url.origin}/image/share.png` }
    ]
  });
  //海报相关
  let posterMsg = ref({});
  let posterShow = ref(false);
  let posterImg = ref(""); // 存储生成的图片
  const picsRef = ref(null); // 获取 poster 组件的引用
  const formRef = ref(null);
  let fdata = ref({})
  let userDt= ref({})

  //表单验证规则
  const rules = ref({
    coin: [
      { required: true, message: '代币名称为必填项', trigger: 'blur' }
    ],
    birth: [
      { required: true, message: '生日为必填项', trigger: 'change' }
    ]
  });
  const chainList = ref([
    'Ordinals', 'Runes', 'BTC', 'ETH', 'BSC', 'SOLANA', 'TRON', 'BASE', 'Lightning Network', 'Arbitrum', 'Optimism', 'Linea', 'Polygon', 'Sui', 'Avalanche', '其他EVM生态', '其他BTC生态'
  ])
  //测算信息
  const form = reactive({
    coin: '',
    chain: '',
    username: '',
    birth: '',
    gender: '',
    address:''
  })
  const gooluck = async (item) => {
    
    const valid = await formRef.value?.validate();
    if (valid) {
      const loadingInstance = ElLoading.service({
        fullscreen: true, // 设置为全屏加载
        text: '正在解卦...天地玄黄，宇宙洪荒，卦象推演于冥冥之中。望君耐心等候，莫负这一场天机之约。', // 显示的提示文本
      });
      userDt.value = {}
      try {
       
        // 获取结果
        const data = await $fetch(_URL.doDivination, {
          method: 'POST',
          body: form
        });
        let jData = JSON.parse(data)
        let jtext = extractJsonFromString(jData.result)
        fdata.value = JSON.parse(jtext);
        loadingInstance.setText('此卦已解，正在生成海报...');
        //获取头像用户名
        if(form.username){
          let requestData = {
            username: form.username,
          };
          const user = await  $fetch(_URL.getTweetProfileImageByName, {
            method: 'GET',
            query: requestData,  // 将参数传递到查询字符串中
          })
          // console.log(user)
          // console.log();
          let users =  isJsonString(user)
          if(users){
            userDt.value = users.data;
          }
        
        }
        // getTweetProfileImageByName
        await nextTick(); // 等待 DOM 更新
        html2canvas(picsRef.value, {
          scale: 3, // 提高清晰度，2-3倍比较合适
          useCORS: true, // 允许跨域图片
          backgroundColor: null, // 背景透明
        }).then((canvas) => {
          posterImg.value = canvas.toDataURL("image/png"); // 生成 base64 高清图片
          posterShow.value = true;
          loadingInstance.close(); // 关闭 loading
        });

      } catch (error) {
        console.error('请求出错:', error);
      }
    }


    // 定义一个异步函数来执行生成海报的逻辑
    // const generatePoster = async () => {

    // };
    // // 使用 setTimeout 延迟执行异步函数
    // setTimeout(async () => {
    //   await generatePoster();
    // }, 166); // 延迟 666 毫秒
  };

    // 提取 JSON 字符串的方法
    const extractJsonFromString = (str: string) => {
      const start = str.indexOf('{');
      const end = str.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return str.slice(start, end + 1);
      }
      return null;
    };
    //判断能否转成JSON
    const  isJsonString =(str) => {
          try {
              const json = JSON.parse(str);
              return json;
          } catch (e) {
              return false;
          }
      }
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
    height: 105vh;
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
    --el-input-text-color: #7d0305;
  }

  .el-select {
    --el-text-color: #7d0305;
    --el-input-text-color: #7d0305;
    --el-border-color: #7d0305;
  }

  .pics {
    /* left: -1000px; */
    right: 20px;
    top: 200px;
    width: 450px;
    border: solid 3px white;
    position: fixed;
    background-image: url('@/assets/bg2.jpg');
    background-size: cover;
    overflow: hidden;
    left:-1000px;
    .picsBuild {
      width: calc(100% - 40px);
      margin-left: 20px;
      margin-top: 20px;
      margin-bottom: 20px;
      background-color: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      overflow: hidden;
    }
    .picsFooter{
      overflow: hidden;
      .ewCode{
        width: 70px;
        float: right;
        position: relative;
        left: 5px;
        bottom: 5px;
      }
      .fimg {
        width: 50%;
        position: relative;
        top:5px;
      }

      .fimgLogo {
        opacity: 0.7;
       text-align: center;
       font-size: 7px;
      }
      .tips{
        font-size: 6px;
        position: absolute;
        left: 5px;
        bottom: 3px;
        color: #7d0305;
        opacity: 0.7;
      }
    }
    .picsTitle {
      font-size: 30px;
      font-family: p3;
      
      color: #7d0305;
      overflow: hidden;
      margin-left: 20px;
    }

    .picsX {
      margin-top: -55px;
      font-size: 27px;
      color: #7d0305;
      overflow: hidden;
      .xiCon {
        width: 55px;
        border-radius: 50px;
        border: solid 2px white;
        float: left;
        margin-left: 10px;
        margin-top: 25px;
      }
      .xName{
        margin-top: 30px;
        margin-left: 10px;
        display: inline-block;
        font-weight: bold;
        /* font-family: p3; */
      }
    }

    .picsMsg {
      font-size: 20px;
      word-break: break-all;
      padding: 20px;
      padding-top: 10px;
      line-height: 30px;
      letter-spacing: 1px;
     
      color: #af3d3f;
      margin-top: -30px;
      font-family: p3;
      font-weight:lighter;
    }

    .picsIcon {
      position: absolute;
      top: -30px;
      z-index: -1;
   
      right: 0;
      opacity: 0.2;
      font-family: p3;
      font-size: 80px;
      padding:0;
    }

    .picsLaicai {
      float: left;
      width: 50px;
      position: relative;
      top: -2px
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
      height: 450px;
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
      height: 790px;
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
        top: 0 !important;
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

      .micons {
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
          height: 920px;
          border: none !important;
          padding-top:70px;
          background-color: rgba(255, 255, 255, 0.2);

          .fromBg {
            width: 96%;
            margin-left: 2%;
            height: 450px;
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