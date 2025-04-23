<template>
  <ClientOnly>
    <header>
      <img class="logo" src="@/assets/hlogo6.png" @click="toPage('/')" />
      <nav class="nav">
        <!-- {{route.path}} -->
        <NuxtLink to="/" class="navItem" :class="{'navActive': route.path === '/'}">快讯</NuxtLink>
        <NuxtLink to="/deep" class="navItem" :class="{'navActive': route.path === '/deep'}">深度</NuxtLink>
        <NuxtLink to="/whale" class="navItem" :class="{'navActive': route.path === '/whale'}">巨鲸监控</NuxtLink>
        <NuxtLink to="/goodluck" class="navItem" :class="{'navActive': route.path === '/goodluck'}">
          <span style="font-family: p3;font-size: 20px ;">
            <i>
              来财
            </i>
          </span>
          <span style="font-size:20px;position: absolute;margin-left: 5px;">🔥</span>
        </NuxtLink>
      </nav>
      <font-awesome :icon="['fas', 'times']" class="menuIcon mit" @click="toggleMenu" v-if="showMenu" />
      <!-- <el-switch :active-icon="Moon" :inactive-icon="Sunny" v-model="isDark" inline-prompt class="tctrl"
        style=" --el-switch-off-color: rgba(255,255,255,0.3)" /> -->
     
        <span class="iconfont icon-yueliangxingxing iconItem" v-if="!isDark" @click="isDark=!isDark"></span>
        <span class="iconfont icon-taiyang iconItem" v-if="isDark" @click="isDark=!isDark" style="font-size: 21px;"></span>
      <div class="pcCtrl">
      
        <!-- <font-awesome class="iconItem" :icon="['far', 'circle-user']" style="font-size: 21px;margin-top: 19px;" />
        <font-awesome class="iconItem" :icon="['fas', 'mobile-screen-button']" />
        <font-awesome class="iconItem" :icon="['fas', 'earth-americas']" /> -->
        <div class="searchBox setBox">
          <input placeholder="搜索" v-model="key" type="text" class="flex1 searchInput" @keyup.enter="toSearch">
          <font-awesome class="searchBtn" :icon="['fas', 'magnifying-glass']" @click="toSearch" />
        </div>
      </div>
      <!-- 新增的遮罩层菜单 -->
    </header>
    <!-- <div class="flashTagsMobile">
      <el-dropdown ref="dropdown1" trigger="contextmenu" class="menuItem" size="large">
        <span @click="toPageBar('/')" class="flashTagsItem" :class="{'flashTagsItemActive':route.path === '/'}">
          快讯
          <font-awesome :icon="['fas', 'caret-down']" class="cicons" :class="{'rotate': menuopen}" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item class="nnitem" v-for="item in newsStore.m1.slice(0,8)"
              style="height: 40px;padding:10px 30px 10px 30px;font-size: 17px;color: rgb(160,160,160);"
              @click="setType1(item)">
              <font v-if="newsStore.primaryCategory == item" class="sedItem">
                {{item}}
              </font>
              <font v-if="newsStore.primaryCategory != item">
                {{item}}
              </font>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown ref="dropdown2" trigger="contextmenu" class="menuItem">
        <span @click="toPageBar('/whale')" class="flashTagsItem" :class="{'flashTagsItemActive':route.path === '/whale'}">
          巨鲸
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in newsStore.m2">{{item}}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown ref="dropdown3" trigger="contextmenu" class="menuItem">
        <span @click="toPageBar('/goodluck')" class="flashTagsItem"
          :class="{'flashTagsItemActive':route.path === '/goodluck'}">
          <span style="font-family: p3;font-size: 20px ;">
            <i>
              来财
            </i>
          </span>
          <span style="font-size:20px;position: absolute;margin-left: 5px;">🔥</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in newsStore.m3">{{item}}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button v-if="route.path === '/'" key="primary" type="primary" text bg size="small" class="onip" @click="onlyImportant=!onlyImportant">
        <span v-if="onlyImportant"><font-awesome-icon :icon="['fas', 'check']" />&nbsp;</span>
        只看重要
      </el-button>
    </div>  -->
  </ClientOnly>
  <NuxtPage :key="$route.fullPath" class="rt" />
  <ClientOnly>
    <div class="mFooter setBox" v-if="shouldShowFooter">
      <NuxtLink to="/" class="flex1 mfItem" :class="{'mfActive': route.path === '/'}">
        <span class="iconfont icon-shandian mfIcon"></span>
        <span class="mfTitle">快讯</span>
      </NuxtLink>
      <NuxtLink to="/deep" class="flex1 mfItem" :class="{'mfActive': route.path === '/deep'}">
        <span class="iconfont icon-wenzhang mfIcon"></span>
        <span class="mfTitle">深度</span>
      </NuxtLink>
      <NuxtLink to="/whale" class="flex1 mfItem" :class="{'mfActive': route.path === '/whale'}">
        <span class="iconfont icon-jujing mfIcon"></span>
        <span class="mfTitle">巨鲸监控</span>
      </NuxtLink>
      <NuxtLink to="/newsin" class="flex1 mfItem" :class="{'mfActive': route.path === '/newsin'}">
        <span class="iconfont icon-huanqiu mfIcon" style="font-size: 28px;top:-7px"></span>
        <span class="mfTitle">链闻汇聚</span>
      </NuxtLink>
    </div>
    <footer>

      <div class="fm">
        <img alt="Vue logo" class="logoW" src="@/assets/logob2.png" />
        <div class="icons">
          <a href=" https://x.com/HashNewsHK" target="_blank">
            <font-awesome :icon="['fab', 'x-twitter']" />
          </a>
        </div>
        <div class="icons">
          <a href="https://t.me/HashNewsHK" target="_blank">
            <font-awesome :icon="['fas', 'paper-plane']" style="position: relative;left:-1px" />
          </a>
        </div>
        <!-- <div class="icons">
          <font-awesome :icon="['fas', 'envelope']" />
        </div> -->
        <span class="domain">
          hashnews.pro@2025
        </span>
      </div>
    </footer>
  </ClientOnly>
