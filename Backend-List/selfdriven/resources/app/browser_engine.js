"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const electron_1 = require("electron");
electron_1.app.on('window-all-closed', () => {
  $g.log.finish(result);
  electron_1.app.quit();
});
const path = require("path");
const { authorizeCapture } = require("./screenshot_security");
let baseDir = path.dirname(process.resourcesPath);
const https = require('https')
const axios = require('axios')
const iconv = require('iconv-lite');
const parseScript = require("./parseScript");
let taskDir = path.join(baseDir, 'task');
let downloadDir = path.join(baseDir, 'downloads');
let historyDir = path.join(taskDir, 'history');
let resultDir = path.join(taskDir, 'result');
let TASK_SUCCESS = 0,
  TASK_FAILED = 1,
  TASK_BROWSER_IS_CLOSE = 2,
  TASK_CODE_ERROR = 3,
  TASK_NOT_FOUND_SCRIPT = 4,
  TASK_BLANK_PAGE = 5,
  TASK_CHECK_STEP_TIMEOUT = 6,
  TASK_CALL_ERROR = 7,
  win = null,
  taskId = false,
  path_trans = false,
  imgSuffix = ".jpg",
  taskConfig = null,
  enableStepCapture = false,
  allLoopVariables = {},
  allActions = [],
  hasLoop = false,
  // scriptJsonFile = "E:/001/code/m_dev/branches/5.0/selfdriven_dev/crawler_image/new_task.json",
  scriptJsonFile = false,
  start_time = new Date().getTime(),
  loopResult = {};
let result = TASK_BROWSER_IS_CLOSE;
let $g = {
  currentStep: 0,
  processExecTag: false,
  isFailure: false,
  inDebug: true,
  debugData: true,
  variables: {},
  results: [],
  resultsEx: {},
  targets: [],
  errors: {"exit_codes": []},
  acts: {},
  offset: {
    left: 0,
    top: 0
  },
  loadPageTag: false,
  inTest: false,
  frameOffset: false,
  taskPause: false,
  classicMode: true,
  execIntervalFlag: null,
  listenIntervalFlag: null,
  continueTaskFile: false,
  continueTaskChekStep: -1,
  continueTaskChekTime: 0,
  continueLogTime: 0,
  processing: true,
  basePos: {
    x: 0,
    y: 0
  },
  posTop: 0,
  posBottom: 20,
  currentActionStartTime: new Date().getTime(),
  stepTimeout: 30 * 60 * 1000,
  lastSaveTime: 0,
  setTaskFinished: false,
  scriptExecResult: "_init",
  needParse: false,
  quikMode: false,
  frameSelector: false,
  webContentsStopFlag: false,
  consoleMessageSwitch: false,
  crawlGroupPermeationType: '',
  netWorkListenFlag: false,
  netWorkParseFlag: true
};
$g.session = electron_1.session;
$g.system = require('./custom.js').system;
$g.isWin = $g.system.os.name == "windows" ? true : false;
$g.fs = require('./custom.js').fs;
$g.utils = require('./utils.js');
$g.labels = {};
$g.loopLabels = {};
if (!$g.isWin) $g.fs.separator = '/';
$g.sep = $g.fs.separator;
$g.common = require('./common.js').create($g);
$g.errors_code = require('./errors_code.js').errors_code_list;
$g.pwd = $g.fs.workingDirectory;
$g.taskPath = $g.fs.pwd;
$g.vcodeImagePath = $g.pwd;
$g.vcodeTextPath = $g.pwd;
$g.vcodeTmpPath = $g.pwd;
$g.waitPhonePath = $g.pwd;
$g.phonePath = $g.pwd;
$g.smsPath = $g.pwd;
$g.waitSmsPath = $g.pwd;
$g.emailVCodePath = $g.pwd;
$g.waitEmailVCodePath = $g.pwd;
var post_file_path = $g.pwd;
var post_ret_file_path = $g.pwd;
const Crawler = require('./crawler')

function setProxy() {
  if (taskConfig?.dynamicProxy===true || taskConfig?.dynamicProxy=="true") {
    return
  }
  let proxyServer = ''
  let proxyFile = path.join($g.taskPath, 'proxy.txt')
  if ($g.fs.exists(proxyFile)) {
    try {
      const proxyConfig = JSON.parse($g.fs.read(proxyFile))
      if (proxyConfig && proxyConfig.protocol && proxyConfig.ip && proxyConfig.port) {
        proxyServer = `${proxyConfig.protocol}://${proxyConfig.ip}:${proxyConfig.port}`
      }
    } catch (error) {

    }
    $g.log.append('proxy', `get proxy.txt: ${proxyServer}`)
  }
  if (!proxyServer) {
    if ($g.fs.exists(proxyFile)) {
      proxyServer = $g.fs.read(proxyFile, 'utf-8')
      $g.fs.remove(proxyFile)
    }
    if (proxyServer == 'null') {
      proxyServer = false
    }
    $g.log.append('proxy', `get proxy: ${proxyServer}`)
  }
  if (proxyServer && win) {
    $g.log.append('proxy', `set proxy: ${proxyServer}`)
    if(proxyServer == 'specialProxy'){
      $g.log.append('proxy', 'specialProxy')
      const session_id = (1000000 * Math.random()) | 0
      const proxy_country = taskConfig.dynamicProxyCountry || 'us'
      //机房代理
      const proxy_username = `lum-customer-hl_ddbbb595-zone-zone1-country-session-${session_id}`
      const proxy_password = process.env.PROXY_PASSWORD
      if (!proxy_password) {
        throw new Error('Missing required environment variable: PROXY_PASSWORD')
      }
      electron_1.app.on('login', function(event, webContents, request, authInfo, callback) {
        console.log('app login, isProxy', authInfo.isProxy);
        if(authInfo.isProxy) {
          callback(proxy_username, proxy_password);
        }
      });
      proxyServer = "http://zproxy.lum-superproxy.io:22225"
    }

    if (taskConfig?.shenzhenProxy==true || taskConfig?.shenzhenProxy=="true") {
      let shenzhenProxy = path.join(baseDir, 'proxy_shenzhen')
      $g.log.append('porxy', `shenzhenProxy: ${taskConfig.shenzhenProxy}, ${shenzhenProxy}`)
      if ($g.fs.exists(shenzhenProxy)) {
        proxyServer = $g.fs.read(shenzhenProxy, 'utf-8')
        $g.log.append('porxy', `shenzhenProxy: ${taskConfig.shenzhenProxy}, ${proxyServer}`)
      }
    }

    win.webContents.session.setProxy({
      proxyRules: proxyServer.trim()
    })
  }
}

