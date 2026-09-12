"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const electron_1 = require("electron");
const path = require("path");
const fs = require('fs');
const brwEngine = require("./browser_engine");
const { consumeCapture, saveCapture } = require("./screenshot_security");
let ipcMain = electron_1.ipcMain;
let baseDir = path.dirname(process.resourcesPath);
let downloadDir = path.join(baseDir, 'downloads');
let dataDir = path.join(baseDir, 'data');
let mouseDir = path.join(baseDir, 'input', 'mouse');
let brw = path.join(baseDir, 'brw');
let proxy = path.join(baseDir, 'proxy');
let dynamic = path.join(baseDir, 'dynamic');
let cookie = path.join(baseDir, 'cookie');
let mainWindow = null;
let accountCookie = false;
let fingerPrintSwitch = false;
mkdir(downloadDir);
// let proxyServer = "socks5://127.0.0.1:8238";
// let proxyServer = "socks5://127.0.0.1:1080";
let proxyServer = false;
const session = electron_1.session;
const taskConfig = brwEngine.getTaskConfig()

let cookieWebsite = 'https://www.facebook.com';


//let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36';
//let userAgent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Mobile Safari/537.36';
let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36';
if (fs.existsSync(brw)) {
  userAgent = fs.readFileSync(brw, 'utf-8');
  fs.unlink(brw, (err) => {
    if (err) throw err;
  })
}
if (brwEngine.getCmdArgument('--userData')) {
  const userData = brwEngine.getCmdArgument('--userData')
  const proxyFilePath = path.join(userData, 'proxy')
  if (fs.existsSync(proxyFilePath)) {
    proxy = proxyFilePath
  }
}
if (fs.existsSync(proxy)) {
  proxyServer = fs.readFileSync(proxy, 'utf-8');
  //fs.unlink(proxy, (err) => {
  //  if (err) throw err;
  //})
}
if (fs.existsSync(dynamic)) {
  fs.unlink(dynamic, (err) => {
    if (err) throw err;
  })
}
cookie = brwEngine.getCmdArgument('--cookieFile') || cookie
if (fs.existsSync(cookie)) {
  accountCookie = fs.readFileSync(cookie, 'utf-8');
  try {
    let jsonArr = JSON.parse(accountCookie);
    accountCookie = jsonArr.reduce((r, c) => {
      r += c.name + '=' + c.value + '; ';
      return r;
    }, '')
  } catch (error) {

  }
  fs.unlink(cookie, (err) => {
    if (err) throw err;
  })
} else if(taskConfig.accountCookie) {
  accountCookie = taskConfig.accountCookie;
  cookieWebsite = taskConfig.cookieWebsite;
}

electron_1.app.allowRendererProcessReuse = true;
electron_1.app.on('window-all-closed', () => {
  electron_1.app.quit();
});
electron_1.app.commandLine.appendSwitch('lang', 'en-US')
ipcMain.on('cap', async function (evt, message) {
  try {
    const capture = consumeCapture(evt, mainWindow, message);
    const image = capture.rectangle
      ? await evt.sender.capturePage(capture.rectangle)
      : await evt.sender.capturePage();
    if (!image || typeof image.toJPEG !== 'function' || image.isEmpty()) {
      throw new Error('Screenshot capture returned no image');
    }
    saveCapture(capture, image.toJPEG(90));
  } catch (error) {
    console.warn('Screenshot request rejected:', error.message);
  }
});

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function initData() {
  dataDir = brwEngine.getCmdArgument('--userData') || dataDir
  mkdir(dataDir);
  electron_1.app.setPath('userData', dataDir);
  electron_1.app.setPath('userCache', dataDir);
}

function initCommandLine() {
  electron_1.app.commandLine.appendSwitch('auto-detect', 'false');
  electron_1.app.commandLine.appendSwitch('no-proxy-server');
  electron_1.app.commandLine.appendSwitch('enable-webfonts-intervention-v2', 'Disabled');
  //electron_1.app.commandLine.appendSwitch('autoplay-policy', 'user-gesture-required');
  //electron_1.app.commandLine.appendSwitch('disable-http-cache');
}

function decorateURL(url) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.append('utm_source', 'default_app');
  return parsedUrl.toString();
}

if (proxyServer == 'specialProxy' || taskConfig.dynamicProxy===true || taskConfig.dynamicProxy=="true") {
  console.log(`dynamicProxy: ${taskConfig.dynamicProxy}, ${taskConfig.dynamicProxy}`)
  const session_id = (1000000 * Math.random()) | 0
  const proxy_country = taskConfig.dynamicProxyCountry || 'us'
  //机房代理
  const proxy_username = `lum-customer-hl_ddbbb595-zone-zone1-country-${proxy_country}-session-${session_id}`
  const proxy_password = process.env.PROXY_PASSWORD
  if (!proxy_password) {
    throw new Error('Missing required environment variable: PROXY_PASSWORD')
  }
  //动态住宅
  //const proxy_username = 'lum-customer-hl_ddbbb595-zone-isp-country-us-session-' + session_id

  //静态住宅
  //const proxy_username = 'lum-customer-hl_ddbbb595-zone-static_resident-country-in-session-' + session_id;
  //const proxy_username = 'lum-customer-hl_ddbbb595-zone-static_resident-session-' + session_id;

  electron_1.app.on('login', function(event, webContents, request, authInfo, callback) {
      console.log('app login, isProxy', authInfo.isProxy);
      if(authInfo.isProxy) {
          callback(proxy_username, proxy_password);
      }
  });
  proxyServer = "http://zproxy.lum-superproxy.io:22225"
} else if (taskConfig.shenzhenProxy==true || taskConfig.shenzhenProxy=="true") {
  let shenzhenProxy = path.join(baseDir, 'proxy_shenzhen')
  if (fs.existsSync(shenzhenProxy)) {
    proxyServer = fs.readFileSync(shenzhenProxy, 'utf-8')
    console.log(`shenzhenProxy: ${taskConfig.shenzhenProxy}, ${proxyServer}`)
  }
}