</template>
<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { Sunny, Moon, } from '@element-plus/icons-vue'
  // import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
  // import { NuxtLink, NuxtPage,useRoute, useRouter } from '#imports';
  import { useDark } from "@vueuse/core";
  //import request from "@/utils/request"; // 引入封装的 Axios 实例
  import { _URL } from "@/api/url";
  import { ElDropdown } from 'element-plus';
  import { useNewsStore } from '@/stores/news';  //引入状态
  const { $device } = useNuxtApp();
  const isMobile = $device.isMobile;
  useHead({
    link: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" }
    ]
  });
  const homePath = ['/', '/whale', '/goodluck','/newsin','/deep']
  const shouldShowFooter = computed(() => {
    return homePath.includes(route.path);
  });
  const newsStore = useNewsStore();
  const isDark = useDark();

  // const isDark = useDark({
  //   initialValue: true // 强制默认值为暗黑模式
  // });

  const route = useRoute(); // 获取当前的路由对象
  const router = useRouter(); // 获取当前的路由对象
  const menuopen = ref(false) //手机端菜单是否处于打开状态
  let key = ref('')
  const showMenu = ref(false) // 控制菜单显示状态
  const onlyImportant = ref(newsStore.pushFlag === 'y');

  watch(onlyImportant, (newVal, oldVal) => {
    if (newVal) {
      newsStore.setPushFlag('y');
    } else {
      newsStore.setPushFlag('');
    }
  });
  const { data } = await useFetch(
    _URL.news_category_statistic,
    { server: false } // 确保只在客户端执行
  );
  if (data.value) {
    let response = data.value.data
    //alert(222)
    const needData = ['全部'];
    response.forEach((item) => {
      if (item.category) { // 确保 category 不为 null
        needData.push(item.category);
      }
    });
    console.log(needData);
    newsStore.setM1(needData); // 更新 Pinia store
  }
  //刷新
  const toRefresh = () => {
    if (!newsStore.refresh) {  //使加载过程中点击无效
      //要刷新了，广播出去
      newsStore.setRefresh(true);
    }
  }
  // 切换菜单显示状态
  const toggleMenu = () => {
    showMenu.value = !showMenu.value
  }
  // 搜索
  const toSearch = () => {
    navigateTo('/deepsearch?key=' + key.value);
  }
  //跳转页面
  const toPage = (val: any) => {
    navigateTo(val);
  }
  //设置菜单1选中项
  const setType1 = (val: any) => {
    menuopen.value = false  //设置完了之后菜单就关了，恢复一下状态
    newsStore.setPrimaryCategory(val);
  }
  const dropdown1 = ref < InstanceType < typeof ElDropdown >> ();
  const dropdown2 = ref < InstanceType < typeof ElDropdown >> ();
  const dropdown3 = ref < InstanceType < typeof ElDropdown >> ();
  watch(() => route.path, () => {
    menuopen.value = false;
  });

  onMounted(async () => {
    try {
      const res = await $fetch(_URL.news_category_statistic);
      console.log(res);
      if (res?.data) {
        const needData = ['全部'];
        res.data.forEach((item) => {
          if (item.category) { // 确保 category 不为 null
            needData.push(item.category);
          }
        });
        console.log(needData);
        newsStore.setM1(needData); // 更新 Pinia store
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  });
  // onMounted(async () => {
  //   const { data, error } = await useFetch(_URL.news_category_statistic);
  //   console.log(data.value); // 检查是否有数据
  // });
  // let response = res.data._rawValue.data
  // const needData = ['全部'];
  // console.log(JSON.stringify(res));
  // newsStore.setM1(needData.); // 更新 Pinia store
  // newsStore.m1 = res.data.value; // 把数据存入 newsStore.m1
  // try {
  //   const { data } = await useAsyncData('news-category', () =>
  //     $fetch(_URL.news_category_statistic, { server: false })
  //   );
  //   if (data.value) {
  //     let response = data.value.data
  //     //alert(222)
  //     const needData = ['全部'];
  //     response.forEach((item) => {
  //       if (item.category) { // 确保 category 不为 null
  //         needData.push(item.category);
  //       }
  //     });
  //     console.log(needData);
  //     newsStore.setM1(needData); // 更新 Pinia store
  //   }
  // } catch (err) {
  //   console.error('Error fetching data:', err);
  // }

  //跳转页面
  const toPageBar = (val: string) => {
    if (route.path !== val) {
      navigateTo(val);
    } else {
      const dropdownMap = {
        '/': dropdown1,
        '/news': dropdown2,
        '/deepsearch': dropdown3,
      };
      const dropdown = dropdownMap[val];
      const menuItems = val === '/' ? newsStore.m1 : val === '/news' ? newsStore.m2 : newsStore.m3;
      // alert(dropdown.value);
      // alert(menuItems.length);
      console.log(menuItems);
      if (dropdown.value && menuItems.length > 0) {

        if (menuopen.value) {
          dropdown.value.handleClose(); // 关闭菜单
        } else {
          dropdown.value.handleOpen(); // 打开菜单
        }
        menuopen.value = !menuopen.value;
      }
    }
  };
</script>
<style lang="scss" scoped>
  .rt {
    margin-top: 0 !important;
  }

  header {
   
    position: fixed;
    z-index: 2000 !important;
    top: 0;
    left: 0;
    /* background: white; */
    background: #0438bc;
    user-select: none;
    width: 100%;
    height: 60px;

    /* box-shadow: 0 1px 2px 0 #e6e7ea; */
    .searchBox {
      width: 198px;
      height: 32px;
      /* background-color: #eeeef6; */
      /* background-color: rgba(255, 255, 255, 0.95); */
      background: rgba(255,255,255,0.3);
      border: 1px solid rgba(255,255,255,0.3);
      /* border-radius: 88px; */
      border-radius: 4px;
      float: right;
      margin-top: 14px;
      margin-right: 30px;
     
    }

    .searchBtn {
      width: 35px;
      margin-top: 7px;
      font-size: 16px;
      /* color: rgb(104, 118, 164); */
      color: rgba(255,255,255,0.6);
      cursor: pointer;
    }

    .searchInput {
      height: 100%;
      outline: none;
      border: none;
      background-color: transparent;
      color: white;
      font-weight: 600;
      width: 0;
      padding-left: 15px;
    }
      /* 设置 placeholder 颜色 */
    .searchInput::placeholder {
      color: rgba(255,255,255,0.6);
    }

    /* 兼容 Firefox */
    .searchInput:-moz-placeholder {
      color: rgba(255,255,255,0.6);
    }

    /* 兼容 Chrome, Safari, Opera */
    .searchInput::-webkit-input-placeholder {
      color: rgba(255,255,255,0.6);
    }

    /* 兼容 Internet Explorer 10+ */
    .searchInput:-ms-input-placeholder {
      color: rgba(255,255,255,0.6);
    }

    .logo {
      height: 20px;
      margin-top: 20px;
      margin-left: 25px;
      float: left;
    }

    .tctrl {
      float: right;
      margin-top: 15px;
      margin-right: 15px;
    }

    .iconItem {
      display: inline-block;
      float: right;
      width: 25px;
      font-size: 23px;
      /* 根据需要调整大小 */
      line-height: 24px;
      /* 确保line-height与字体大小相同 */
      margin-right: 30px;
      margin-top: 17px;
      color: rgb(255, 255, 255);
      cursor: pointer;
    }
  }

  footer {
    width: 100%;
    background-color: #002fa7;
    height: 135px;

    .fm {
      width: 1300px;
      margin: 0 auto;
      overflow: hidden;

      .logoW {
        height: 40px;
        float: left;
        margin-top: 42px;
      }

      .icons {
        width: 35px;
        height: 35px;
        float: left;
        margin-top: 50px;
        background: white;
        margin-left: 60px;
        border-radius: 50%;
        cursor: pointer;
        color: #072144;
        font-size: 16px;
        line-height: 35px;
        text-align: center;
        cursor: pointer;

        a {
          color: #072144;
        }
      }

      .domain {
        float: right;
        color: white;
        margin-top: 55px;
        cursor: pointer;
        user-select: none;
        margin-right: 10px;
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .nav {
    float: left;
    line-height: 60px;
    margin-left: 15px;

    .navItem {
      display: block;
      float: left;
      text-align: center;
      font-size: 16px;
      cursor: pointer;
      color: #afbee6;
      text-decoration: none;
      font-weight: 600;
      margin-left: 50px;
    }

    .navActive {
      color: white;
    }
  }

  .mobile-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: 70%;
    height: 100vh;
    background: rgba(4, 56, 188, 0.95);
    transition: right 0.3s ease-in-out;
    z-index: 9998 !important;

    &.show {
      right: 0;
    }

    .menu-content {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .close-icon {
      color: white;
      font-size: 24px;
      align-self: flex-end;
      cursor: pointer;
      margin-bottom: 30px;
    }

    .mobile-nav-item {
      color: white;
      font-size: 18px;
      text-decoration: none;
      padding: 15px 0;
      font-weight: 500;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        color: #afbee6;
      }
    }

  }

  /* 适配手机样式 */
  @media (max-width:1100px) {
    footer {
      display: none;
    }
    .iconItem {
      margin-right: 10px !important;
      margin-top: 18px !important;
    }
    .mFooter {
      display: '';
      height: 55px;
      position: fixed;
      z-index: 11000;
      bottom: 0;
      left: 0;
      width: 100%;
      background: white;
      box-shadow: 0 0px 3px 0 #e6e7ea;

      .mfActive {
        span {
          color: #002fa7;
          font-weight: bold;
        }
      }

      .mfItem {
        text-align: center;
        color: #a4b2b8;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        /* 适用于iOS和Chrome */
        outline: none;
        /* 去除点击时的轮廓 */
        box-shadow: none;
        /* 去除点击时的阴影 */
        text-decoration: none;

        .mfIcon {
          position: absolute;
          left: 0;
          right: 0;
          margin: 0 auto;
          font-size:23px;
          top:-3px
        }
        .mfTitle {
          position: absolute;
          left: 0;
          right: 0;
          margin: 0 auto;
          bottom: 5px;
          font-size:13px
        }
      }
    }

    .fast-spin {
      animation: fa-spin 0.5s linear infinite !important;
    }

    .refreshBtn {
      float: right;
      font-size: 15px !important;
      margin-top: 14px !important;
      margin-right: 17px !important;
      color: #002fa7;
      -webkit-tap-highlight-color: transparent;
      /* 适用于iOS和Chrome */
      outline: none;
      /* 去除点击时的轮廓 */
      box-shadow: none;
      /* 去除点击时的阴影 */
    }

    .mit {
      display: inline-block;
      width: 30px;
    }

    .sedItem {
      color: black !important;
      font-weight: bold;
    }

    .onip {
      float: right;
      margin-top: 11px;
      margin-right: 10px;
    }

    .nav {
      display: none;
    }

    .pcCtrl {
      display: none;
    }

    .tctrl {
      margin-right: 17px !important;
    }

    .menuIcon {
      color: white;
      float: right;
      font-size: 22px;
      margin-right: 20px;
      margin-top: 20px;
      opacity: 0.8;
    }

    .logoW {
      margin-left: 20px;
    }

    .icons {
      margin-left: 35px !important;
    }

    .logo {
      height: 17px !important;
      margin-top: 22px !important;
      margin-left: 20px !important;
      float: left;
    }

    .menuIcon {
      cursor: pointer;
    }

    .flashTagsMobile {
      position: fixed;
      background: white;
      width: 100%;
      top: 60px;
      left: 0;
      padding-left: 15px;
      z-index: 999;
      margin-bottom: 20px;
      box-shadow: 0 0px 3px 0 #e6e7ea;

      .cicons {
        font-size: 14px !important;
        position: relative;
        top: -2px;
        transition: transform 0.3s ease-in-out;
      }

      .rotate {
        transform: rotate(-180deg);
      }

      .menuItem {
        height: 45px !important;
        line-height: 45px !important;
        margin-left: 20px;
      }

      .menuItem:first-child {

        margin-left: 5px;
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
        display: inline-block;
        text-decoration: none;
      }



      .flashTagsItemActive {
        line-height: 42px;
        font-size: 20px;
        color: black;
        font-weight: bold;
        border-bottom: solid 2px #2e61e0;

        span {
          font-size: 23px !important;
        }
      }

      .refreshBtn {
        float: right;
        font-size: 17px;
        margin-top: 14px;
        margin-right: 15px;
        color: #002fa7;
      }
    }
  }

  /* 适配电脑样式 */
  @media (min-width:1100px) {
    .mFooter {
      display: none;
    }

    .menuIcon {
      display: none;
    }

    .flashTagsMobile {
      display: none;
    }

  }
</style>