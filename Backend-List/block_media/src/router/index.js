import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */
import componentsRouter from './modules/components'
import chartsRouter from './modules/charts'
import tableRouter from './modules/table'
import nestedRouter from './modules/nested'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    noCache: true                if set true, the page will no be cached(default is false)
    affix: true                  if set true, the tag will affix in the tags-view
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  }, {
    path: '/',
    component: Layout,
    redirect: '/dashboard-dev',
    children: [{
      path: 'dashboard-dev',
      component: () => import('@/views/dashboard/index'),
      name: 'Dashboard',
      meta: { title: 'Dashboard', icon: 'dashboard', affix: true }
    }]
  }, {
    path: '/media',
    component: Layout,
    redirect: '/media/news',
    alwaysShow: true, // will always show the root menu
    name: 'media',
    meta: {
      title: 'HashNews媒体',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'news',
      component: () => import('@/views/media/news'),
      name: 'MediaNews',
      meta: {
        title: '快讯消息'
      }
    }, {
      path: 'article',
      component: () => import('@/views/media/article'),
      name: 'MediaArticle',
      meta: {
        title: '深度文章'
      }
    }, {
      path: 'config',
      component: () => import('@/views/xmain/config'),
      name: 'Xconfig',
      meta: {
        title: '配置项'
      }
    }]
  }, {
    path: '/xmain',
    component: Layout,
    redirect: '/xmain/reply-target',
    alwaysShow: true, // will always show the root menu
    name: 'xmain',
    meta: {
      title: 'X主账号',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/xmain/reply-target'),
      name: 'XreplyTargt',
      meta: {
        title: '评论目标'
      }
    }, {
      path: 'tweet',
      component: () => import('@/views/xmain/tweet'),
      name: 'XmainTweet',
      meta: {
        title: '推文列表'
      }
    }, {
      path: 'replyWithTweet',
      component: () => import('@/views/xmain/reply-with-tweet'),
      name: 'XmainReplyWithTweet',
      meta: {
        title: '带推评论'
      }
    }, {
      path: 'searchTweet',
      component: () => import('@/views/xmain/search-tweet'),
      name: 'XSearchTweet',
      meta: {
        title: '推文搜索配置'
      }
    }]
  }, {
    path: '/xmain2',
    component: Layout,
    redirect: '/xmain2/kol-target',
    alwaysShow: true, // will always show the root menu
    name: 'xmain2',
    meta: {
      title: 'X监控',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'kol-target',
      component: () => import('@/views/xmain/kol-target'),
      name: 'XkolTargt',
      meta: {
        title: 'KOL目标'
      }
    }, {
      path: 'kol-tweet',
      component: () => import('@/views/xmain/kol-tweet'),
      name: 'XkolTweet',
      meta: {
        title: '推文列表'
      }
    }, {
      path: 'follow-account',
      component: () => import('@/views/xmain/follow-account'),
      name: 'XfollowAccount',
      meta: {
        title: '关注目标'
      }
    }]
  }, {
    path: '/monitor',
    component: Layout,
    redirect: '/monitor/panews',
    alwaysShow: true, // will always show the root menu
    name: 'monitor',
    meta: { title: '平台监控', icon: 'el-icon-news' },
    children: [{
      path: 'targets',
      component: () => import('@/views/monitor/targets'),
      name: 'targets',
      meta: { title: '采集监控' }
    }, {
      path: 'panews',
      component: () => import('@/views/monitor/panews'),
      name: 'panews',
      meta: { title: '媒体平台' }
    }]
  }, {
    path: '/bctwitter',
    component: Layout,
    redirect: '/bctwitter/account-info',
    alwaysShow: true, // will always show the root menu
    name: 'bctwitter',
    meta: {
      title: 'TW平台',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/bctwitter/account'),
      name: 'GuidbcTwAccount',
      meta: {
        title: '机器账号'
      }
    }, {
      path: 'account-target',
      component: () => import('@/views/bctwitter/account-target'),
      name: 'GuidbcTwAccountTarget',
      meta: {
        title: '监控目标'
      }
    }, {
      path: 'tweet',
      component: () => import('@/views/bctwitter/tweet'),
      name: 'GuidbcTwCrawlerTweet',
      meta: {
        title: '采集推文'
      }
    }]
  }, {
    path: '/dy',
    component: Layout,
    redirect: '/dy/post-aweme',
    alwaysShow: true, // will always show the root menu
    name: 'douyin',
    meta: {
      title: '其它',
      icon: 'el-icon-setting'
    },
    children: [{
      path: 'post-aweme',
      component: () => import('@/views/dy/post-aweme'),
      name: 'DyPostAweme',
      meta: {
        title: '抖音视频'
      }
    }, {
      path: 'bn-alpha',
      component: () => import('@/views/dy/bn-alpha'),
      name: 'BnAlpha',
      meta: {
        title: '币安Alpha'
      }
    }, {
      path: 'gmgn',
      component: () => import('@/views/dy/gmgn'),
      name: 'GMGN',
      meta: {
        title: 'GMGN'
      }
    }, {
      path: 'tool',
      component: () => import('@/views/dy/tool'),
      name: 'Dytool',
      meta: {
        title: '其它工具'
      }
    }]
  }
  /**
  , {
    path: '/tender',
    component: Layout,
    redirect: '/tender/tender',
    alwaysShow: true, // will always show the root menu
    name: 'tender',
    meta: {
      title: '招标信息',
      icon: 'el-icon-setting'
    },
    children: [{
      path: 'post-aweme',
      component: () => import('@/views/tender/tender'),
      name: 'TenderList',
      meta: {
        title: '招标信息'
      }
    }]
  }
  **/
  /**
  , {
    path: '/af',
    component: Layout,
    redirect: '/af/account-data',
    alwaysShow: true, // will always show the root menu
    name: 'affb',
    meta: {
      title: 'AF数据管理',
      icon: 'el-icon-setting'
    },
    children: [{
      path: 'account-data',
      component: () => import('@/views/af/account-data'),
      name: 'AfAccountData',
      meta: {
        title: '账号数据设置'
      }
    }, {
      path: 'page-data',
      component: () => import('@/views/af/page-data'),
      name: 'AfPageData',
      meta: {
        title: '主页数据设置'
      }
    }, {
      path: 'group-data',
      component: () => import('@/views/af/group-data'),
      name: 'AfGroupData',
      meta: {
        title: '群组数据设置'
      }
    }]
  }, {
    path: '/fbguid',
    component: Layout,
    redirect: '/fbguid/fb-account',
    alwaysShow: true, // will always show the root menu
    name: 'fbguid',
    meta: {
      title: 'FB引导',
      icon: 'el-icon-key'
    },
    children: [{
      path: 'fb-account',
      component: () => import('@/views/fbguid/account'),
      name: 'GuidFbAccount',
      meta: {
        title: '引导账号'
      }
    }]
  }, {
    path: '/fbpage-dev',
    component: Layout,
    redirect: '/fbpage-dev/manage-pages',
    alwaysShow: true, // will always show the root menu
    name: 'fbpage',
    meta: { title: 'FB主页', icon: 'el-icon-wind-power' },
    children: [{
      path: 'manage-pages',
      component: () => import('@/views/fbpage/manage-pages'),
      name: 'ManagePage',
      meta: {
        title: '主页列表'
      }
    }, {
      path: 'page-admins',
      component: () => import('@/views/fbpage/page-admins'),
      name: 'PageAdmins',
      meta: {
        title: '管理员列表'
      }
    }, {
      path: 'post-insights',
      component: () => import('@/views/fbpage/post-insights'),
      name: 'PostInsights',
      meta: {
        title: '帖子Insights'
      }
    }]
  }, {
    path: '/account-dev',
    component: Layout,
    redirect: '/account-dev/fb',
    alwaysShow: true, // will always show the root menu
    name: 'account',
    meta: { title: '账号培育', icon: 'peoples'},
    children: [{
      path: 'fb',
      component: () => import('@/views/account/fb'),
      name: 'fbAccount',
      meta: { title: 'FB账号' }
    }, {
      path: 'tw',
      component: () => import('@/views/account/tw'),
      name: 'twAccount',
      meta: { title: 'TW账号' }
    }]
  }, {
    path: '/material',
    component: Layout,
    redirect: '/material/page-post',
    alwaysShow: true, // will always show the root menu
    name: 'material',
    meta: { title: '舆材收集', icon: 'el-icon-paperclip' },
    children: [{
      path: 'page-post',
      component: () => import('@/views/material/page-post'),
      name: 'page-post',
      meta: { title: '主页发帖舆材' }
    }, {
      path: 'youtube',
      component: () => import('@/views/material/youtube'),
      name: 'youtube',
      meta: { title: 'Youtube' }
    }, {
      path: 'instagram',
      component: () => import('@/views/material/instagram'),
      name: 'instagram',
      meta: { title: 'Instagram' }
    }]
  }, {
    path: '/fbgroup',
    component: Layout,
    redirect: '/fbgroup/group-user',
    alwaysShow: true, // will always show the root menu
    name: 'fbgroup',
    meta: {
      title: 'FB采集',
      icon: 'el-icon-star-on'
    },
    children: [{
      path: 'account-info',
      component: () => import('@/views/fbgroupcrawler/account-info'),
      name: 'FbAccount',
      meta: {
        title: '账号信息'
      }
    }, {
      path: 'page-info',
      component: () => import('@/views/fbgroupcrawler/page-info'),
      name: 'PageInfo',
      meta: {
        title: '主页信息'
      }
    }, {
      path: 'group-info',
      component: () => import('@/views/fbgroupcrawler/group-info'),
      name: 'GroupInfo',
      meta: {
        title: '群组信息'
      }
    }, {
      path: 'group-user',
      component: () => import('@/views/fbgroupcrawler/group-user'),
      name: 'GroupUser',
      meta: {
        title: '入群账号'
      }
    }, {
      path: 'post-list',
      component: () => import('@/views/fbgroupcrawler/post-list'),
      name: 'PostList',
      meta: {
        title: '帖子列表'
      }
    }]
  }, {
    path: '/twitter',
    component: Layout,
    redirect: '/twitter/tweet',
    alwaysShow: true, // will always show the root menu
    name: 'twitter',
    meta: {
      title: 'TW采集',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'account-info',
      component: () => import('@/views/twitter/account-info'),
      name: 'GuidTwAccount',
      meta: {
        title: '引导账号'
      }
    }, {
      path: 'tweet',
      component: () => import('@/views/twitter/tweet'),
      name: 'Tweet',
      meta: {
        title: '推文采集'
      }
    }]
  }, {
    path: '/instagram',
    component: Layout,
    redirect: '/instagram/account',
    alwaysShow: true, // will always show the root menu
    name: 'instagram',
    meta: {
      title: 'INS采集',
      icon: 'el-icon-info'
    },
    children: [{
      path: 'account-info',
      component: () => import('@/views/instagram/account-info'),
      name: 'CrawlFbAccount',
      meta: {
        title: '账号信息'
      }
    }]
  }, {
    hidden: true,
    path: '/fbpage-dev123',
    component: Layout,
    redirect: '/fbpage-dev/manage-pages',
    alwaysShow: true, // will always show the root menu
    name: 'fbpage',
    meta: {
      title: 'FB主页',
      icon: 'el-icon-wind-power'
    },
    children: [{
      path: 'manage-pages',
      component: () => import('@/views/fbpage/manage-pages'),
      name: 'ManagePage',
      meta: {
        title: '主页列表'
      }
    }, {
      path: 'page-admins',
      component: () => import('@/views/fbpage/page-admins'),
      name: 'PageAdmins',
      meta: {
        title: '管理员列表'
      }
    }, {
      path: 'post-insights',
      component: () => import('@/views/fbpage/post-insights'),
      name: 'PostInsights',
      meta: {
        title: '帖子Insights'
      }
    }]
  }, {
    path: '/telegram',
    component: Layout,
    redirect: '/telegram/account',
    alwaysShow: true, // will always show the root menu
    name: 'telegram',
    meta: {
      title: 'Telegram操作',
      icon: 'el-icon-s-promotion'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/telegram/account'),
      name: 'TelegramAccount',
      meta: {
        title: '账号列表'
      }
    }, {
      path: 'message',
      component: () => import('@/views/telegram/message'),
      name: 'telegramMessage',
      meta: {
        title: '发消息'
      }
    }]
  }, {
    path: '/uwants',
    component: Layout,
    redirect: '/uwants/post',
    alwaysShow: true, // will always show the root menu
    name: 'uwants',
    meta: {
      title: 'Uwants操作',
      icon: 'el-icon-chat-line-round'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/uwants/account'),
      name: 'UwantsAccount',
      meta: {
        title: '账号列表'
      }
    }, {
      path: 'post',
      component: () => import('@/views/uwants/post'),
      name: 'UwantsPost',
      meta: {
        title: 'uwants帖子'
      }
    }, {
      path: 'building',
      component: () => import('@/views/uwants/building'),
      name: 'UwantsBuilding',
      meta: {
        title: 'uwants评论'
      }
    }]
  }, {
    path: '/discuss',
    component: Layout,
    redirect: '/discuss/account',
    alwaysShow: true, // will always show the root menu
    name: 'discuss',
    meta: {
      title: 'Discuss操作',
      icon: 'el-icon-chat-round'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/discuss/account'),
      name: 'DiscussAccount',
      meta: {
        title: '账号列表'
      }
    }, {
      path: 'post',
      component: () => import('@/views/discuss/post'),
      name: 'DiscussPost',
      meta: {
        title: 'discuss帖子'
      }
    }, {
      path: 'building',
      component: () => import('@/views/discuss/building'),
      name: 'DiscussBuilding',
      meta: {
        title: 'discuss评论'
      }
    }]
  }, {
    path: '/mewe',
    component: Layout,
    redirect: '/mewe/account',
    alwaysShow: true, // will always show the root menu
    name: 'mewe',
    meta: {
      title: 'Mewe操作',
      icon: 'el-icon-collection-tag'
    },
    children: [{
      path: 'account',
      component: () => import('@/views/mewe/account'),
      name: 'MeweAccount',
      meta: {
        title: '账号列表'
      }
    }, {
      path: 'post',
      component: () => import('@/views/mewe/post'),
      name: 'MewePost',
      meta: {
        title: 'mewe帖子'
      }
    }]
  }
  **/
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = []
export const asyncRoutes1 = [
  {
    path: '/permission',
    component: Layout,
    redirect: '/permission/page',
    alwaysShow: true, // will always show the root menu
    name: 'Permission',
    meta: {
      title: 'Permission',
      icon: 'lock',
      roles: ['admin', 'editor'] // you can set roles in root nav
    },
    children: [
      {
        path: 'page',
        component: () => import('@/views/permission/page'),
        name: 'PagePermission',
        meta: {
          title: 'Page Permission',
          roles: ['admin'] // or you can only set roles in sub nav
        }
      },
      {
        path: 'directive',
        component: () => import('@/views/permission/directive'),
        name: 'DirectivePermission',
        meta: {
          title: 'Directive Permission'
          // if do not set roles, means: this page does not require permission
        }
      },
      {
        path: 'role',
        component: () => import('@/views/permission/role'),
        name: 'RolePermission',
        meta: {
          title: 'Role Permission',
          roles: ['admin']
        }
      }
    ]
  },

  {
    path: '/icon',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/icons/index'),
        name: 'Icons',
        meta: { title: 'Icons', icon: 'icon', noCache: true }
      }
    ]
  },

  /** when your routing map is too long, you can split it into small modules **/
  componentsRouter,
  chartsRouter,
  nestedRouter,
  tableRouter,

  {
    path: '/example',
    component: Layout,
    redirect: '/example/list',
    name: 'Example',
    meta: {
      title: 'Example',
      icon: 'el-icon-s-help'
    },
    children: [
      {
        path: 'create',
        component: () => import('@/views/example/create'),
        name: 'CreateArticle',
        meta: { title: 'Create Article', icon: 'edit' }
      },
      {
        path: 'edit/:id(\\d+)',
        component: () => import('@/views/example/edit'),
        name: 'EditArticle',
        meta: { title: 'Edit Article', noCache: true, activeMenu: '/example/list' },
        hidden: true
      },
      {
        path: 'list',
        component: () => import('@/views/example/list'),
        name: 'ArticleList',
        meta: { title: 'Article List', icon: 'list' }
      }
    ]
  },

  {
    path: '/tab',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/tab/index'),
        name: 'Tab',
        meta: { title: 'Tab', icon: 'tab' }
      }
    ]
  },

  {
    path: '/error',
    component: Layout,
    redirect: 'noRedirect',
    name: 'ErrorPages',
    meta: {
      title: 'Error Pages',
      icon: '404'
    },
    children: [
      {
        path: '401',
        component: () => import('@/views/error-page/401'),
        name: 'Page401',
        meta: { title: '401', noCache: true }
      },
      {
        path: '404',
        component: () => import('@/views/error-page/404'),
        name: 'Page404',
        meta: { title: '404', noCache: true }
      }
    ]
  },
  {
    path: '/error-log',
    component: Layout,
    children: [
      {
        path: 'log',
        component: () => import('@/views/error-log/index'),
        name: 'ErrorLog',
        meta: { title: 'Error Log', icon: 'bug' }
      }
    ]
  },
  {
    path: '/excel',
    component: Layout,
    redirect: '/excel/export-excel',
    name: 'Excel',
    meta: {
      title: 'Excel',
      icon: 'excel'
    },
    children: [
      {
        path: 'export-excel',
        component: () => import('@/views/excel/export-excel'),
        name: 'ExportExcel',
        meta: { title: 'Export Excel' }
      },
      {
        path: 'export-selected-excel',
        component: () => import('@/views/excel/select-excel'),
        name: 'SelectExcel',
        meta: { title: 'Export Selected' }
      },
      {
        path: 'export-merge-header',
        component: () => import('@/views/excel/merge-header'),
        name: 'MergeHeader',
        meta: { title: 'Merge Header' }
      },
      {
        path: 'upload-excel',
        component: () => import('@/views/excel/upload-excel'),
        name: 'UploadExcel',
        meta: { title: 'Upload Excel' }
      }
    ]
  },
  {
    path: '/zip',
    component: Layout,
    redirect: '/zip/download',
    alwaysShow: true,
    name: 'Zip',
    meta: { title: 'Zip', icon: 'zip' },
    children: [
      {
        path: 'download',
        component: () => import('@/views/zip/index'),
        name: 'ExportZip',
        meta: { title: 'Export Zip' }
      }
    ]
  },
  {
    path: '/pdf',
    component: Layout,
    redirect: '/pdf/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/pdf/index'),
        name: 'PDF',
        meta: { title: 'PDF', icon: 'pdf' }
      }
    ]
  },
  {
    path: '/pdf/download',
    component: () => import('@/views/pdf/download'),
    hidden: true
  },
  {
    path: '/theme',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/theme/index'),
        name: 'Theme',
        meta: { title: 'Theme', icon: 'theme' }
      }
    ]
  },
  {
    path: '/clipboard',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/clipboard/index'),
        name: 'ClipboardDemo',
        meta: { title: 'Clipboard', icon: 'clipboard' }
      }
    ]
  },

  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://github.com/PanJiaChen/vue-element-admin',
        meta: { title: 'External Link', icon: 'link' }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