async function createWindow() {
  await electron_1.app.whenReady();
  let loadImageFlag = true
  if (taskConfig.loadImages === false) {
    loadImageFlag = false
  }
  let preloadFile = path.resolve(__dirname, 'helper.js');
  if (taskConfig.browserShowLink === true) {
    preloadFile = path.resolve(__dirname, 'helper_showLink.js');
  }
  const options = {
    width: 1920,
    height: 8000,
    autoHideMenuBar: true,
    backgroundColor: '#FFFFFF',
    icon: path.resolve(__dirname, 'favicon.ico'),
    webPreferences: {
      preload: preloadFile,
      /**
       * node模式配置
       */
      /*
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true
      */
      /**
       * 非node模式配置
       */
      // Legacy task scripts depend on main-world window.clientUtilsObj and DOM-node returns.
      // The screenshot IPC is separately isolated with a main-process, one-time ticket.
      contextIsolation: false,
      sandbox: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      images: loadImageFlag
    },
    useContentSize: true,
    show: false
  };
  if (process.platform === 'linux') {
    options.icon = path.join(__dirname, 'favicon.ico');
  }
  if (fingerPrintSwitch) {
    options.webPreferences.webgl = false;
  }
  mainWindow = new electron_1.BrowserWindow(options);
  mainWindow.webContents.userAgent = userAgent;
  //mainWindow.webContents.setUserAgent(userAgent);
  if (fingerPrintSwitch) {
    mainWindow.webContents.setWebRTCIPHandlingPolicy('disable_non_proxied_udp')
    session.defaultSession.webRequest.onBeforeSendHeaders({
      urls: ["*://*/*"]
    }, (details, callback) => {
      details.requestHeaders['DNT'] = '1'
      callback({
        requestHeaders: details.requestHeaders
      })
    })
  }
  mainWindow.on('ready-to-show', () => {
    if (fingerPrintSwitch) {
      const tz = {
        timezoneId: 'Asia/Kuala_Lumpur'
      }
      mainWindow.webContents.debugger.sendCommand('Emulation.setTimezoneOverride', tz)
      const geo = {
        latitude: parseInt(Math.random()*70000 + 10000)/10000,
        longitude: parseInt(Math.random()*20000)/1000 + 100,
        accuracy: 100
      }
      mainWindow.webContents.debugger.sendCommand('Emulation.setGeolocationOverride', geo)
    }

  });
  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    event.preventDefault();
    // electron_1.shell.openExternal(decorateURL(url));
    mainWindow.loadURL(url);
  });

  return mainWindow;
}
initData();
initCommandLine();

function removeCookies(domain, url) {
  session.defaultSession.cookies.get({
    domain: domain
  }).then(function (o) {
    if (o && o.length > 0) {
      for (var p in o) {
        session.defaultSession.cookies.remove(url, o[p]['name']).then(function (cookies) {
          console.log(cookies);
        });
      }
    }
  });
}

function clgCookies() {
  session.defaultSession.cookies.get({})
    .then((cookies) => {
      console.log(cookies)
    }).catch((error) => {
      console.log(error)
    })
}

function setCookies(accountCookie, ...args) {
  const cookiesStr = accountCookie;
  let arr = cookiesStr.split(/;/);
  arr.forEach(str => {
    str = str.trim()
    if(!str) {
      return
    }
    let tmp = str.split(/=/);
    if(tmp.length<2 || !tmp[0] || !tmp[1]){
      return
    }
    let name = tmp[0].trim();
    let value = tmp[1].trim();
    let url = args[0] ? args[0] : cookieWebsite;
    let cookie = {
      url,
      name,
      value,
      expirationDate: new Date().getTime() + 30*24*3600*1000
    }
    console.log("cookieWebsite:",args,cookieWebsite );   console.log("cookies:", cookie);
    session.defaultSession.cookies.set(cookie)
      .then(() => {
        // success
      }, (error) => {
        console.error(error)
      })
  });
  session.defaultSession.cookies.flushStore()
}

exports.loadURL = async (appUrl) => {
  if (proxyServer == 'null') {
    proxyServer = false
  }
  mainWindow = await createWindow();
  if (accountCookie) {
    setCookies(accountCookie, cookieWebsite);
  }
  mainWindow.loadURL(appUrl);
  if (!proxyServer) {
    mainWindow.loadURL(appUrl);
  } else {
    mainWindow.webContents.session.setProxy({
      proxyRules: proxyServer.trim()
    }).then(function () {
      mainWindow.loadURL(appUrl);
    });
  }
  var newSession = mainWindow.webContents.session;
  const showWin = brwEngine.getCmdArgument('--showWin','true')
  console.log('--showWin', showWin)
  if (showWin == 'true' || showWin === true) {
    mainWindow.show()
    mainWindow.maximize();
  }
  //mainWindow.openDevTools();
  mainWindow.focus();
  setTimeout(async function () {
    brwEngine.execScript(mainWindow);
  }, 5000);
};