$g.acts.current = {
  name: "starting",
  step: 0,
  snapIndex: 0,
  time: (new Date()).getTime(),
  params: false
};
$g.acts.baseCapture = async (targetFile, clipRect) => {
  await $g.domOp.capture(clipRect, targetFile);
}
$g.acts.capture = async (targetFile, clipRect) => {
  $g.acts.baseCapture(path.resolve(targetFile), clipRect ? {
    x: parseInt(clipRect.left),
    y: parseInt(clipRect.top),
    width: parseInt(clipRect.width),
    height: parseInt(clipRect.height)
  } : false);
}
$g.acts.captureSelector = async (targetFile, selector, imgOptions) => {
  var rc = await $g.domOp.getElementBounds(selector);
  console.log(rc);
  $g.acts.capture(targetFile, rc, imgOptions);
}
$g.finalizeString = function (str, ignoreLoopVariables) {
  if ($g.utils.isNull(str)) return "";
  if (!$g.utils.isString(str)) return str;
  if (!ignoreLoopVariables && $g.loopVariables) str = _finalizeString($g.loopVariables, str, "");
  str = _finalizeString($g.tmpVariables,
    _finalizeString($g.variables, str, ""), "");
  return str;
};
$g.finalizeObject = function (obj, ignoreLoopVariables) {
  for (var name in obj) {
    if ($g.utils.isString(obj[name])) {
      obj[name] = $g.finalizeString(obj[name], ignoreLoopVariables);
    } else if ($g.utils.isObject(obj[name])) {
      $g.finalizeObject(obj[name], ignoreLoopVariables);
    }
  }
};
$g.getframePos = async function () {
  if (!$g.frameSelector) return false;
  let script = `(function(aSelector) {
    var rc = document.querySelector(aSelector).getBoundingClientRect();
    console.log(rc);
    return {
      'top': rc.y,
      'left': rc.x
    }
})("` + $g.frameSelector + `")`;
  $g.frameOffset = await $g.domOp.exec(script);
}
$g.logEleNotExist = function (selector) {
  $g.debug($g.acts.current.name + ": Element not exist. " + selector);
  $g.log.append($g.acts.current.name, ": Element not exist. " + selector);
};
$g.showStepTime = function () {
  if (!$g.acts.current.time) return;
  var curTime = new Date();
  curTime = curTime.getTime();
  var msg = "-------------> Running time: " + (curTime - $g.acts.current.time) + " ms.";
  $g.debug(msg);
  $g.log.append($g.acts.current.name, msg);
};
$g.downloadFile = async function (url, name) {
  // const mypath = path.resolve(downloadDir, name);
  // const writer = $g.fs.createWriteStream(mypath);
  // const response = await Axios({
  // url,
  // method: "GET",
  // responseType: "stream",
  // });
  // response.data.pipe(writer);
  // return new Promise((resolve, reject) => {
  // writer.on("finish", resolve);
  // writer.on("error", reject);
  // });
}
$g.capture = async function (filename, selector, pos, notAdjust, offset) {
  var filePath = $g.getPath(filename) + imgSuffix,
    rc;
  if (selector) {
    if (await $g.domOp.exists(selector)) {
      try {
        await $g.acts.scrollToElement(selector);
        await $g.acts.captureSelector(filePath, selector);
        $g.sleep(2000);
      } catch (err) {
        $g.log.append($g.acts.current.name, JSON.stringify(err));
      }
    } else {
      $g.log.append($g.acts.current.name, "not found selector: " + selector);
    }
    if (!$g.fs.exists(filePath)) {
      $g.log.append($g.acts.current.name, "file " + filePath + " not found");
    }
  } else if (pos) {
    await $g.acts.capture(filePath, pos);
  } else {
    await $g.acts.capture(filePath);
  }
};
$g.getWaitSmsPath = function () {
  if (path_trans) {
    return $g.waitSmsPath + $g.sep + taskId;
  } else {
    return $g.waitSmsPath + $g.sep + "wait_sms";
  }
};
$g.getSmsPath = function () {
  if (path_trans) {
    return $g.smsPath + $g.sep + taskId;
  } else {
    return $g.smsPath + $g.sep + "sms";
  }
};
$g.getWaitReplyPath = function () {
  if (path_trans) {
    return $g.waitReplyPath + $g.sep + taskId;
  } else {
    return $g.waitReplyPath + $g.sep + "wait_reply";
  }
};
$g.getReplyPath = function () {
  if (path_trans) {
    return $g.replyPath + $g.sep + taskId;
  } else {
    return $g.replyPath + $g.sep + "reply";
  }
};
$g.getWaitPhonePath = function () {
  if (path_trans) {
    return $g.waitPhonePath + $g.sep + taskId;
  } else {
    return $g.waitPhonePath + $g.sep + "wait_phone";
  }
};
$g.getPhonePath = function () {
  if (path_trans) {
    return $g.phonePath + $g.sep + taskId;
  } else {
    return $g.phonePath + $g.sep + "phone";
  }
};
$g.copyWaitEmailVcodePath = function (params) {
  var tmp_task_file, target_file, name;
  if (path_trans) {
    name = taskId + '-emailvcode';
  } else {
    name = "wait_email_vcode";
  }
  tmp_task_file = $g.vcodeTmpPath + $g.sep + name;
  target_file = $g.waitEmailVCodePath + $g.sep + name;
  $g.fs.write(tmp_task_file, JSON.stringify({
    device: 'pc',
    id: '0',
    task_id: '0',
    user_id: '0',
    engine: params.engine ? params.engine : 'casper',
    script: params.script,
    task_type: 'email_vcode',
    params: {
      userName: params.email,
      passWord: params.pwd,
      execId: taskId
    }
  }));
  $g.fs.$rename(tmp_task_file, target_file);
};
$g.writeEmailVcode = function (params) {
  var tmp_task_file = $g.vcodeTmpPath + '/emailv_' + params.taskId,
    target_file;
  target_file = $g.emailVCodePath + $g.sep + "email_vcode";
  if (params.taskId) {
    target_file = $g.emailVCodePath + $g.sep + params.taskId;
  }
  $g.fs.write(tmp_task_file, $g.variables[params.name]);
  $g.fs.$rename(tmp_task_file, target_file);
};
$g.getEmailVCodePath = function () {
  if (path_trans) {
    return $g.emailVCodePath + $g.sep + taskId;
  } else {
    return $g.emailVCodePath + $g.sep + "email_vcode";
  }
};
$g.sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
$g.$ev = function (e, attr) {
  if (!attr) return e.text.trim();
  return $g.utils.isUndefined(e.attributes[attr]) ? '' : e.attributes[attr].toString().trim();
}
$g.$ticks = function (second) {
  return Math.floor(second * 1000.0 / 1000);
};
$g.getVCodeFilePath = function (filename, suffix) {
  var filePath;
  if (path_trans) {
    filePath = $g.vcodeImagePath + $g.sep + taskId + "_";
  } else {
    filePath = $g.vcodeImagePath + $g.sep;
  }
  filePath += filename + imgSuffix;
  if (suffix) filePath += suffix;
  return filePath;
};
$g.getVCodeTextPath = function (filename) {
  if (path_trans) {
    return $g.vcodeTextPath + $g.sep + taskId + "_" + filename;
  } else {
    return $g.vcodeTextPath + $g.sep + filename;
  }
};
$g.debugCapture = async function (filename, selector) {
  var filePath = $g.getPath(filename);
  if (selector) {
    if ($g.frameOffset !== false) {
      // var rc = await $g.domOp.getElementBounds(selector);
      // $g.adjustOffset(rc);
      // casper.scrollTo(rc.left, rc.top, true);
      // rc = casper.getElementBounds(selector);
      // if (!isVCman) $g.adjustOffset(rc);
      // casper.capture(filePath, rc);
    } else {
      // var rc = casper.getElementBounds(selector);
      await $g.acts.captureSelector(filePath, selector);
    }
  } else {
    await $g.acts.capture(filePath);
  }
};
$g.captureVCode = async function (filename, selector) {
  var tmpPath = $g.getPath("tmp_" + taskId + imgSuffix),
    rc;
  $g.fs.$remove(tmpPath);
  if ($g.utils.isString(selector) && selector.length > 0) {
    await $g.acts.captureSelector(tmpPath, selector);
  } else {
    await $g.acts.capture(tmpPath);
  }
  var copyOfVcode = $g.getPath("vcode_copy.jpg");
  await $g.sleep(10000);
  $g.fs.$cp(tmpPath, copyOfVcode);
  return tmpPath;
};
$g.$selector = function (selector) {
  if ($g.utils.isString(selector) || $g.utils.isNull(selector)) {
    if ($g.acts.current.foundex) {
      return finalizeFoundex($g.acts.current.foundex, selector);
    }
    return $g.finalizeString(selector);
  }
  return selector;
}
$g.parseCheckers = async function (checkers) {
  if (!$g.utils.isArray(checkers)) {
    checkers = [checkers];
  }
  return await $g._parseCheckers(checkers);
}
$g._parseCheckers = async function (checkers, op) {
  let suc = true;
  let aSelector;
  if (!op) {
    op = "and";
  }
  if (op == "or") {
    suc = false;
  }
  for (let i = 0, cnt = checkers.length; i < cnt; ++i) {
    let checker = checkers[i];
    if (!checker) {
      break
    }
    var tmp = false;
    if ($g.utils.isString(checker)) {
      checker = $g.getChecker(checker);
    }
    if ($g.utils.isArray(checker)) {
      tmp = await $g._parseCheckers(checker);
    } else if ($g.utils.isString(checker?.group)) {
      tmp = await $g._parseCheckers(checker.checkers, checker.group);
    } else {
      var type = checker.type.toLowerCase();
      var operator = checker.operator;
      if (type == "checkurl") {
        let url = await $g.domOp.getCurrentUrl();
        tmp = checkString(url, checker.expected, operator);
      } else if (type == "checkvisible") {
        aSelector = checker.selector;
        var visible = false;
        if (aSelector) {
          let isExist = await $g.domOp.exists(aSelector);
          let isVisible = await $g.domOp.visible(aSelector);
          visible = isExist && isVisible;
        }
        tmp = visible;
      } else if (type == "checkexist") {
        aSelector = checker.selector;
        var visible = false;
        if (aSelector) {
          let isExist = await $g.domOp.exists(aSelector);
          visible = isExist;
        }
        tmp = visible;
      } else if (type == "checknotvisible") {
        console.log("checknotvisible");
        aSelector = checker.selector;
        var visible = false;
        if (aSelector) {
          let isExist = await $g.domOp.exists(aSelector);
          let isVisible = await $g.domOp.visible(aSelector);
          visible = isExist && isVisible;
        }
        tmp = !visible;
      } else if (type == "checktext") {
        if (checker.variable) {
          tmp = checkString($g.variables[checker.variable] ? $g.variables[checker.variable] : "", checker.expected, operator);
        } else if (checker.value) {
          tmp = checkString($g.finalizeString(checker.value), checker.expected, operator);
        } else {
          var text = "",
            textArray = [];
          aSelector = $g.$selector(checker.selector);
          let tOnlyOne = false;
          let isExist = await $g.domOp.exists(aSelector);
          if (isExist) {
            let teles = await $g.domOp.getElementsInfo(aSelector);
            if (teles.length > 1) {
              if (checker.checkOne) {
                for (var teli = 0; teli < teles.length; ++teli) {
                  textArray.push($g.trimAllSpaces($g.$ev(teles[teli], checker.from)));
                }
              } else {
                tOnlyOne = true;
                if (!checker.index) checker.index = 0;
                if (checker.index < teles.length) {
                  teles = checker.index ? teles[checker.index] : teles[0];
                } else {
                  $g.log.append('checktext', "Element index out of bound: " + checker.index.toString() + '/' + teles.length + '. Selector:' + aSelector);
                }
              }
            } else {
              teles = teles[0];
              tOnlyOne = true;
            }
            if (!checker.checkOne || tOnlyOne) {
              text = $g.trimAllSpaces($g.$ev(teles, checker.from));
            }
          }
          if (textArray.length > 0) {
            for (var tai = 0; tai < textArray.length; ++tai) {
              tmp = checkString(trimData(checker.trims, textArray[tai]), checker.expected ? $g.trimAllSpaces(checker.expected) : "", operator);
              if (tmp) break;
            }
          } else {
            tmp = checkString(trimData(checker.trims, text), checker.expected ? $g.trimAllSpaces(checker.expected) : "", operator);
          }
        }
      } else if (type == "checkvariable") {
        if (!checker.name) {
          tmp = $g.checkVar(checker.value, checker.expected, operator);
        } else {
          if ($g.utils.isUndefined($g.variables[checker.name])) {
            tmp = false;
          } else {
            var v = $g.variables[checker.name];
            if ($g.utils.isString(checker.expected)) {
              tmp = checkString(v, checker.expected, operator);
            } else {
              tmp = $g.checkVar(v, checker.expected, operator);
            }
          }
        }
      } else if (type == "checkinterval") {
        let interval = 60000;
        tmp = false;
        if (checker.interval) interval = checker.interval;
        let cucrrentTime = new Date().getTime();
        let realInterval = cucrrentTime - $g.lastSaveTime;
        if (realInterval > interval) {
          $g.lastSaveTime = cucrrentTime;
        }
        if (operator == ">" && realInterval >= interval) {
          tmp = true;
        }
        if (operator == "<" && realInterval < interval) {
          tmp = true;
        }
      }
    }
    if (op == "or") {
      suc |= tmp;
    } else {
      suc &= tmp;
    }
    if (suc && op == "or") {
      break;
    } else if (!suc && op == "and") {
      break;
    }
  }
  return suc;
}
$g.setAllLoopVariables = function (params) {
  if (!params || !params.loopTagLabel || !$g.utils.isObject(params) || !$g.utils.isObject(params.loopTagLabel)) return;
  for (var p in params.loopTagLabel) {
    var loopTag = params.loopTagLabel[p];
    if ($g.variables[loopTag]) {
      allLoopVariables[p] = $g.variables[loopTag];
    }
  }
};
$g.domOp = {
  exec: async function (script) {
    let execScript = "try {" + script + "}catch(error){console.log(error);}"
    // let execScript = script;
    // $g.scriptExecResult = '_init';
    // let data = {
    //   func: "executeJavaScript",
    //   args: execScript
    // }
    // win.webContents.send('execScript', data);
    // while ($g.scriptExecResult == '_init') {
    //   await $g.sleep(5000);
    // }
    // let result = $g.scriptExecResult;
    // $g.scriptExecResult = '_init';
    // return result;
    /**
    let retryCount = 0
    while (retryCount < 1) {
      retryCount++
      if (win.webContents.isLoading()) {
        //$g.log.append('executejs', 'contens isLoading');
        await $g.sleep(2000);
        continue;
      }
      break;
    }
    if (win.webContents.isLoading()) {
      win.webContents.stop();
    }
    **/
    if (!$g.webContentsStopFlag) {
      win.webContents.stop();
      $g.webContentsStopFlag = true;
    }
    try{
      return await win.webContents.executeJavaScript(execScript)
    }catch(error){
      $g.log.append('call error', error)
      result = TASK_CALL_ERROR
      $g.acts.ignoreAll($g.errors_code.ACTION_EXCEPTION);
      $g.capture("last_step")
      $g.log.finish(result)
    }
    
  },
  exists: async function (selector) {
    let script = "window.clientUtilsObj.exists(\"" + selector + "\")";
    return await this.exec(script);
  },
  visible: async function (selector) {
    let script = "window.clientUtilsObj.visible(\"" + selector + "\")";
    $g.utils.dump($g.frameOffset);
    return await this.exec(script);
  },
  getCurrentUrl: async function () {
    let script = "document.location.href";
    return await this.exec(script);
  },
  getElementsInfo: async function (selector) {
    if (!await this.exists(selector)) {
      return false;
    }
    let script = "window.clientUtilsObj.getElementsInfo(\"" + selector + "\")";
    return await this.exec(script);
  },
  getElementBgImageBase64: async function (selector) {
    if (!await this.exists(selector)) {
      return false;
    }
    let script = "window.clientUtilsObj.getElementBgImageBase64(\"" + selector + "\")";
    return await this.exec(script);
  },
  getElementInfo: async function (selector) {
    if (!await this.exists(selector)) {
      return false;
    }
    let script = "window.clientUtilsObj.getElementInfo(\"" + selector + "\")";
    return await this.exec(script);
  },
  getElementsBounds: async function (selector) {
    if (!await this.exists(selector)) {
      return false;
    }
    let script = "window.clientUtilsObj.getElementsBounds(\"" + selector + "\")";
    return await this.exec(script);
  },
  getElementBounds: async function (selector) {
    if (!await this.exists(selector)) {
      return false;
    }
    let script = "window.clientUtilsObj.getElementBounds(\"" + selector + "\")";
    return await this.exec(script);
  },
  getWindowSize: async function () {
    let script = "window.clientUtilsObj.getWindowSize()";
    return await this.exec(script);
  },
  scrollToBottom: async function () {
    let script = "window.clientUtilsObj.scrollToBottom()";
    return await this.exec(script);
  },
  getHTML: async function (selector) {
    selector = selector ? selector : 'html';
    let script = "window.clientUtilsObj.getHTML(\"" + selector + "\")";
    return await this.exec(script);
  },
  getScrollTop: async function () {
    let script = "parent.document.documentElement.scrollTop";
    return await this.exec(script);
  },
  childFramesCount: async function () {
    let script = "window.frames.length";
    return await this.exec(script);
  },
  switchToParentFrame: async function () {
    $g.frameOffset = false;
    let data = {
      func: "switchParentFrame",
      selector: false
    }
    win.webContents.send('execScript', data);
    await $g.sleep(2000);
  },
  switchToChildFrame: async function (selector, offset) {
    let data = {
      func: "switchChildFrame",
      selector: selector
    }
    win.webContents.send('execScript', data);
    console.log("switchToChildFrame", "=================");
    await $g.sleep(2000);
  },
  capture: async (rc, targetPath) => {
    const ticket = authorizeCapture(win.webContents, targetPath, $g.taskPath, rc);
    let data = {
      func: "__cap",
      args: [ticket]
    }
    win.webContents.send('execScript', data);
  }
}
$g.scrollToBottom = async () => {
  $g.debug('scroll to bottom');
  await $g.domOp.scrollToBottom();
}

