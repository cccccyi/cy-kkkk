<template>
  <div class="newDt">
    <div class="mainBuild setBox">
      <div class="mHeader">
        <span class="flashTagsItem" :class="{'flashTagsItemActive': nowTab == 1}" @click="nowTab=1">
          巨鲸动态
        </span>
        <span class="flashTagsItem" :class="{'flashTagsItemActive': nowTab == 2}" @click="nowTab=2">
          热门kol
        </span>
        <span class="flashTagsItem" :class="{'flashTagsItemActive': nowTab == 3}" @click="nowTab=3">
          指数
        </span>
        <span class="flashTagsItem" :class="{'flashTagsItemActive': nowTab == 4}" @click="nowTab=4">
          来财
        </span>
      </div>
      <div class="mainSection ">
        <ClientOnly>
          <whale_m  tag="whale" title="巨鲸动态" :isHot="true"  style="margin-top: 16px;" v-if="nowTab==1"/>
          <kol_m  tag="kol" title="热门kol" :isHot="true"  style="margin-top: 20px;" v-if="nowTab==2"/>
          <EChartsGauge_m  style="margin-top: 20px;" v-if="nowTab==3"/>
          <goodluck v-if="nowTab==4" />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import mobileFooter from './components/mobileFooter.vue';
  import { _URL } from "@/api/url";
  import EChartsGauge_m from './components/EChartsGauge.vue';
  import whale_m from './components/mobile/whale_m.vue';
  import kol_m from './components/mobile/kol_m.vue';
  import goodluck from './goodluck.vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  let nowTab = ref<number>(1);

  const saveTabToStorage = () => {
    if (process.client) {
      localStorage.setItem('nowTab', nowTab.value.toString());
    }
  };

  onBeforeUnmount(() => {
    saveTabToStorage();
  });

  onMounted(() => {
    if (process.client) {
      const storedTab = localStorage.getItem('nowTab');
      if (storedTab) {
        nowTab.value = parseInt(storedTab);
      }
    }
  });

  const { $device } = useNuxtApp();
  const isMobile = $device.isMobile;
  const newsDt = ref({})
  const news = ref < any > ({})
</script>
<style lang="scss" scoped>
  .newDt {
    .mHeader{
      position: fixed;
      background: white;
      width: 100%;
      top: 60px;
      left: 0;
      padding-left: 15px;
      z-index: 999;
      margin-bottom: 20px;
      box-shadow: 0 0px 3px 0 #e6e7ea;
      .flashTagsItem:first-child{
        margin-left: 0;
      }
      .flashTagsItem {
        -webkit-tap-highlight-color: transparent;
        /* 适用于iOS和Chrome */
        outline: none;
        /* 去除点击时的轮廓 */
        box-shadow: none;
        /* 去除点击时的阴影 */
        font-size: 17px;
        color: #999;
        height: 45px;
        line-height: 45px;
        display: inline-block;
        text-decoration: none;
        margin-left: 15px;
      }
      .flashTagsItemActive {
        line-height: 42px;
        font-size: 20px;
        color: black;
        font-weight: bold;
        border-bottom: solid 2px #2e61e0;
        span{
          font-size: 23px !important;
        }
      }
      .onip {
        float: right;
        margin-top: 11px;
        margin-right: 10px;
      }
    }
    .flIcon {
      font-size: 16px;
      color: #bbc7c7;
      float: right;
      margin-right: 30px;
      cursor: pointer;
    }

    .copy {
      font-size: 20px;
      color: #a3a2a2;
      cursor: pointer;
      float: right;
      margin-bottom: 30px;
    }

    .tts {
      width: 20px;
      position: relative;
      top: 4px;
      left: 3px;
    }

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
      float: right;
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
      .mainBuild{
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
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