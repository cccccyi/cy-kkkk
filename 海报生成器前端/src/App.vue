<template>
  <header style="display: none;">
    <!-- <img class="logo" src="@/assets/logo.png" @click="tohome" /> -->
    <img class="logo" src="@/assets/hlogo6.png" @click="toPage('/')" />
    <nav class="nav">
      <RouterLink to="/" class="navItem" :class="{'navActive': route.path === '/'}">快讯</RouterLink>
      <RouterLink to="/news" class="navItem" :class="{'navActive': route.path === '/news'}">要闻</RouterLink>
      <RouterLink to="/deepsearch" class="navItem" :class="{'navActive': route.path === '/deepsearch'}"
        style="margin-left:20px;">DeepSearch</RouterLink>
      <!-- <RouterLink to="/newsfocus" class="navItem" :class="{'navActive': route.path === '/newsfocus'}" style="margin-left: 30px;">专题</RouterLink> -->
    </nav>
    <!-- <font-awesome-icon
      :icon="['fas', 'bars']"
      class="menuIcon mit"
      @click="toggleMenu"
      v-if="!showMenu"
    /> -->
    <font-awesome-icon :icon="['fas', 'times']" class="menuIcon mit" @click="toggleMenu" v-if="showMenu" />
    <el-switch :active-icon="Moon" :inactive-icon="Sunny" v-model="isDark" inline-prompt class="tctrl"
      style=" --el-switch-off-color: rgba(255,255,255,0.3)" />
    <div class="pcCtrl">
      <font-awesome-icon class="iconItem" :icon="['far', 'circle-user']" style="font-size: 21px;margin-top: 19px;" />
      <font-awesome-icon class="iconItem" :icon="['fas', 'mobile-screen-button']" />
      <font-awesome-icon class="iconItem" :icon="['fas', 'earth-americas']" />
      <div class="searchBox setBox">
        <input v-model="key" type="text" class="flex1 searchInput" @keyup.enter="toSearch">
        <font-awesome-icon class="searchBtn" :icon="['fas', 'magnifying-glass']" @click="toSearch" />
      </div>
    </div>
    <!-- 新增的遮罩层菜单 -->
  </header>
  <div class="flashTagsMobile">
    <el-dropdown ref="dropdown1" trigger="contextmenu" class="menuItem" size="large">
      <span @click="toPageBar('/')" class="flashTagsItem" :class="{'flashTagsItemActive':route.path === '/'}">
        快讯
        <font-awesome-icon :icon="['fas', 'caret-down']" class="cicons" :class="{'rotate': menuopen}" />
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
      <span @click="toPageBar('/news')" class="flashTagsItem" :class="{'flashTagsItemActive':route.path === '/news'}">
        要闻
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="item in newsStore.m2">{{item}}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-dropdown ref="dropdown3" trigger="contextmenu" class="menuItem">
      <span @click="toPageBar('/deepsearch')" class="flashTagsItem"
        :class="{'flashTagsItemActive':route.path === '/deepsearch'}">
        DeepSearch
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="item in newsStore.m3">{{item}}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <font-awesome-icon
      v-if="route.path === '/'"
      :icon="['fas', 'arrows-rotate']"
      :class="['refreshBtn', { 'fa-spin fast-spin': newsStore.refresh }]"
      @click="toRefresh"
    />
    <el-checkbox v-if="route.path === '/'" v-model="onlyImportant" label="只看重要" class="onip custom-checkbox" />
  </div>
  <div class="mobile-menu" :class="{ 'show': showMenu }">
    <div class="menu-content">
      <RouterLink to="/" class="mobile-nav-item" @click="toggleMenu">快讯</RouterLink>
      <RouterLink to="/news" class="mobile-nav-item" @click="toggleMenu">要闻</RouterLink>
      <RouterLink to="/deepsearch" class="mobile-nav-item" @click="toggleMenu">DeepSearch</RouterLink>
      <img src="@/assets/hlogo6.png" style="height: 15px;width: 188px;position: absolute;bottom:20px;" alt="">
    </div>
  </div>
  <RouterView :key="$route.fullPath" class="rt" />
  <footer>
    <div class="fm">
      <img alt="Vue logo" class="logoW" src="@/assets/logob2.png" />
      <div class="icons">
        <font-awesome-icon :icon="['fab', 'x-twitter']" />
      </div>
      <div class="icons">
        <font-awesome-icon :icon="['fas', 'paper-plane']" style="position: relative;left:-1px" />
      </div>
      <div class="icons">
        <font-awesome-icon :icon="['fas', 'envelope']" />
      </div>
      <span class="domain">
        hashnews.pro@2025
      </span>
    </div>
  </footer>