$g.acts.scrollToElement = async (aSelector) => {
  let scrollTop = await $g.domOp.getScrollTop();
  let screenSize = await $g.domOp.getWindowSize();
  let isVisible = await $g.domOp.visible(aSelector);
  if (!isVisible) {
    let msg = "selector: " + aSelector + " is not visible";
    $g.log.append($g.acts.current.name, msg);
    return;
  }
  let ele = await $g.domOp.getElementInfo(aSelector);
  var y = ele.y;
  if ($g.frameOffset) {
    y = $g.frameOffset.top + y;
    aSelector = false;
  }
  // if (y > 0) {
  //     y = y + scrollTop + 50;
  // } else {
  //     y = y + scrollTop - 50;
  // }
  y = y + scrollTop - 200;
  $g.log.append("===============", y);
  if ($g.quikMode) {
    let script = "window.clientUtilsObj.scrollTo(" + ele.x + ", " + y + ")";
    await $g.domOp.exec(script);
  } else {
    await $g.acts.scrollToPos(aSelector, ele.x, y);
  }
}
$g.acts.scrollToPos = async (aSelector, x, y) => {
  var screenSize = await $g.domOp.getWindowSize();;
  var realX = 0,
    realY = 0,
    deltaY = 0;
  var lastTime = new Date().getTime();
  var interval = 1000;
  var startTime = new Date().getTime();
  let posTop = $g.posTop;
  if ($g.frameOffset) posTop = $g.posTop + $g.frameOffset.top;
  while (true) {
    var currentTime = new Date().getTime();
    if (currentTime - startTime >= 120000) break;
    if (currentTime - lastTime >= interval) {
      interval = parseInt(Math.random() * 2000);
      // var scrollPer = parseInt(Math.random() * 500);
      lastTime = currentTime;
      if (aSelector) {
        let ele = await $g.domOp.getElementInfo(aSelector);
        var pos = ele.y;
        var isScrollBottom = false;
        var scrollTop = 100;
      } else {
        var scrollTop = await $g.domOp.getScrollTop();
        var pos = y - scrollTop;
        var isScrollBottom = await $g.domOp.exec("window.clientUtilsObj.isScrollBottom()");
      }
      if (isScrollBottom || (pos >= $g.posTop && pos < screenSize.height - $g.posBottom) || (pos < 0 && scrollTop === 0)) {
        if (!$g.classicMode) {
          realX = Math.ceil(x);
          realY = Math.ceil(y);
          let script = "window.clientUtilsObj.scrollTo(" + realX + ", " + realY + ")";
          await $g.domOp.exec(script);
        }
        break;
      } else if (pos < 0) {
        // realX = Math.ceil(x);
        // realY = Math.ceil(scrollTop - scrollPer);
        deltaY = Math.random() * 200;
      } else {
        // realX = Math.ceil(x);
        // realY = Math.ceil(scrollTop + scrollPer);
        deltaY = Math.random() * -200;
      }
      await win.webContents.sendInputEvent({
        type: 'mouseWheel',
        x: $g.basePos.x,
        y: $g.basePos.y,
        canScroll: true,
        deltaX: 0,
        deltaY: deltaY
      });
      // let script = "window.clientUtilsObj.scrollTo("+realX+", "+realY+")";
      // await $g.domOp.exec(script);
    }
  }
}
$g.acts.update = function (params) {
  if (params._show_step) {
    return;
  }
  $g.log.append("lastSaveTime", $g.lastSaveTime);
  $g.loopVariables = false;
  if (params._isInLoop && allLoopVariables[params._loopTag]) {
    if (params._loopRealIndex < allLoopVariables[params._loopTag].length) {
      $g.loopVariables = $g.clone(allLoopVariables[params._loopTag][params._loopRealIndex]);
      $g.finalizeObject($g.loopVariables, true);
    }
  }
  $g.showStepTime();
  var curTime = new Date();
  $g.acts.current.time = curTime.getTime();
  $g.log.append("currentTimeTag", curTime.getTime());
  updateCurrentTime();
  // $g.variables._current_url_ = await $g.domOp.getCurrentUrl();
  processCurrentUrl();
  params._show_step = true;
  $g.capture("last_step");
  if (enableStepCapture) {
    $g.capture('step_' + params._step);
  }
  $g.acts.current.name = params._actionName;
  $g.acts.current.step = params._step;
  $g.acts.current.found = false;
  $g.acts.current.left = params._left;
  $g.acts.current.params = params;
  var msg = ". Index: " + $g.acts.current.step + ". Left: " + params._left;
  if (params._isInLoop) {
    msg += ". Loop index: " + params._loopIndex.toString() + ". Loop action index: " + params._loopActionIndex;
    $g.variables.currentCustor = params._loopRealIndex + 1;
    for (const key in params) {
      if (key.startsWith('_')) continue;
      if ($g.utils.isObject(params[key]))
        params[key] = JSON.parse($g.replaceAll(JSON.stringify(params[key]), ".##.", "." + params._loopIndex + "."));
      else if ($g.utils.isString(params[key]))
        params[key] = $g.replaceAll(params[key], ".##.", "." + params._loopIndex + ".");
      else
        continue;
    }
  }
  $g.debug("Running: " + $g.acts.current.name + msg);
  $g.log.append($g.acts.current.name, msg);
};
$g.acts.to = function (params) {
  if (params.to == "end") {
    $g.acts.success();
    return;
  } else if (params.to == "last") {
    $g.acts.toEnd();
    return;
  }
  var delta = $g.getDelta(params);
  if (delta > 0) {
    $g.acts.ignore(delta - 1);
  } else if (delta < 0) {
    $g.acts.ignoreAll($g.errors_code.ACTION_EXCEPTION);
  }
};
$g.acts.toLabel = function (label, params) {
  var stepCnt;
  if (label == '@@jump_label@@') label = $g.jump_label;
  if ($g.labels[label]) {
    stepCnt = $g.labels[label] - params._step - 1;
    $g.log.append('jump', "Jump to label: " + label + ". Ignore steps: " + stepCnt.toString());
    $g.acts.ignore(stepCnt);
    $g.debug("Jump success");
  } else if (params._isInLoop && $g.loopLabels[params._loopTag][params._loopIndex][label]) {
    stepCnt = $g.loopLabels[params._loopTag][params._loopIndex][label] - params._step - 1;
    $g.debug("Jump to loop label: " + ". Ignore steps: " + stepCnt.toString());
    $g.acts.ignore(stepCnt);
    $g.debug("Jump success");
  } else {
    $g.acts.ignoreAll($g.errors_code.ACTION_EXCEPTION);
  }
};
$g.acts.success = function () {
  $g.bypass($g.acts.current.left);
};
$g.acts.toEnd = function () {
  $g.bypass($g.acts.current.left - 1);
};
$g.acts.continue_loop = function (params) {
  if (params._isInLoop) $g.bypass(params._continueLoop);
};
$g.acts.exit_loop = function (params) {
  if (params._isInLoop) $g.bypass(params._exitLoop);
};
$g.acts.ignoreAll = function (errText) {
  var params = $g.acts.current.params || false;
  $g.showStepTime();
  if (params && params.toTarget) {
    $g.targets.push({
      name: params.toTarget.name,
      data: params.toTarget.data || ''
    });
  }
  if (params && params.ignore) return;
  if (result==TASK_BROWSER_IS_CLOSE)
    result = TASK_FAILED;
  $g.errors.exit_codes.push(errText);
  var msg = "Operation failed and all left actions are ignored after step: " + $g.acts.current.step + ". Remain step count is: " + $g.acts.current.left + ".";
  if (errText) {
    msg += " Failed reason: " + errText;
  }
  msg += ". Current url: " + '';
  $g.debug(msg);
  $g.log.append($g.acts.current.name, msg);
  ignoreLeftSteps();
  onFinish();
  // console.log('ignoreAll');
  // $g.echoLog('ignoreAll');
  // exitProcess(1);
}
$g.acts.ignore = function (step) {
  $g.bypass(step);
}
$g.bypass = function (nb) {
  var step = $g.currentStep,
    last = allActions.length;
  $g.currentStep = Math.min(step + nb, last);
}
$g.saveResultEx = function () {
  var hasEx = false;
  for (var p in $g.resultsEx) {
    hasEx = true;
    break;
  }
  if (hasEx) {
    //$g.log.append('save result_ex.txt', 'engine save result_ex.txt');
    $g.fs.write($g.getPath("result_ex.txt"),
      JSON.stringify($g.resultsEx));
  }
};
$g.getPath = function (filename) {
  return $g.taskPath + $g.sep + filename;
};
$g.saveResults = function () {
  $g.debug("save result");
  if (hasLoop) {
    $g.fs.write($g.getPath("loop.txt"),
      JSON.stringify(loopResult));
  }
  if ($g.results) {
    $g.fs.write($g.getPath("result.txt"),
      JSON.stringify($g.results));
  }
  $g.saveResultEx();
  if ($g.forms !== false) {
    $g.fs.write($g.getPath("form.txt"),
      JSON.stringify($g.forms));
  }
};
$g.saveTargets = async function (targets, filePath, targetFrame) {
  var texts = [];
  // if (targetFrame) $toFrame(targetFrame);
  if ($g.targets) {
    for (var i = 0; i < $g.targets.length; ++i) texts.push($g.targets[i]);
  }
  if (targets) {
    if ($g.utils.isString(targets)) {
      targets = $g.$ARR(targets);
    } else if ($g.utils.isArray(targets)) {

    } else {
      // if (targets.toFrame) {
      //     $toFrame(targets.toFrame);
      // }
      targets = $g.$ARR(targets.selectors);
    }
    for (var i = 0; i < targets.length; ++i) {
      var t = targets[i];
      // if (t.toFrame) $toFrame(t.toFrame);
      if (t.code) {
        t.code = $g.finalizeString(t.code, undefined, true); 
      }
      if (t.checkers) {
        if (await $g.parseCheckers(t.checkers)) {
          texts.push({
            s: t.name,
            t: t.data ? t.data : ""
          });
          if (t.code) $g.errors.exit_codes.push(t.code);
        }
        // if (t.toFrame) $backFrame();
        continue;
      }
      if (!await $g.domOp.exists(t.selector) || !await $g.domOp.visible(t.selector)) {
        if (t.toFrame) $backFrame();
        continue;
      }
      var ele = await $g.domOp.getElementInfo(t.selector);
      //$g.debug(ele);
      var data = $g.$ev(ele, t.from);
      if (data.length > 0) {
        texts.push({
          s: t.name,
          t: data
        });
        if (t.code) $g.errors.exit_codes.push(t.code);
      }
      // if (t.toFrame) $backFrame();
    }
  }
  if (texts.length > 0) {
    var st = JSON.stringify(texts);
    $g.fs.write(filePath, st);
    $g.log.append('save target', st);
  }
}

function trimData(trims, data) {
  if (!trims) return data;
  trims = $g.$ARR(trims);
  for (var i = 0; i < trims.length; ++i) {
    data = $g.$trim(data, trims[i]);
  }
  return data;
}

function checkString(src, target, operator) {
  target = $g.finalizeString(target);
  console.log(src);
  console.log(target);
  if (!$g.utils.isString(operator)) {
    return true;
  }
  //$g.debug('src: ' + src + ' target: ' + target);
  operator = operator.toLowerCase();
  if (operator == "contain") {
    return src.indexOf(target) != -1;
  } else if (operator == "notcontain") {
    return src.indexOf(target) == -1;
  } else if (operator == 'leftcontain') {
    return target.indexOf(src) === 0;
  } else if (operator == "equal") {
    return src == target;
  } else if (operator == "notequal") {
    return src != target;
  } else if (operator == "startswith") {
    return src.startsWith(target);
  } else if (operator == "notstartswith") {
    return !src.startsWith(target);
  } else if (operator == "endswith") {
    return src.endsWith(target);
  } else if (operator == "notendswith") {
    return !src.endsWith(target);
  } else if (operator == "in") {
    target = $g.$ARR(target);
    for (var i = 0; i < target.length; ++i) {
      if (src == target[i]) {
        return true;
      }
    }
    return false;
  } else if (operator == 'isdigit') {
    return (/^\d+$/).test(src) ? true : false;
  } else if (operator == 'isnotdigit') {
    return (/^\d+$/).test(src) ? false : true;
  } else if (operator == "equal") {
    return src == target;
  } else if (operator == "notequal") {
    return src != target;
  } else if (operator == "notempty") {
    return !$g.isEmpty(src);
  } else if (operator == "empty") {
    return $g.isEmpty(src);
  }
  return true;
}

function saveTargets() {
  $g.saveTargets(taskConfig.targets || false, $g.getPath("targets"), taskConfig.targetFrame);
}

function _finalizeString(variables, str, prefix) {
  for (var name in variables) {
    var v = variables[name];
    if ($g.utils.isString(v) || $g.utils.isNumber(v)) {
      str = $g.replaceAll(str, "@@" + prefix + name + "@@", v);
    } else if ($g.utils.isObject(v)) {
      str = _finalizeString(v, str, prefix + name + '.');
    }
  }
  return str;
}

function ignoreLeftSteps() {
  var deta = $g.acts.current.left;
  if (deta > 0) $g.bypass(deta);
}

function saveLastLoopIndex(params) {
  if (!$g.acts.current.params || !$g.acts.current.params._isInLoop) return;
  var curParams = params || {};
  if (!curParams._isInLoop || curParams._loopIndex != $g.acts.current.params._loopIndex) {
    loopResult[$g.acts.current.params._loopTag] = $g.acts.current.params._loopRealIndex;
    hasLoop = true;
  }
}
var savedFinishedStatus = false;

async function onFinish(bSuc) {
  savedFinishedStatus = true;
  try {
    $g.log.append("exit", 'bSuc: ' + (bSuc ? 'true' : 'false'));
  } catch (e) {
    $g.log.append('exit exception', e.stack);
  }
  try {
    saveLastLoopIndex();
    $g.saveResults();
    saveTargets();
    if (win) {
      let fileName = 'content.htm';
      $g.fs.write($g.getPath(fileName), await $g.domOp.getHTML());
    }
  } catch (e) {
    $g.log.append('exit exception', e.stack);
  }
}

function _finalizeString(variables, str, prefix) {
  for (var name in variables) {
    var v = variables[name];
    if ($g.utils.isString(v) || $g.utils.isNumber(v)) {
      str = $g.replaceAll(str, "@@" + prefix + name + "@@", v);
    } else if ($g.utils.isObject(v)) {
      str = _finalizeString(v, str, prefix + name + '.');
    }
  }
  return str;
}