</template>
<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { Sunny, Moon, } from '@element-plus/icons-vue'
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
  import { useDark } from "@vueuse/core";
  import request from "@/utils/request"; // 引入封装的 Axios 实例
  import { _URL } from "@/api/url";
  import { ElDropdown } from 'element-plus';
  import { useNewsStore } from '@/stores/news';  //引入状态
  const newsStore = useNewsStore();

  const isDark = useDark();
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
  
  //刷新
  const toRefresh = () =>{
    if(!newsStore.refresh){  //使加载过程中点击无效
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
    router.push('/deepsearch?key=' + key.value);
  }
  //跳转页面
  const toPage = (val: any) => {
    router.push(val);
  }
  //设置菜单1选中项
  const setType1 = (val: any) => {
    menuopen.value = false  //设置完了之后菜单就关了，恢复一下状态
    newsStore.setPrimaryCategory(val);
  }
  const dropdown1 = ref<InstanceType<typeof ElDropdown>>();
  const dropdown2 = ref<InstanceType<typeof ElDropdown>>();
  const dropdown3 = ref<InstanceType<typeof ElDropdown>>();
  // const m1 = ref(['全部'])
  // const m2 = ref([])
  // const m3 = ref([])
  watch(() => route.path, () => {
    menuopen.value = false;
  });
  onMounted(() => {
    //获取热门分类
    request.get(_URL.news_category_statistic)
      .then((response: any) => {
          let needData = ["全部"];
          response.data.forEach(item => {
              if (item.category) { // 确保 category 不为 null
                  needData.push(item.category);
              }
          });
          console.log(needData)
          newsStore.setM1(needData);
         // console.log('啊啊啊啊啊'+needData)
      })
      .catch((err: any) => {
      })
  })
  //跳转页面
  const toPageBar = (val: string) => {
    if (route.path !== val) {
      router.push(val);
    } else {
      const dropdownMap = {
        '/': dropdown1,
        '/news': dropdown2,
        '/deepsearch': dropdown3,
      };
      const dropdown = dropdownMap[val];
      const menuItems = val === '/' ? newsStore.m1 : val === '/news' ? newsStore.m2 : newsStore.m3;
    
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
  .rt{
      margin-top: 0 !important;
    }
  header {
    position: fixed;
    z-index: 9999 !important;
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
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: 88px;
      float: right;
      margin-top: 15px;
      margin-right: 40px;
    }

    .searchBtn {
      width: 35px;
      margin-top: 7px;
      font-size: 16px;
      color: rgb(104, 118, 164);
      cursor: pointer;
    }

    .searchInput {
      height: 100%;
      outline: none;
      border: none;
      background-color: transparent;
      color: #1c1a1a;
      font-weight: 600;
      width: 0;
      padding-left: 15px;
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
      float: right;
      font-size: 20px;
      /* 根据需要调整大小 */
      line-height: 24px;
      /* 确保line-height与字体大小相同 */
      margin-right: 40px;
      margin-top: 20px;
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
        margin-left: 50px;
        border-radius: 50%;
        cursor: pointer;
        color: #072144;
        font-size: 16px;
        line-height: 35px;
        text-align: center;
        cursor: pointer;
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
      width: 80px;
      display: block;
      float: left;
      text-align: center;
      font-size: 16px;
      cursor: pointer;
      color: #afbee6;
      text-decoration: none;
      font-weight: 600;
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
    .fast-spin {
      animation: fa-spin 0.5s linear infinite !important;
    }
    .refreshBtn{
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
      -webkit-tap-highlight-color: transparent;
      /* 适用于iOS和Chrome */
      outline: none;
      /* 去除点击时的轮廓 */
      box-shadow: none;
      /* 去除点击时的阴影 */
      float: right;
      position: relative;
      right: 15px;
      top: 6px;
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
    .menuIcon {
      display: none;
    }
    .flashTagsMobile{
      display: none;
    }
    
  }
</style>