$g.finalizeString = function (str, ignoreLoopVariables, errors) {
  if ($g.utils.isNull(str)) return "";
  if (!$g.utils.isString(str)) return str;
  //$g.debug("Before Finalize: " + str);
  //$g.debug($g.variables);
  if (errors) {
    str = _finalizeString($g.errors_code, str, "");
  }
  if (!ignoreLoopVariables && $g.loopVariables) str = _finalizeString($g.loopVariables, str, "");
  str = _finalizeString($g.tmpVariables,
    _finalizeString($g.variables, str, ""), "");
  // $g.debug("After Finalize: " + str);
  return str;
};


$g.echoLog = function (msg) {
  $g.debug($g.acts.current.name);
  $g.debug(msg);
  $g.log.append($g.acts.current.name, msg);
};

$g.debug = function (msg) {
  if (!$g.inDebug) {
    return;
  }
  const date = new Date();
  let currentTime = `${date.getFullYear()}-${$g.utils.dateRepaire(date.getMonth()+1)}-${$g.utils.dateRepaire(date.getDate())} ${$g.utils.dateRepaire(date.getHours())}:${$g.utils.dateRepaire(date.getMinutes())}:${$g.utils.dateRepaire(date.getSeconds())}`
  if (arguments.length > 1) {
    var str = '';
    for (var i = 0, cnt = arguments.length; i < cnt; ++i) {
      var v = arguments[i];
      if ($g.utils.isString(v)) {
        str += v;
      } else {
        str += JSON.stringify(v);
      }
      str += ' ';
    }
    console.log(currentTime + '  ' + str);
    return;
  }
  if ($g.utils.isString(msg)) {
    console.log(currentTime + '  ' + msg);
  } else {
    $g.utils.dump(msg);
  }
};

$g.engineError = function (msg) {
  $g.debug(msg);
  if ($g.log) {
    $g.log.append('errorMsg', msg);
  }
  result = TASK_CODE_ERROR;
  $g.isFailure = true;
}
$g.getChecker = function (name) {
  if (taskConfig.checkers) {
    return taskConfig.checkers[name];
  }
  return false;
};

$g.checkVar = function (src, target, operator, trim) {
  operator = operator.toLowerCase();
  if (trim) {
    src = $g.trim(src);
  }
  if (operator == "equal") {
    return src == target;
  } else if (operator == "notequal") {
    return src != target;
  } else if (operator == "notempty") {
    return !$g.isEmpty(src);
  } else if (operator == "empty") {
    return $g.isEmpty(src);
  }
  return false;
}

$g.checkCondition = async function (condition) {
  if (!condition) {
    return true;
  }
  if (condition.checkVar) {
    var cons = $g.$ARR(condition.checkers);
    for (var j = 0; j < cons.length; ++j) {
      if (!$g.variables[cons[j].name]) {
        return false;
      }
      var v = $g.variables[cons[j].name];
      if (cons[j].field) {
        v = $g.variables[cons[j].name][cons[j].field];
      }
      if (!$g.checkVar(v, cons[j].target, cons[j].operator, cons[j].trim ? true : false)) {
        return false;
      }
    }
    $g.debug("var check is success");
    return true;
  }
  if (!await $g.parseCheckers(condition.checkers, true)) {
    if (condition.failWhenFalsy) {
      $g.acts.ignoreAll($g.errors_code.NOT_FIND_ELEMENT);
    }
    return false;
  }
  return true;
}

$g.echoMsg = (msg, writeTag) => {
  console.log(msg);
}

function abortRequest(requestData) {
  if (!taskConfig) return false;
  if (taskConfig.ignoreUrls) {
    var ignoreUrls = $g.$ARR(taskConfig.ignoreUrls);
    for (var i = 0; i < ignoreUrls.length; ++i) {
      if (requestData.url.indexOf(ignoreUrls[i]) != -1) {
        return true;
      }
    }
  }
  if (taskConfig.notNeedImageData && requestData.url.startsWith('data:')) {
    return true;
  }
  // if (taskConfig.loadImages === false) {
  //   var imgPattern1 = new RegExp(".+/.+(\.jpg|\.gif|\.png|\.mp4)$", "i");
  //   if (imgPattern1.test(requestData.url)) {
  //     return true;
  //   }
  // }
  return false;
}

function webRequestFilter() {
  $g.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (abortRequest(details)) {
      return callback({
        cancel: false,
        redirectURL: 'https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZIVX-5C-b.ico'
      });
    }
    return callback({})
  })
}

/**
 * 解析脚本
 */
function loadScript() {
  let script = $g.fs.read(scriptJsonFile, 'utf-8');
  return JSON.parse(script);
}

/**
 * 检查脚本是否执行完成
 */
async function checkTaskFinished() {
  $g.log.append('check finish', 'start')
  let isFinished = false;
  if ($g.isFailure || allActions.length <= $g.currentStep || $g.setTaskFinished) {
    var curTime = new Date().getTime();
    var msg = "-------------> Total time: " + (curTime - start_time) + " ms.";
    $g.debug(msg);
    $g.log.append('exit', msg);
    if ($g.classicMode) {
      if (result == TASK_BROWSER_IS_CLOSE) result = TASK_SUCCESS;
      $g.log.append('check finish', `result: ${result}`)
      $g.log.finish(result);
    }

    onFinish();
    $g.debug("task is finished");
    isFinished = true;

    if ($g.netWorkParseFlag && taskConfig && taskConfig.networkSwitch === true) {
      $g.netWorkParseFlag = false
      try {
        $g.resultsEx = {}
        $g.networkStartTime = 0
        await require('./network_data_parse/index').DataParse($g)
        if (taskConfig.keepNetworkLog == true || taskConfig.continueCrawlFlag) {
          $g.log.append('network', 'keep network log')  
        } else {
          $g.fs.removeDir($g.networkPath)
        }
      } catch (error) {
          $g.log.append("DataParse Error", error);
      }
    }

  }
  return isFinished;
}

async function getContinueTaskInfo() {
  if ($g.continueTaskFile) {
    if ($g.fs.exists($g.continueTaskFile)) {
      let scriptFile = $g.fs.read($g.continueTaskFile)
      if (scriptFile){
        scriptFile = scriptFile.trim()
      }
      if(!scriptFile || !$g.fs.exists(scriptFile)){
        scriptJsonFile = false
        $g.debug('continue_task', `task file: ${$g.continueTaskFile} not found script file: ${scriptFile}`)
      } else {
        baseDir =  $g.path.parent(scriptFile)
        /**
        //if task path has log file, the task already run need clear
        if ($g.fs.exists(path.join(baseDir, 'log'))) {
          scriptJsonFile = false
          $g.debug('continue_task', `task path already exists log file, ${scriptFile}`)
          $g.fs.write($g.continueTaskFile, '')
        } else {
          
        }
        **/
        scriptJsonFile = scriptFile
        $g.taskPath = $g.path.parent(scriptJsonFile);
        $g.debug('continue_task', `baseDir: ${baseDir}`)
        var log = new $g.common.log($g.taskPath)
        $g.log = log   
      }
    } else {
      $g.acts.ignoreAll($g.errors_code.SCRIPT_ILLEGAL);
    }
  } else if(taskConfig.continueCrawlFlag) {
    $g.log.append('continue_crawl', `get script $g.process: ${$g.processing}`)
    if (!$g.processing) {
      await Crawler.processCrawlSave()
      const continueCrawlTimeout = taskConfig.continueCrawlTimeout || taskConfig.crawlOptions?.continueCrawlTimeout || 1800
      const currentTime = new Date().getTime();
      let finishFlag = false
      if ( currentTime - start_time > continueCrawlTimeout*1000) {
        $g.log.append('continue', 'reach timetout: ' + (currentTime - start_time))
        finishFlag = true
      } 
      if (!finishFlag && $g.fs.exists($g.getPath('targets'))) {
        const targetsInfos = $g.$json($g.getPath('targets')) || []
        $g.log.append('debug targets', JSON.stringify(targetsInfos))
        for (const info of targetsInfos) {
          $g.log.append('debug', JSON.stringify(info))
          if (info.s == 'accountNotActive' || info.s == 'accountPwdIssue') {
            finishFlag = true
            break
          }
        }
      }
      if (!finishFlag) {
        $g.log.append('continue', 'timetout: ' + (currentTime - start_time))
        taskConfig.actions = []
        taskConfig = await Crawler.processCrawlParams(taskConfig)
        if (taskConfig.actions.length == 0) {
          $g.log.append('continue', 'process crawl not new actions')
          finishFlag = true
        }
        $g.log.append('continue', 'after process crawl params timetout: ' + (currentTime - start_time))
      }
        
      if (finishFlag) {
        taskConfig.continueCrawlFlag = false
        $g.classicMode = true
        taskConfig.actions = [{"name":"wait", "params":{"interval":3000}}]
        $g.log.finish(result)
      }
      let scriptFile = "script_" + new Date().getTime();
      scriptJsonFile = path.join($g.taskPath, scriptFile);
      $g.fs.write(scriptJsonFile, JSON.stringify(taskConfig));
      $g.log.append('continue_crawl', `script file: ${scriptJsonFile}`)
    }
  } else {
    scriptJsonFile = path.join(baseDir, 'task', 'script');
    if (scriptJsonFile && $g.isWin) {
      scriptJsonFile = scriptJsonFile.replaceAll('/', '\\');
    }
  }
}

$g.changeMode = async () => {
  var log = new $g.common.log($g.taskPath);
  $g.log = log;
  if (!$g.classicMode) {
    await getContinueTaskInfo();
    setInterval(async () => {
      $g.debug(`continue_task $g.processing: ${$g.processing}`)
      if (!$g.processing && !$g.getContinueTaskFlag) {
        $g.getContinueTaskFlag = true;
        await getContinueTaskInfo();
        let isExists = $g.fs.exists(scriptJsonFile);
        $g.debug(`continue_task scriptJsonFile:${scriptJsonFile}, isExists:${isExists}`)
        if (isExists) {
          taskConfig = loadScript();
          setProxy();
          //result = TASK_BROWSER_IS_CLOSE;

          allLoopVariables = {};
          allActions = [];
          hasLoop = false;
          loopResult = {};
          $g.currentStep = 0;
          $g.variables = {};
          $g.results = [];
          $g.resultsEx = {};
          $g.targets = [];

          $g.processing = true;
          $g.continueTaskChekStep = -1;
          $g.continueTaskChekTime = new Date().getTime();
          console.log("exec new script");
          $g.netWorkParseFlag = true
          this.execScript(win);
        }
        $g.getContinueTaskFlag = false;
      } else {
        if ($g.continueTaskChekStep != $g.acts.current.step) {
          $g.continueTaskChekStep = $g.acts.current.step;
          $g.continueTaskChekTime = new Date().getTime();
        } else {
          const currentTime = new Date().getTime();
          if (currentTime - $g.continueTaskChekTime > 10*60000) {
            $g.debug(`continue_task check step timeout ... last Log time :${$g.continueLogTime}`);
            if (currentTime - $g.continueLogTime > 10*60000) {
              result = TASK_CHECK_STEP_TIMEOUT;
              $g.classicMode = true;
              $g.acts.ignoreAll($g.errors_code.TIMEOUT);
              $g.capture("last_step");
              /*
              const wc = win.webContents;
              try{
                wc.debugger.attach("1.1");
              }catch(error){
                $g.log.append("Error wc.debugger", error);
              }
              try{
                const {root} = await wc.debugger.sendCommand("DOM.getDocument", {});
                const { outerHTML } = await wc.debugger.sendCommand("DOM.getOuterHTML", { nodeId: root.nodeId });
                $g.fs.write($g.getPath("cdp_content.html"), outerHTML);
              }catch(error){
                $g.log.append("Error get html", error);
              }
              **/
              $g.log.finish(result);
              $g.fs.write($g.continueTaskFile, 'reboot');
              $g.processing = false;
              if (taskConfig.continueCrawlFlag) {
                taskConfig.continueCrawlFlag = false
                $g.classicMode = true
              }
              win.destroy()
              process.exit()
            }
          }
        }
      }
    }, 10000);
  } else {
    $g.continueTaskChekStep = -1;
    let checkMemoryCount = 0
    setInterval(async () => {
      let existFlag = false
      if (taskConfig && taskConfig.checkMemoryRate) {
        const memInfo = process.getSystemMemoryInfo()
        const memRate = 1 - memInfo.free / memInfo.total
        $g.log.append('mem', 'mem rate:' + memRate + ' , ' + JSON.stringify(memInfo))
        if (memRate > 0.965) {
          checkMemoryCount++
        } else {
          checkMemoryCount = 0
        }
        if (checkMemoryCount >= 5) {
          existFlag = true
        }
      }
      //$g.debug('check task timeout ...')
      if ($g.continueTaskChekStep != $g.acts.current.step) {
        $g.continueTaskChekStep = $g.acts.current.step;
        $g.continueTaskChekTime = new Date().getTime();
      } else {
        const currentTime = new Date().getTime();
        if ($g.acts.current.name!='finishNetwork' && currentTime - $g.continueTaskChekTime > 20*60000) {
          existFlag = true
        }
        if ( currentTime - start_time > 30*60000) {
          //existFlag = true
        }
      }
      if (existFlag) {
        clearInterval($g.execIntervalFlag);
        win.loadURL('about:blank');
        await $g.sleep(1000)
        result = TASK_CHECK_STEP_TIMEOUT;
        $g.log.append('check', `task step timeout ... last Log time :${$g.continueLogTime}`);
        const memInfo = process.getSystemMemoryInfo()
        const memRate = 1 - memInfo.free / memInfo.total
        $g.log.append('mem', 'mem rate:' + memRate + ' , ' + JSON.stringify(memInfo))
        //win.destroy()
        //process.exit()
        /*
        $g.acts.ignoreAll('browser acton timeout');
        $g.log.finish(result);
        try {
          $g.resultsEx = {}
          $g.networkStartTime = 0
          require('./network_data_parse/index').DataParse($g)
          if (taskConfig.keepNetworkLog == true) {
            $g.log.append('network', 'check task keep network log')
          } else {
            $g.fs.removeDir($g.networkPath)
          }
        } catch (error) {
            $g.log.append("check DataParse Error", error);
        }
        process.exit();
        **/
      }
    }, 30000);
  }
}

async function listenHandler() {
  var listenHandler = taskConfig.listenHandler;
  if (listenHandler) {
    $g.listenIntervalFlag = setInterval(async () => {
      for (let i = 0; i < listenHandler.length; i++) {
        // var listenObj = listenHandler[i];
        // let name = listenObj['name'],
        //     params = listenObj['params'],
        //     condition = listenObj['condition'] ? listenObj['condition'] : false;
        // if ($g.actions[name]) {
        //     if (await $g.checkCondition(condition)) {
        //         await $g.actions[name](params, condition, true);
        //     }
        // }
        var code = listenHandler[i];
        console.log(code);
        await $g.domOp.exec(code);
      }
    }, 60000)
  }

}
/**
 * 执行脚本
 */
async function startExec() {
  $g.log.append('start', "start_exec: step count: " + allActions.length);
  $g.execIntervalFlag = setInterval(async function () {
    if ($g.taskPause) return;
    // console.log($g.processExecTag);
    // console.log($g.variables);
    let currentTime = new Date().getTime();
    if ($g.classicMode && $g.processExecTag &&
      currentTime - $g.currentActionStartTime > $g.stepTimeout) {
      $g.acts.ignoreAll($g.errors_code.TIMEOUT);
      $g.processExecTag = false;
    }
    if (!$g.processExecTag) {
      //检查任务是否完成
      if (await checkTaskFinished()) {
        clearInterval($g.execIntervalFlag);
        if ($g.continueTaskFile) {
          $g.fs.write($g.continueTaskFile, '')
        }
        $g.processing = false;
        if ($g.classicMode) {
          await $g.sleep(5000);
          $g.log.finish(result);

          setInterval(() => {
            win.destroy()
            process.exit()
          }, 2000);
        } else {
          let resultFile = path.join(taskDir, 'result_ex.txt');
          if ($g.fs.exists(resultFile)) {
            let oldResultFile = "result_ex_" + new Date().getTime() + ".txt";
            let oldResult = path.join(resultDir, oldResultFile);
            await $g.fs.$rename(resultFile, oldResult);
          }
        }
        // 任务结果处理，写入task_result文件
        for (const k in $g.errors) {
          if (k != "exit_codes") $g.errors.exit_codes.push($g.errors[k])
        }
        if ($g.errors.exit_codes.length == 0) $g.errors.exit_codes.push($g.errors_code.SUCCEED);
        var errs = JSON.stringify($g.errors);
        $g.fs.write($g.getPath('task_result'), errs);
        return;
      }
      //执行脚本
      $g.log.append('currentStep', $g.currentStep);
      let currentAction = allActions[$g.currentStep];
      if (!currentAction) return;
      let name = currentAction['name'],
        params = currentAction['params'],
        condition = currentAction['condition'] ? currentAction['condition'] : false;
      if ($g.actions[name]) {
        if (params.offset) {
          $g.offset.left = params.offset.left ? parseInt(params.offset.left) : 0;
          $g.offset.top = params.offset.top ? parseInt(params.offset.top) : 0;
        }
        $g.processExecTag = true;
        $g.acts.update(params);
        if (!await $g.checkCondition(condition)) {
          $g.echoLog("action is ignored");
          $g.processExecTag = false;
        } else {
          await $g.actions[name](params, condition);
          $g.currentActionStartTime = new Date().getTime();
        }
        $g.offset = {
          left: 0,
          top: 0
        };
      }
      $g.currentStep++;
    }
  }, 2000);
}

function updateCurrentTime() {
  $g.variables._current_32bit_time_ = parseInt($g.acts.current.time / 1000);
  $g.variables._current_64bit_time_ = $g.acts.current.time;
}

function processCurrentUrl() {
  if ($g.variables._current_url_.match(/^https?:\/\/[^\/]+$/)) {
    $g.variables._current_url_ = $g.variables._current_url_ + '/';
  }
  var urlPart = $g.variables._current_url_.split('/');
  if (urlPart.length >= 2) $g.variables._current_url_last_part_ = urlPart[urlPart.length - 2];
  else $g.variables._current_url_last_part_ = '';
  $g.variables._current_url_page_ = urlPart[urlPart.length - 1];
  var pos = $g.variables._current_url_page_.indexOf('?');
  $g.variables._current_url_query_string_ = '';
  if (pos !== -1) {
    $g.variables._current_url_page_ = $g.variables._current_url_page_.substr(0, pos);
    $g.variables._current_url_query_string_ = $g.variables._current_url_page_.substr(pos + 1);
  }
  urlPart = $g.variables._current_url_.lastIndexOf('/');
  $g.variables._current_url_parent_ = $g.variables._current_url_.substr(0, urlPart);
  urlPart = $g.variables._current_url_parent_.indexOf('://');
  urlPart += 3;
  urlPart = $g.variables._current_url_parent_.indexOf('/', urlPart);
  $g.variables._current_url_root_ = $g.variables._current_url_parent_.substr(0, urlPart);
  $g.variables._current_page_path_ = $g.variables._current_url_parent_.substring(urlPart + 1);
  urlPart = $g.variables._current_page_path_.split('/');
  $g.variables._current_url_first_part_ = urlPart[0];
  if ($g.variables._current_url_last_part_.length === 0) $g.variables._current_url_last_part_ = $g.variables._current_url_first_part_;
}

function calcLoopIndex(actionInfo) {
  var lp = 0;
  if (actionInfo.start_index) {
    if ($g.utils.isNumber(actionInfo.start_index)) {
      lp = actionInfo.start_index;
    } else if ($g.utils.isString(actionInfo.start_index)) {
      if (actionInfo.start_index == 'fromLoopTag') {
        if ($g.variables[actionInfo.loopTag]) {
          if ($g.utils.isNumber($g.variables[actionInfo.loopTag])) {
            lp = $g.variables[actionInfo.loopTag];
          } else {
            lp = parseInt($g.variables[actionInfo.loopTag]);
          }
        }

      } else {
        lp = parseInt(actionInfo.start_index);
      }
      if (isNaN(lp)) {
        $g.debug("loop start index is invalid: " + actionInfo.start_index);
        lp = 0;
      }
    }
  }
  if (lp < 0) lp = 0;
  actionInfo.start_index = lp;
}

async function isBlankContent(pos) {
  let failedFlag = false;
  let content = await $g.domOp.getHTML();
  content = content || ''
  if (content.indexOf('<frame') > -1) {
    failedFlag = false;
  } else {
    const reg = /<body[^>]*>([\s\S]+?)<\/body>/i;
    const matchObj = reg.exec(content);
    if (matchObj && matchObj.length==2 && matchObj[1].length > 0){
      failedFlag = false;
    } else {
      failedFlag = true;
      result = TASK_BLANK_PAGE;
      $g.log.append('checkBlank', `${pos} check blankContent`);
    }
  }
  /**
  const failedFlag =  content.length === 0 ||
          content == '<html><head></head><body bgcolor="white"></body></html>' ||
          content == '<html><head><style type="text/css">body { background: #fff }</style></head><body></body></html>' ||
          content == '<html><head></head><body></body></html>';
  if (failedFlag) {
    $g.log.append('checkBlank', `${pos} check blanContent html: ${content}`);
  }
  **/
  return failedFlag
}
async function checkOpened(pos) {
  if (await isBlankContent(pos)) {
      $g.acts.ignoreAll($g.errors_code.NETWORK_UNAVAILABLE);
  }
}
function analyzeLabel(actionInfo, loopTag, j, actionIndex, loopIndex, loopCount, isLoginStepString, totalLoopCount) {
  var aAction = $g.actions[actionInfo.name];
  if (!aAction || !$g.utils.isFunction(aAction)) {
    var msg = "action is invalid:" + JSON.stringify(actionInfo);
    $g.log.append("analyzeLabel", msg);
    return j;
  }
  ++j;
  if (actionInfo.label) {
    if (totalLoopCount >= 1) {
      if (!$g.loopLabels[loopTag]) {
        $g.loopLabels[loopTag] = {};
      }
      if (!$g.loopLabels[loopTag][loopIndex]) {
        $g.loopLabels[loopTag][loopIndex] = {};
      }
      $g.loopLabels[loopTag][loopIndex][actionInfo.label] = j;
    } else {
      $g.labels[actionInfo.label] = j;
    }
  }
  return j;
}

function analyzeLabels() {
  var isLoginStepString = taskConfig.loginSteps && $g.utils.isString(taskConfig.loginSteps);
  var loopIndex = 0;
  for (var i = 0, j = 0, cnt = taskConfig.actions.length; i < cnt; ++i) {
    var actionInfo = taskConfig.actions[i];
    if (actionInfo.name == 'loop') {
      ++loopIndex;
      var loopTag;
      if (actionInfo.loopTag) {
        loopTag = actionInfo.loopTag;
      } else {
        if (actionInfo.label) {
          $g.labels[actionInfo.label] = j + 1;
          loopTag = actionInfo.label;
        } else {
          loopTag = 'loop_tag_' + loopIndex;
        }
        actionInfo.loopTag = loopTag;
      }
      if (actionInfo.fromVariable || (actionInfo.variables && $g.utils.isString(actionInfo.variables))) {
        if (actionInfo.fromVariable && $g.variables[actionInfo.fromVariable]) {
          let v = $g.variables[actionInfo.fromVariable];
          if ($g.utils.isObject(v)) {
            v = JSON.stringify(v);
          }
          actionInfo.variables = v;
        }
        actionInfo.variables = $g.$json_from_string(actionInfo.variables);
      }
      if (actionInfo.loop_count == 'variablesCount') {
        if (actionInfo.variables && actionInfo.variables.length) {
          actionInfo.loop_count = actionInfo.variables.length;
        } else {
          actionInfo.loop_count = 1;
          $g.debug("no loop vairiables in loop: " + loopTag);
        }
      }
      if (actionInfo.variables) allLoopVariables[loopTag] = actionInfo.variables;
      calcLoopIndex(actionInfo);
      var msg = "Loop " + loopTag + " start_index is: " + actionInfo.start_index.toString() + ". Loop count: " + actionInfo.loop_count;
      $g.echoLog(msg);
      $g.debug(msg);
      var lpCnt = actionInfo.loop_count - actionInfo.start_index;
      for (var lp = 0; lp < lpCnt; ++lp) {
        for (var k = 0, cnt_k = actionInfo.actions.length; k < cnt_k; ++k) {
          j = analyzeLabel(actionInfo.actions[k], loopTag, j, k, lp, lpCnt, isLoginStepString, actionInfo.loop_count);
        }
      }
    } else {
      j = analyzeLabel(actionInfo, '', j, 0, 0, 0, isLoginStepString, 0);
    }
  }
  return j;
}
var _totalActions = 0;

function addAction(actionInfo, loopTag, j, actionIndex, loopIndex, loopCount, loopActionCount, loopRealIndex, totalLoopCount) {
  //兼容VCMAN
  if (actionInfo.name == 'leftClick') actionInfo.name = 'click';
  var aAction = $g.actions[actionInfo.name];
  if (!aAction || !$g.utils.isFunction(aAction)) {
    return j;
  }
  ++$g.acts.current.left;
  if (!actionInfo.params) actionInfo.params = {};
  ++j;
  // + actionDelta + (loopCount - loopIndex) * loopActionCount - actionIndex;
  actionInfo.params._left = _totalActions - j;
  actionInfo.params._step = j;
  actionInfo.params._isInLoop = totalLoopCount >= 1;
  if (actionInfo.params._isInLoop) {
    actionInfo.params._continueLoop = loopActionCount - actionIndex - 1;
    actionInfo.params._exitLoop = (loopCount - loopIndex) * loopActionCount - actionIndex - 1;
  }
  actionInfo.params._loopActionIndex = actionIndex;
  actionInfo.params._loopIndex = loopIndex;
  actionInfo.params._loopRealIndex = loopRealIndex;
  actionInfo.params._loopTag = loopTag;
  actionInfo.params._actionName = actionInfo.name;
  actionInfo.params._labelTag = actionInfo.label ? actionInfo.label : '';
  // aAction(actionInfo.params, actionInfo.condition);
  //console.log(JSON.stringify(actionInfo));
  allActions.push(actionInfo);
  return j;
}

function addActions() {
  for (var i = 0, j = 0, cnt = taskConfig.actions.length; i < cnt; ++i) {
    var actionInfo = taskConfig.actions[i];
    if (actionInfo.name == 'loop') {
      var lpCnt = actionInfo.loop_count - actionInfo.start_index;
      for (var lp = 0; lp < lpCnt; ++lp) {
        for (var k = 0, cnt_k = actionInfo.actions.length; k < cnt_k; ++k) {
          j = addAction($g.clone(actionInfo.actions[k]), actionInfo.loopTag, j,
            k, lp, lpCnt, cnt_k, actionInfo.start_index + lp, actionInfo.loop_count);
        }
      }
    } else {
      j = addAction(actionInfo, '', j, 0, 0, 0, 0, 0, 0);
    }
  }
}

function createActions() {
  $g.debug('create actions');
  console.log(taskConfig.homeUrl);
  if (taskConfig.variables) {
    if ($g.utils.isString(taskConfig.variables)) taskConfig.variables = $g.$json(taskConfig.variables);
    if (taskConfig.variables) $g.variables = taskConfig.variables;
  }
  $g.variables.homeUrl = taskConfig.homeUrl || '';
  if ($g.variables.homeUrl.length > 0) {
    $g.variables._current_url_ = $g.variables.homeUrl;
    processCurrentUrl();
    if (taskConfig.referer) {
      taskConfig.referer = $g.finalizeString(taskConfig.referer);
    }
  }
  $g.debug("Open home page:" + taskConfig.homeUrl);
  var actions = taskConfig.actions;
  if (!actions) {
    return;
  }
  taskConfig.actions = $g.$ARR(actions);
  $g.acts.current.left = 0;
  $g.acts.current.name = 'open_home';
  var curTime = new Date();
  $g.acts.current.time = curTime.getTime();
  updateCurrentTime();
  if (!taskConfig.loginSteps) {
    taskConfig.loginSteps = "logined";
  }
  $g.echoLog('page is opened, prepare to create actions');
  _totalActions = analyzeLabels();
  $g.debug("Total action count is: " + _totalActions);
  addActions();
}

function browserNetwork(mainWindow) {
  $g.netWorkListenFlag = true
  $g.log.append('network', 'browser network')
  //$g.debug('taskDir:', $g.taskPath);
  $g.networkPath = $g.taskPath + $g.sep + 'network'
  if (!$g.fs.exists($g.networkPath)) {
    $g.fs.mkdir($g.networkPath)
  }
  let networkDataIndex = {}
  const filterRequestTypes = ['Document', 'XHR']

  const dbg = win.webContents.debugger
  try {
    dbg.attach('1.3');
    dbg.sendCommand('Network.enable');
    dbg.sendCommand('Fetch.enable', {patterns: [{ requestStage:'Response' }]})
    dbg.on('message', (e, m, params) => {
      //$g.log.append('debug', JSON.stringify(m))
      // WebSocket 帧接收
      if (m === 'Network.webSocketFrameReceived') {
        //$g.log.append('params', JSON.stringify(params))
        const requestId = params.requestId
        const timestamp = params.timestamp
        let frameData = params.response.payloadData
        //
        const contentFile = requestId + '_' + new Date().getTime()
        $g.fs.write($g.networkPath + $g.sep + contentFile, frameData)
        networkDataIndex[requestId] = {
          url: 'websocket',
          postData: '',
          type: 'websocket',
          params: {},
          file: contentFile,
          time: new Date().getTime()
        }
        //$g.log.append('params', JSON.stringify(params))
        $g.fs.append($g.networkPath + $g.sep + 'index', JSON.stringify(networkDataIndex[requestId])+"\n")
      }
      if(m === 'Fetch.requestPaused') {
        const requestId = params.requestId
        if (filterRequestTypes.indexOf(params.resourceType) > -1) {
          dbg.sendCommand('Fetch.getResponseBody', {requestId}).then(response => {
            let contentType = ''
            for (const item of params.responseHeaders) {
              if(item.name == 'Content-Type'){
                contentType = item.value
                break
              }
            }
            //$g.log.append('debug', JSON.stringify(params))
            //$g.log.append('debug res', JSON.stringify(response))
            let content = ''
            if(response.base64Encoded){
              content = Buffer.from(response.body, 'base64')
              // $g.log.append('debug', contentType)
              if (contentType.includes('charset=gb')) {
                content = iconv.decode(content, 'gbk')
              } else {
                content = content.toString()
              }
              // $g.log.append('content', content)
            }else{
              content = response.body
            }
            if(content){
              const contentFile = requestId + '_' + new Date().getTime()
              $g.fs.write($g.networkPath + $g.sep + contentFile, content)
              networkDataIndex[requestId] = {
                url: params.request.url,
                postData: params.request?.postData || '',
                type: params.resourceType,
                params: params,
                file: contentFile,
                time: new Date().getTime()
              }
              $g.fs.append($g.networkPath + $g.sep + 'index', JSON.stringify(networkDataIndex[requestId])+"\n")
            }
          }).catch(error => {
            // console.log('Fetch.getResponseBody error : ', error)
          })
        }
        //return JSON.parse(res.base64Encoded ? Buffer.from(res.body, 'base64').toString() : res.body)
        dbg.sendCommand("Fetch.continueRequest", {requestId})
      }
    })
  } catch (err) {
    console.log('Debugger attach failed : ', err)
  }

  /*
  try {
    dbg.attach('1.1');
    dbg.sendCommand('Network.enable');
    dbg.on('message', (event, method, params) => {
      const requestId = params.requestId;
      if (method === 'Network.responseReceived' && filterRequestTypes.indexOf(params.type) > -1) {
        networkDataIndex[requestId] = {
          url: params.response.url,
          postData: '',
          type: params.type,
          file: '',
          time: new Date().getTime()
        }
      }
      if (method === 'Network.loadingFinished') {
        if (networkDataIndex.hasOwnProperty(requestId)) {
          if (networkDataIndex[requestId].type == 'XHR') {
            dbg.sendCommand('Network.getRequestPostData', {
              requestId
            }).then(
              response => {
                if (networkDataIndex[requestId]) {
                  networkDataIndex[requestId].postData = response?.postData || {}
                }
              }
            ).catch(
              error => {
                $g.log.append('debug', error)
              }
            )
          }
          dbg.sendCommand('Network.getResponseBody', {
            requestId
          }).then(
            response => {
              const content = response.body
              if (content) {
                const contentFile = params.requestId + '_' + new Date().getTime()
                $g.fs.write($g.networkPath + $g.sep + contentFile, content)
                networkDataIndex[params.requestId].file = contentFile
                //$g.fs.write($g.networkPath + $g.sep + 'index', JSON.stringify(networkDataIndex))
                $g.fs.append($g.networkPath + $g.sep + 'index', JSON.stringify(networkDataIndex[params.requestId])+"\n")
                delete networkDataIndex[requestId]
              } else {
                delete networkDataIndex[requestId]
              }
            }
          ).catch(
            error => {
              $g.log.append('debug', error)
            }
          );
        }
      }
    })
  } catch (err) {
    console.log('Debugger attach failed : ', err)
  }
  */
}
$g.common.arg.getArg(function (name, value) {
  if (name == "--script") {
    scriptJsonFile = value || false;
  } else if (name == "--parse") {
    $g.needParse = true;
  } else if (name == "--quik") {
    $g.quikMode = true;
  } else if (name == "--task") {
    taskId = value;
  } else if (name == '--intest') {
    $g.inTest = true;
  } else if (name == '--cap') {
    enableStepCapture = true;
  } else if (name == "--vcode") {
    path_trans = true;
    $g.vcodeImagePath = value + $g.sep + "image";
    $g.vcodeTmpPath = value + $g.sep + "tmp";
    $g.vcodeTextPath = value + $g.sep + "text";
    $g.waitPhonePath = value + $g.sep + "phone" + $g.sep + "wanted";
    $g.phonePath = value + $g.sep + "phone" + $g.sep + "got";
    $g.smsPath = value + $g.sep + "phone" + $g.sep + "sms";
    $g.replyPath = value + $g.sep + "reply" + $g.sep + "reply";
    $g.waitReplyPath = value + $g.sep + "reply" + $g.sep + "wait_reply";
    $g.waitSmsPath = value + $g.sep + "phone" + $g.sep + "wait_sms";
    $g.emailVCodePath = value + $g.sep + "email" + $g.sep + "got";
    $g.waitEmailVCodePath = value + $g.sep + "email" + $g.sep + "wanted";
    post_file_path = value + $g.sep + "post_files";
    post_ret_file_path = value + $g.sep + "post_files_ret";
  } else if (name == '--continueTaskFile') {
    $g.classicMode = false
    $g.continueTaskFile = value || false
  }
});
if (!$g.classicMode) {
  scriptJsonFile = path.join(baseDir, 'task', 'script');
}
if (scriptJsonFile && $g.isWin) {
  scriptJsonFile = scriptJsonFile.replaceAll('/', '\\');
}

if (scriptJsonFile && $g.path.isAbsolute(scriptJsonFile)) {
  $g.taskPath = $g.path.parent(scriptJsonFile);
  console.log($g.path.parent(scriptJsonFile));
} else if ($g.inTest) {
  $g.taskPath += $g.sep + 'task';
  if (!$g.fs.exists($g.taskPath)) {
    $g.fs.mkdir($g.taskPath);
  }
}

Crawler.create($g, taskId)
$g.debug('script path: ' + scriptJsonFile);
if(!$g.continueTaskFile){
  if (!$g.fs.exists(scriptJsonFile)) {
    var msg = "Can't find script file";
    $g.engineError(msg);
    result = TASK_NOT_FOUND_SCRIPT;
    $g.debug(result);
    if ($g.classicMode) {
      win.destroy()
      process.exit()
    }
  }
  taskConfig = loadScript();
  if (taskConfig.crawlOptions?.crawlerSwitch && (taskConfig.crawlOptions.crawlerSwitch===true || taskConfig.crawlOptions.crawlerSwitch=="true")) {
    $g.classicMode = false
    taskConfig.continueCrawlFlag = true
    taskConfig.networkSwitch = true
  }
  // if (taskConfig.continueCrawlFlag) {
  //   $g.classicMode = false
  // } else {
  //   async function callProcessCrawlParams() {
  //     taskConfig = await Crawler.processCrawlParams(taskConfig)
  //   }
  //   callProcessCrawlParams()
  // }
  if ($g.needParse) {
    taskConfig = parseScript.parseScriptConfig(taskConfig);
    let tmpPath = $g.getPath('parseScript.json');
    $g.fs.write(tmpPath, JSON.stringify(taskConfig));
  }
}

$g.changeMode();


exports.getTaskConfig = () => {
  let browserShowLink = false
  if(taskConfig && (taskConfig.browserShowLink===true || taskConfig.browserShowLink==='true')){
    browserShowLink = true
  }
  let loadImageFlag = true
  if(taskConfig && (taskConfig.loadImages===false || taskConfig.loadImages==='false')){
    loadImageFlag = false
  }
  const { dynamicProxy, dynamicProxyCountry, accountCookie, cookieWebsite, shenzhenProxy } = taskConfig || {};
  return {
    loadImages: loadImageFlag,
    browserShowLink,
    dynamicProxy,
    dynamicProxyCountry,
    shenzhenProxy,
    accountCookie, 
    cookieWebsite
  }
}
// --userData
// --cookieFile
exports.getCmdArgument = (argName, defaultValue) => {
  return $g.common.arg.getArg(argName, defaultValue)
}

exports.execScript = async (mainWindow) => {
  require('./network_data_parse/index').DataParse($g)
  return
  try {
    webRequestFilter()
    win = mainWindow;
    let actions = require('./actions.js').create(mainWindow, $g);
    //net workd
    if (taskConfig && taskConfig.networkSwitch === true && !$g.netWorkListenFlag) {
      browserNetwork(mainWindow)
    }
    if (!taskConfig) {
      $g.processing = false
      return
    }
    createActions();
    //$g.log.append('actions', JSON.stringify(allActions))
    //$g.log.append('loopLabels',   JSON.stringify($g.loopLabels));
    //$g.log.append('labels',   JSON.stringify($g.labels));
    //$g.log.append('allLoopVariables', JSON.stringify(allLoopVariables))
    if (taskConfig.homeUrl) {
      $g.processExecTag = true;
      $g.loadPageTag = true;
      $g.taskPause = true;
      mainWindow.loadURL(taskConfig.homeUrl).then(
        () => {
          $g.taskPause = false;
          setTimeout(()=>{ checkOpened('load') }, 10000);
        },
        () => {
          $g.log.append('loadURL', 'main load url reject');
          $g.taskPause = false;
          setTimeout(()=>{ checkOpened('reject') }, 10000);
        }
      )
      $g.log.append('open_home', taskConfig.homeUrl)
    }
    if (!$g.classicMode && !$g.continueTaskFile && !taskConfig.continueCrawlFlag) {
      let oldScriptName = "script_" + new Date().getTime();
      let oldScriptPath = path.join(historyDir, oldScriptName);
      $g.fs.$rename(scriptJsonFile, oldScriptPath);
    }
    if ($g.execIntervalFlag) {
      clearInterval($g.execIntervalFlag);
    }
    startExec();
    if ($g.listenIntervalFlag) {
      clearInterval($g.listenIntervalFlag);
    }
    listenHandler();
  } catch (error) {
    $g.log.append("Error", error);
    $g.log.append("Error stack", error.stack);
    mainWindow.close();
  }
};
