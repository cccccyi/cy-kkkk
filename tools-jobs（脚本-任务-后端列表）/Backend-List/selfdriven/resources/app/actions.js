let win, $g;
let VCODE_TIME_OUT = 6 * 60 * 1000,
  VCODE_STAT_READY = 0,
  VCODE_STAT_INPUTED = 1,
  VCODE_STAT_ACTIONED = 2,
  VCODE_STAT_MD5 = 3,
  imageName = 0;
const {
  type
} = require("os");
const { clipboard, nativeImage } = require('electron')
const https = require('https')
const axios = require('axios')
const path = require("path");
const { DataParse } = require('./network_data_parse/index');
const { url } = require("inspector");
let baseDir = path.dirname(process.resourcesPath);
let downloadDir = path.join(baseDir, 'downloads');
let defaultDataName = 0;
const locMatchsConfig = {
  HongKong: ['Hong Kong'],
  Taiwan: ['Taiwan','Taipei','Taichung','Kaohsiung','Tainan','Taoyuan','Chiayi','Hsinchu','Changhua','Taitung','Tucheng','Yilan','Hualian','Tounan','Tamsui','Xindian','Sindian','Nantou','Zhunan','Zhubei','Zhudong','Miaoli'],
  japan: ['Japan']
}

function Actions() {}

async function mouseMoveAction(selector) {
  let aSelector = false,
    noMove = false;
  if ($g.utils.isObject(selector)) {
    aSelector = selector.selector;
    if (selector.noMove) noMove = true;
  } else {
    aSelector = selector;
  }
  let isVisible = await $g.domOp.visible(aSelector);
  if (!isVisible) {
    let msg = "selector: " + aSelector + " is not visible";
    $g.log.append($g.acts.current.name, msg);
    return;
  }
  if (!noMove) await $g.acts.scrollToElement(aSelector);
  let result = await $g.domOp.getElementBounds(aSelector);
  if (result) {
    let left = 0,
      top = 0;
    if ($g.frameOffset) {
      let scrollTop = await $g.domOp.getScrollTop();
      left = $g.frameOffset.left;
      top = $g.frameOffset.top - scrollTop;
    }
    let x = parseInt(result.left + result.width / 2 + left);
    let y = parseInt(result.top + result.height / 2 + top);
    await win.webContents.sendInputEvent({
      type: 'mouseMove',
      x: x,
      y: y
    });
    // await $g.sleep(10000);
  }
}
async function mouseAction(selector, type) {
  let aSelector = false,
    noMove = false;
  if ($g.utils.isObject(selector)) {
    aSelector = selector.selector;
    if (selector.noMove) noMove = true;
  } else {
    aSelector = selector;
  }
  await $g.sleep(2000);
  let isVisible = await $g.domOp.visible(aSelector);
  if (!isVisible) {
    let msg = "selector: " + aSelector + " is not visible";
    $g.log.append($g.acts.current.name, msg);
    return;
  }
  // if(!noMove) await $g.acts.scrollToElement(aSelector);
  let result = await $g.domOp.getElementBounds(aSelector);
  if (result) {
    let left = 0,
      top = 0;
    if ($g.frameOffset) {
      await $g.getframePos();
      // let scrollTop = await $g.domOp.getScrollTop();
      left = $g.frameOffset.left;
      // top = $g.frameOffset.top - scrollTop;
      top = $g.frameOffset.top;
    }
    let x = parseInt(result.left + result.width / 2 + left + $g.offset.left);
    let y = parseInt(result.top + result.height / 2 + top + $g.offset.top);
    if (type == "move") {
      if (result.top < 0) result.top = 0;
      if (result.width / 2 > 50) offsetLeft = 50;
      else offsetLeft = result.width / 2;
      if (result.height / 2 > 100) offsetTop = 100;
      else offsetTop = result.height / 2;
      x = parseInt(result.left + offsetLeft + left);
      y = parseInt(result.top + offsetTop + top);
      $g.basePos = {
        x: x,
        y: y
      };
    }
    $g.log.append("x", x);
    $g.log.append("y", y);
    /*
    let moveCount = $g.math.randomBetween(200, 300);
    for (let i=0; i<moveCount; i++) {
      await win.webContents.sendInputEvent({
        type: 'mouseMove',
        x: x-moveCount+i,
        y: y-moveCount+i
      });
      await $g.sleep(10)
    }
    */
    await win.webContents.sendInputEvent({
      type: 'mouseMove',
      x: x,
      y: y
    });
    if (type == "click") {
      // console.log(x, y);
      // let script = `(function(s){
      //     document.querySelector(s).setAttribute('style', 'border: 1px solid red !important');
      // })("`+aSelector+`")`;
      // await $g.domOp.exec(script);
      await win.webContents.sendInputEvent({
        type: 'mouseDown',
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
      });
      await win.webContents.sendInputEvent({
        type: 'mouseUp',
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
      });
      // await $g.sleep(3000);
      // let script1 = `(function(s){
      //     document.querySelector(s).setAttribute('style', 'border: 0px solid red !important');
      // })("`+aSelector+`")`;
      // await $g.domOp.exec(script1);
    }
    // await $g.sleep(10000);
  }
}
async function crawlerFromUrl(item, url) {
  if (!url) url = await $g.domOp.getCurrentUrl();
  var params = [],
    aItem = {};
  var pos = url.indexOf('?');
  if (pos != -1) {
    var tmp = url.substr(pos + 1);
    tmp = tmp.split('&');
    for (var i = 0; i < tmp.length; ++i) {
      var p = tmp[i].split('=');
      if (p.length > 0) {
        params.push({
          name: p[0],
          value: p[1]
        });
      }
    }
  }
  if (item.names) {
    for (var name in item.names) {
      for (var i = 0; i < params.length; ++i) {
        if (params[i].name == item.names[name]) {
          aItem[name] = params[i].value;
        }
      }
    }
  } else if (items.trims) {
    for (var name in item.trims) {
      var trims = $g.$ARR(item.trims[name]);
      var data = url;
      for (var i = 0; i < trims.length; ++i) {
        data = $g.$trim(data, trims[i]);
      }
      aItem[name] = data;
    }
  }
  return [aItem];
}

function processOldCrawlerOption(params) {
  if (!params.getInt) {
    return;
  }
  if (!params.options) {
    params.options = {};
  }
  for (var k = 0; k < params.getInt.length; ++k) {
    var name = params.getInt[k];
    if (!params.options[name]) {
      params.options[name] = {};
    }
    params.options[name].digit = true;
  }
}

function $action(selector, resolvedSelector, cb) {
  if ($g.utils.isString(selector.popup)) {
    if (!$toPopup(selector.popup)) {
      return false;
    }
    cb();
    $backPopup();
  } else if (selector.frame || selector.frameHtml) {
    $toFrame(selector, resolvedSelector);
    cb();
    $backFrame();
  } else {
    cb();
  }
  return true;
}

function crawlerData(params, ele, name) {
  var isEle = !$g.utils.isString(ele);
  var data = isEle ? ele.text : ele;
  var hasOption = $g.utils.isObject(params.options) && $g.utils.isObject(params.options[name]);
  var aTrim = [null];
  if (hasOption) {
    if (isEle) {
      if (params.options[name].from) {
        data = ele.attributes[params.options[name].from];
        if (!data) {
          data = "";
        }
      } else if (params.options[name].fromTag) {
        data = ele.tag;
      }
    }
    if (params.options[name].trim) {
      aTrim = params.options[name].trim;
    }
  }
  aTrim = $g.$ARR(aTrim);
  for (var i = 0; i < aTrim.length; ++i) {
    data = $g.$trim(data, aTrim[i]);
  }
  if (data && hasOption) {
    if (params.options[name].digit) {
      var re = /(\d+)/g;
      data = data.replaceAll(',', '');
      if (re.test(data)) {
        data = parseInt(RegExp.$1);
      } else {
        data = 0;
      }
    } else {
      if (params.options[name].prefix) {
        data = params.options[name].prefix + data;
      }
      if (params.options[name].suffix) {
        data = data + params.options[name].suffix;
      }
    }
  }
  return data;
}

async function crawlerNormal(params) {
  var selectors = $g.$ARR(params.selectors);
  var tmpResults = [];
  var parent = "";
  if ($g.utils.isString(params.parent)) {
    parent = params.parent + " ";
  }
  processOldCrawlerOption(params);
  for (var i = 0; i < selectors.length; ++i) {
    var tmp = [];
    var selector = selectors[i];
    if ($g.utils.isString(selector) && selector.length === 0) {
      tmp.push("");
    } else {
      if ($g.utils.isString(selector)) {
        selector = parent + selector;
      }
      var aSelector = $g.$selector(selector);
      if (await $g.domOp.exists(aSelector)) {
        var ele = await $g.domOp.getElementsInfo(aSelector);
        var eleCount = params.count || ele.length;
        if (eleCount > ele.length) eleCount = ele.length;
        for (var k = 0; k < eleCount; ++k) {
          var eleName = params.names[i];
          if (params.options && params.options[eleName] && params.options[eleName].fromChild) {
            var childEle = aSelector + ' ' + params.options[eleName].fromChild;
            if (await $g.domOp.exists(childEle)) {
              var childEleVal = [];
              childEle = await $g.domOp.getElementsInfo(childEle);
              for (var cki = 0; cki < childEle.length; ++cki) {
                childEleVal.push(crawlerData(params, childEle[cki], eleName));
              }
              childEle = childEleVal.join(params.options[eleName].childSep ? params.options[eleName].childSep : ',');
            } else {
              childEle = '';
            }
            tmp.push(childEle);
          } else {
            tmp.push(crawlerData(params, ele[k], eleName));
          }
        }
      } else {
        tmp.push("");
      }
    }
    tmpResults.push(tmp);
  }
  var results = [];
  if (tmpResults.length > 0) {
    var cnt = tmpResults[0].length;
    for (var i = 0; i < cnt; ++i) {
      var item = {};
      for (var j = 0; j < params.names.length; ++j) {
        var name = params.names[j];
        item[name] = tmpResults[j][i];
      }
      results.push(item);
    }
  }
  return results;
}
async function inputAction(params) {
  let value = $g.finalizeString(params.value);
  if (params.type && params.type == 'enter') {
    value = '<enter>';
  }
  if (params.pos) {
    let x = params.pos.x ? params.pos.x : 0;
    let y = params.pos.y ? params.pos.y : 0;
    await win.webContents.sendInputEvent({
      type: 'mouseDown',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    });
    await win.webContents.sendInputEvent({
      type: 'mouseUp',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    });
  } else {
    let selector = params.selector;
    let isVisible = await $g.domOp.visible(selector);
    if (!isVisible) {
      $g.echoMsg("Element " + selector + " not found");
      return;
    }
    await parseAction({
      name: "click",
      selector: selector,
      index:params.index
    });
  }

  await $g.sleep(2000);
  if (value == "<enter>") {
    win.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Enter'
    });
  } else {
    $g.log.append('input', value)
    if ( params.hastag_switch=="true" && (value.indexOf('@') > -1 || value.indexOf('#') > -1) ){
      await processInputHastag(value)
    }else{
      win.webContents.insertText(value);
    }
  }
}

async function processInputHastag(str) {
  let result_arr = []
  while(str){
    const index_at = str.indexOf('@')
    const index_tag = str.indexOf('#')
    if (index_at == 0) {
      let remain_str = str.substr(1)
      const index_space = remain_str.search(/@|#/)
      if(index_space > -1){
        remain_str = str.substr(0, index_space)
        str = str.substr(index_space)
        str = ` ${str}`
      }else{
        remain_str = str
        str = ''
      }
      let remains_arr = remain_str.split(/\s+/)
      $g.log.append('remains_arr', JSON.stringify(remains_arr))
      let token_str = remains_arr.shift()
      let tmp_str = `${token_str}`
      let last_str = tmp_str
      let match_flag = true
      while(token_str=remains_arr.shift()){
        last_str = tmp_str
        tmp_str = `${tmp_str} ${token_str}`
        $g.log.append('tmp_str', tmp_str)
        await win.webContents.insertText(tmp_str);
        let flag = false
        for (let i=0; i<5; i++) {
          await $g.sleep(2000)
          let selector = "ul[role='listbox'] li[role='option']"
          let isVisible = await $g.domOp.visible(selector);
          if (!isVisible) {
            $g.echoMsg("Element " + selector + " not found");
          } else {
            flag = true
            break
          }
        }
        if(flag){
          continue
        }else{
          match_flag = false
          break
        }
      }
      if(match_flag){
        result_arr.push(tmp_str)
      }else{
        result_arr.push(last_str)
        str = `${token_str} ${remains_arr.join(' ')} ${str}`
      }
    } else if (index_at > -1) {
      let index = index_at
      const sub_str = str.substr(0, index)
      result_arr.push(sub_str)
      str = str.substr(index)
    } else {
      str = `${str} `
      result_arr.push(str)
      str = ''
    }
  }
  //input
  $g.log.append('result_arr', JSON.stringify(result_arr))
  $g.log.append('str', str)
  for (let i=0; i<1000; i++) {
    await win.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Backspace'
    });
    await $g.sleep(1);
  }
  for(let token_str of result_arr){
    $g.log.append('input', `sub_str: ${token_str}`)
    if(token_str.indexOf('@') > -1){
      await win.webContents.insertText(token_str);
      for (let i=0; i<10; i++) {
        await $g.sleep(2000)
        let selector = "ul[role='listbox'] li[role='option']"
        let isVisible = await $g.domOp.visible(selector);
        if (!isVisible) {
          $g.echoMsg("Element " + selector + " not found");
        } else {
          await parseAction({
            name: "click",
            selector: selector
          });
          await $g.sleep(1000)
          break
        }
      }
      await win.webContents.insertText(' ');
    }else{
      //await win.webContents.insertText(token_str)
      clipboard.writeText(token_str)
      win.webContents.paste()
      await $g.sleep(1000)
    }
  }
}

function analyzeSMS(params, text) {
  if (params.type == 'instagram') {
    return text.replace(/[^0-9]|(\d{4}\-\d{2}\-\d{2}\s+\d{2}\:\d{2}\:\d{2})/ig, "");
  } else if (params.type == 'facebook') {
    return text.replace(/[^0-9]/ig, "");
  } else if (params.type == 'twitter') {
    return text.replace(/[^0-9]/ig, "");
  } else if (params.type == 'tiktok') {
    text = text.substring(0, 40);
    return text.replace(/[^0-9]/ig, "");
  } else if (params.type == 'vk') {
    return text.replace(/[^0-9]/ig, "");
  } else if (params.type == 'imgur') {
    return text.replace(/[^0-9]/ig, "");
  }else if (params.type == 'ok.ru') {
    return text.replace(/[^0-9]/ig, "");
  }else if (params.type == 'twitter_login') {
    return text.replace("Your Twitter confirmation code is ", "");
  }else if (params.type == 'quora_reg') {
      var codes = text.match(/[0-9]{6}/g);
      return codes[0];
  }else if (params.type == 'chatGPT') {
    text = text.substr(-6);
    return text;
  }
  return false;
}
async function parseAction(actions) {
  if (!actions) {
    return;
  }
  var acts = $g.$ARR(actions);
  for (var i = 0; i < acts.length; ++i) {
    var act = acts[i];
    if (act.name == "click") {
      var aSelector = false;
      if ($g.utils.isObject(act.selector) && act.selector.selector) {
        aSelector = $g.$selector(act.selector.selector);
      } else if ($g.utils.isString(act.selector)) {
        aSelector = $g.$selector(act.selector);
      } else {
        $g.debug("not found selector");
        continue;
      }
      var eles = await $g.domOp.getElementsInfo(aSelector);
      if (eles.length > 1) {
        var aIndex = 0;
        if (act.index) {
          if (act.index == "random") {
            aIndex = $g.math.randomBetween(0, eles.length - 1);
          } else if (act.index == "last") {
            aIndex = eles.length - 1;
          } else {
            aIndex = $g.finalizeString(act.index);
          }
        }
        let script = `(function(s){
                    var ns = window.clientUtilsObj.findAll(s);
                    for (var i = 0; i < ns.length; ++i) {
                        ns[i].setAttribute("clk_myiid", i.toString());
                    }
                })("` + aSelector + `")`;
        await $g.domOp.exec(script);
        aSelector += "[clk_myiid='" + aIndex.toString() + "']";
        $g.debug('click by index: ' + aSelector);
      }
      if (!act.selector.noMove) await $g.acts.scrollToElement(aSelector);
      await mouseAction(aSelector, 'click');
      continue;
    } else if (act.name == "wait") {
      await $g.sleep(act.interval);
      continue;
    } else if (act.name == "scroll") {
      await $g.acts.scrollToElement(act.selector);
      continue;
    } else if (act.name == "move") {
      let aSelector = act.selector;
      await mouseAction(aSelector, 'move');
      continue;
    }
  }
}
async function inputVcode(params) {
  var input = $g.$selector(params.input);
  params.selector = input;
  params.value = params.toUpper ? params.code.toUpperCase() : params.code;
  await inputAction(params);
  $g.log.append("input vcode", "Input times: " + params.retry + ". Code: " + params.code);
  $g.debugCapture("vcode_inputed.jpg");
}
async function vcode_is_ready(params) {
  await inputVcode(params);
  var inputed = true;
  if (inputed) {
    params.ticks = $g.$ticks(4); // wait for 4 seconds
    params.vstat = VCODE_STAT_INPUTED;
  }
}
async function parseVCode(params) {
  var ret = false;
  var container = params.container ? params.container : params.image;
  container = $g.$selector(container);
  if (params.vstat === VCODE_STAT_MD5) {
    $g.debug("wait vcode md5");
    return false;
  } else if (params.vstat === VCODE_STAT_INPUTED) {
    --params.ticks;
    if (params.ticks > 0) {
      return false;
    }
    if (params.actions) {
      parseAction(params.actions);
    }
    $g.debugCapture("vcode_actioned.jpg");
    $g.debug("Execute vcode actions");
    $g.log.append('input vcode', "Execute vcode actions");
    params.vstat = VCODE_STAT_ACTIONED;
    params.ticks = $g.$ticks(params.retryInterval - 2);
    return false;
  } else if (params.vstat === VCODE_STAT_ACTIONED) {
    --params.ticks;
    if (params.ticks > 0) {
      return false;
    }
    params.vstat = VCODE_STAT_READY;
    if (!await $g.domOp.visible(container)) {
      return true;
    }
    ++params.retry;
    if (params.retry > params.maxRetry) {
      return true;
    }
    $g.debug("retry vcode");
    params.ticks = 0;
    params.captured = false;
    return false;
  } else if (!params.inited) {
    params.inited = true;
    if (await $g.domOp.visible(container)) params.ticks = 0;
    else params.ticks = $g.$ticks(8); // wait for max 8 seconds for vcode comming
  } else if (params.ticks > 0) {
    --params.ticks;
  }
  if (params.ticks !== 0 || ret) {
    return ret;
  }
  if (!await $g.domOp.visible(container)) {
    //$g.debug("container is not visible: " + container);
    return true;
  }
  var vcode_path = $g.getVCodeTextPath("vcode.txt");
  var auto_vcode_path = $g.getVCodeTextPath("auto_vcode.txt");
  if (!params.captured) {
    $g.fs.$remove(vcode_path);
    $g.fs.$remove(auto_vcode_path);
    var image = $g.$selector(params.image);
    if (await $g.domOp.visible(image)) {
      params.tmpFilePath = await $g.captureVCode("vcode", params.fullScreen ? false : image);
    } else if (params.image1) {
      image = $g.$selector(params.image1);
      if (await $g.domOp.visible(image)) {
        params.tmpFilePath = await $g.captureVCode("vcode", image);
      } else {
        $g.acts.ignoreAll();
        return true;
      }
    } else {
      $g.acts.ignoreAll();
      return true;
    }
    params.vstat = VCODE_STAT_MD5;
    params.captured = true;
    $g.debug("vcode path: " + params.tmpFilePath);
    $g.echoLog("vcode path: " + params.tmpFilePath);
    $g.log.append("input vcode", "wait vcode in: " + vcode_path);
    $g.debug('calc vcode image file md5');
    var vcodeMd5Callback = function (err, m5, stderr) {
      if (m5) m5 = m5.toString();
      if (!err) {
        if (!params.newInfo) params.newInfo = {};
        try {
          params.newInfo = {
            size: $g.fs.size(params.tmpFilePath),
            m5: m5
          };
        } catch (e) {
          $g.log.append("input vcode", "new info error: " + e.toString());
        }
      } else {
        $g.debug(stderr);
        $g.log.append("input vcode", 'calc md5 failed: ' + err + '. Other: ' + stderr);
        params.newInfo = {
          size: 0,
          m5: 0
        };
      }
      if (!err && params.lastInfo && params.newInfo.size === params.lastInfo.size &&
        params.newInfo.m5 == params.lastInfo.m5) {
        $g.debug("vcode md5 is same");
        $g.log.append("input vcode", "vcode md5 is same");
        vcode_is_ready(params);
        $g.fs.$remove(params.tmpFilePath);
      } else {
        var waitMsg = "Md5 is not same, waiting for input vcode, md5: " + params.newInfo.m5;
        $g.debug(waitMsg);
        $g.log.append("cap vcode", waitMsg);
        params.lastInfo = params.newInfo;
        var needCapInFrame = params.switchFrameWhenCheck ? true : false;
        if (needCapInFrame) $toFrame(params.switchFrameWhenCheck);
        $g.fs.$remove($g.getVCodeFilePath("vcode", '.t16'));
        $g.fs.$remove($g.getVCodeFilePath("vcode", '.t12'));
        $g.fs.$remove($g.getVCodeFilePath("vcode", '.t9'));
        $g.fs.$remove($g.getVCodeFilePath("vcode", '.t8'));
        $g.fs.$remove($g.getVCodeFilePath("vcode", '.slider'));
        var needVerifyValue = params.needConfirmVerify ? '1' : '0';
        $g.echoLog("needVerifyValue value: " + needVerifyValue);
        if (params.isT9) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.t9'), needVerifyValue);
        } else if (params.t16 && casper.exists(params.t16)) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.t16'), needVerifyValue);
        } else if (params.t12 && casper.exists(params.t12)) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.t12'), needVerifyValue);
        } else if (params.t9 && casper.exists(params.t9)) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.t9'), needVerifyValue);
        } else if (params.t8 && casper.exists(params.t8)) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.t8'), needVerifyValue);
        } else if (params.slider && casper.exists(params.slider)) {
          $g.fs.write($g.getVCodeFilePath("vcode", '.slider'), needVerifyValue);
        } else {
          $g.log.append("input vcode", "vcode is not tx");
        }
        if (needCapInFrame) $backFrame();
        try {
          var dstVcode = $g.getVCodeFilePath("vcode");
          $g.fs.$remove(dstVcode);
          if ($g.fs.exists(dstVcode)) $g.log.append("cap vcode", dstVcode + " still exists");
          if ($g.fs.exists(params.tmpFilePath)) $g.fs.$rename(params.tmpFilePath, dstVcode);
          else $g.log.append("cap vcode", params.tmpFilePath + " not exists");
        } catch (e) {
          $g.log.append("cap vcode", "Exception: " + e.toString());
        }
        params.vstat = VCODE_STAT_READY;
      }
    };
    $g.fs.$md5(params.tmpFilePath, vcodeMd5Callback);
  } else {
    var auto = true;
    var path = false;
    var vcode_failed_path = $g.getVCodeTextPath("vcode.failed");
    if ($g.fs.exists(vcode_failed_path)) {
      $g.fs.$remove(vcode_failed_path);
      $g.acts.ignoreAll();
      return true;
    }
    if ($g.fs.exists(vcode_path)) {
      auto = false;
      path = vcode_path;
    }
    var code = '',
      detected = false;
    if (!detected && path) {
      code = $g.fs.read(path);
      code = code || "";
      code = code.trim();
      if (code.length === 0) {
        params.captured = false;
        return false;
      }
      $g.fs.$remove(vcode_path);
      $g.fs.$remove(auto_vcode_path);
      $g.debug("VCode is inputed: " + code);
    }
    if (code.length > 0) {
      $g.log.append("recv vcode", code);
      params.auto = auto;
      if (code == '----') {
        return true;
      } else if (code === "!@!@!@" || code === 'TIMEOUT') {
        params.captured = false;
        $g.log.append("input vcode", "not clear, input times: " + params.retry + ". Code is not clear!");
        parseAction({
          name: "click",
          selector: params.changeImage ? params.changeImage : params.image
        });
        params.ticks = $g.$ticks(8); // wait for max 8 seconds for vcode comming
        params.lastInfo = false;
        return false;
      }
      $g.variables._vcode_ = code;
      params.code = code;
      vcode_is_ready(params);
    }
  }
  return ret;
}
async function retTagElements(b, s, tag, dedup) {
  /**
   * 增加参数dedup，定义列表采集时是否需要去重
   */
  var script = `(function(b, s, tag, dedup){ 
        var nodes = window.clientUtilsObj.options.scope.querySelectorAll(b), c = 0;
        for (var i = 0, cnt = nodes.length; i < cnt; ++i) {
            var n = nodes[i];
            if (!dedup || !n.getAttribute(tag)) {
              n.setAttribute(tag, s.toString());
              ++s;
              ++c;
            }
        }
        return c;})("` + b + `", ` + s + `, "` + tag + `", ` + dedup + `)`;
  return await $g.domOp.exec(script);
}
var innerClickId = 1;
async function _processInnerClicks(params, idx, clickCustor) {
  var p = params.clicks[idx].selector;
  if (!clickCustor) clickCustor = 0;
  innerClickId += await retTagElements(p, innerClickId, 'innrid', true);
  var eles = await $g.domOp.getElementsInfo(p);
  //$g.debug('inner click eles count: ' + eles.length.toString());
  for (var i = clickCustor, cnt = eles.length; i < cnt; ++i) {
    var s = p + "[innrid='" + eles[i].attributes.innrid + "']";
    //$g.debug('inner click try element: ' + s);
    if (await $g.domOp.exists(s) && await $g.domOp.visible(s)) {
      //$g.debug('inner click: ' + s);
      // $g.acts.scrollToElement(s, true, true);
      await parseAction({
        name: "click",
        emulate: true,
        selector: s
      });
      return true;
    } else {
      $g.debug('inner click: ' + s + ' not visible');
    }
  }
  return false;
}
async function isDataFinished(params) {
  if (params.finishChecker.length === 0) return false;
  for (var i = 0, cnt = params.finishChecker.length; i < cnt; ++i) {
    if (await $g.parseCheckers(params.finishChecker[i])) return true;
  }
  return false;
}
async function parseInnerClicks(params) {
  if (!params.clicks || params.clicks.length === 0) return false;
  var ret = false;
  for (var i = 0, cnt = params.clicks.length; i < cnt; ++i) {
    var clickCustor = 0;
    var maxClicks = 3;
    if (params.maxClicks) var maxClicks = params.maxClicks;
    while (await $g.domOp.exists(params.clicks[i].selector) && clickCustor < maxClicks) {
      if (await _processInnerClicks(params, i, clickCustor)) ret = true;
      clickCustor++;
    }
  }
  return ret;
}
var frameIdBaseIdx = 1;
async function findFrame(selector, eleResolver) {
  var chks = $g.$ARR(selector.frameHtml);
  var cnt = await $g.domOp.childFramesCount();
  for (var i = 0; i < cnt; ++i) {
    await $g.domOp.switchToChildFrame(i);
    var found = true;
    if (chks.length > 0) {
      var h = await $g.domOp.getHTML();
      for (var j = 0; j < chks.length; ++j) {
        if (h.indexOf(chks[j]) == -1) {
          found = false;
          break;
        }
      }
    }
    await $g.domOp.switchToParentFrame();
    if (found) {
      return i;
    }
  }
  return -1;
}
async function $toFrame(selector, eleResolver) {
  $g.log.append("frameSelector1", selector);
  if (!selector.frameSelector) return false;
  let frameSelector = $g.finalizeString(selector.frameSelector);
  $g.log.append("frameSelector2", frameSelector);
  if (!await $g.domOp.exists(frameSelector)) return false;
  $g.log.append("frame", "===================");
  if (frameSelector!="iframe[title='Verification challenge']" && frameSelector!="iframe#game-core-frame") {
    let rc = await $g.domOp.getElementBounds(frameSelector);
    $g.log.append(rc.top, rc.left);
    if (rc) {
      $g.frameOffset = {
        top: rc.top,
        left: rc.left
      }
      $g.frameSelector = frameSelector;
    }
  }
  $g.debug($g.frameOffset);
  await $g.domOp.switchToChildFrame(frameSelector);
  return true;
  /*
  var rc = false,
    frameIdx = false,
    frameSelector = false;
  if ($g.utils.isNumber(selector.frame)) {
    if (selector.frameSelector) {
      frameSelector = $g.finalizeString(selector.frameSelector);
      if (!await $g.domOp.exists(frameSelector)) return false;
      await $g.acts.scrollToElement(frameSelector, true, true);
      rc = await $g.domOp.getElementBounds(frameSelector);
    }
    let childFramesCount = await $g.childFramesCount();
    if (selector.frame >= 0 && selector.frame < childFramesCount) {
      if (!frameSelector) {
        rc = await $g.domOp.getElementsBounds("iframe")[selector.frame];
      }
      frameIdx = selector.frame;
    }
  } else if ($g.utils.isString(selector.frame)) {
    frameSelector = $g.finalizeString(selector.frame);
    $g.debug("frame name resolve to:" + frameSelector);
    frameSelector = "iframe[name='" + frameSelector + "']";
    if (!await $g.domOp.exists(frameSelector)) return false;
    await $g.acts.scrollToElement(frameSelector, true, true);
    rc = await $g.domOp.getElementBounds(frameSelector);
    frameIdx = $g.finalizeString(selector.frame);
  } else {
    console.log("$toFrame", "================");
    if (selector.frameSelector) {
      frameSelector = $g.finalizeString(selector.frameSelector);
      if (!await $g.domOp.exists(frameSelector)) return false;
      rc = await $g.domOp.getElementBounds(frameSelector);
    }
    var frame = await findFrame(selector, eleResolver);
    console.log("frame----", frame);
    if (frame != -1) {
      if (!frameSelector) rc = await $g.domOp.getElementsBounds("iframe")[frame];
      frameIdx = frame;
    }
  }
  if (rc) {
    $g.frameOffset = {
      top: rc.top,
      left: rc.left
    };
    $g.debug($g.frameOffset);
    $g.utils.dump($g.frameOffset);
  }
  if (frameIdx != -1) {
    // getFrameOffset();
    await $g.domOp.switchToChildFrame(frameIdx);
    return true;
  }
  return false;
  */
}

function $backFrame() {
  $g.frameOffset = false;
  $g.frameOffset = {
    top: 0,
    left: 0
  };
  $g.frameSelector = false;
  $g.domOp.switchToParentFrame();
}

function $switchPage(params) {
  // if ((params.popup && !$toPopup(params.popup)) || ((params.frame || params.frameHtml) && !$toFrame(params))) {
  //   $g.acts.ignoreAll();
  // }
  if ((params.popup && !$toPopup(params.popup)) || (params.frameSelector && !$toFrame(params))) {
    $g.acts.ignoreAll($g.errors_code.ACTION_EXCEPTION);
  }
}

function $backPage(params) {
  if (params.popup) {
    $backPopup();
  } else if (params.frame) {
    $backFrame();
  }
}
async function parseDataPager(params, idx) {
  var click = params.pager[idx];
  if (click.scroll) {
    await parseAction($g.extend({
      name: "scroll",
      emulate: true
    }, click));
  } else {
    await parseAction($g.extend({
      name: "click",
      emulate: true
    }, click));
  }
}
async function parseDataPagerChecker(params, idx) {
  return params.pager[idx].ready ? await $g.parseCheckers(params.pager[idx].ready) : false;
}
var dataImgIdx = 1;
async function $enumData(r, p) {
  var v = JSON.stringify(r.values);
  v = v.replaceAll('<self>', p);
  var o = $g.$json_from_string(v);
  if (o) {
    for (var f in o) {
      if (await $g.parseCheckers(o[f])) return f;
    }
  } else {
    $g.debug('Failed to parse json string from: ' + v);
    $g.echoLog('Failed to parse json string from: ' + v);
  }
  return r['default'];
}
async function $rawData(r, p, po, obj, ret) {
  if (!p) p = '';
  ret.fromIndex = -1;
  if (r.target && r.target === '<value>') return $g.finalizeString(r.value);
  var t = typeof (r.target);
  var targets = t == 'string' ? [r.target] : r.target;
  var froms = r.from ? $g.$ARR(r.from) : false;
  var eleIndexs = r.eleIndex ? $g.$ARR(r.eleIndex) : false;
  var fLen = froms.length - 1;
  var url = await $g.domOp.getCurrentUrl(),
    search = '';
  var pos = url.indexOf('?');
  var pathname = url;
  if (pos != -1) {
    search = url.substr(pos + 1);
    pathname = url.substr(o, pos);
  }
  pos = url.indexOf('://');
  var pathname = pathname.substr(pos + 3);
  for (var i = 0, cnt = targets.length; i < cnt; ++i) {
    var target = targets[i],
      ruleIdx = i.toString();
    if (r.rule && r.rule[ruleIdx]) $g.extend(r, r.rule[ruleIdx]);
    if (r.image) {
      if (target == '<self>') t = p;
      else t = p + ' ' + target;
      if (await $g.domOp.exists(t) && await $g.domOp.visible(t)) {
        var fname = 'dtex_img_' + dataImgIdx;
        ++dataImgIdx;
        await $g.capture(fname, t, false, false, r.offset);
        return fname + '.jpg';
      }
      continue;
    }
    var from = false;
    /**
     * TODO 
     */
    if (froms) {
      if (i > fLen) ret.fromIndex = 0;
      else ret.fromIndex = i;
      from = froms[ret.fromIndex];
    }
    if (from == 'text') from = false;
    if (from == '<url>') {
      if (typeof (target) == 'string') {
        var x = search.match(new RegExp(target + '=([^&]+)'));
        if (x && x.length > 0) return x[1];
        continue;
      } else if (t == 'number') {
        p = pathname.split('/');
        var idx = target;
        if (idx < 0) {
          idx = p.length + idx;
        }
        if (idx >= 0 && idx < p.length) return p[idx];
        continue;
      }
      return url;
    }
    var o;
    if (target == '<self>') {
      o = po;
    } else {
      o = p ? p + ' ' + target : target;
      //$g.debug(target);
      if (!await $g.domOp.exists(o)) continue;
      o = await $g.domOp.getElementsInfo(o);
      if (r.count) {
        if (r.count === true) {
          return o.length.toString();
        } else if ($g.utils.isString(r.count)) {
          var oo = p ? p + ' ' + r.count : r.count;
          if (await $g.domOp.exists(oo)) oo = await $g.domOp.getElementsInfo(oo);
          else oo = [];
          if (r.from || r.text || r.trims) {
            var v;
            o = o[0];
            v = $ev(o, r.from);
            if (r.trims) v = $g.$trimArr(v, r.trims);
            v = parseInt($g.createNumber(v));
            return (oo.length + v).toString();
          }
          return (o.length + oo.length).toString();
        } else {
          var oo = p ? p + ' ' + r.count.selector : r.count.selector,
            v = 0;
          if (await $g.domOp.exists(oo)) {
            oo = await $g.domOp.getElementsInfo(oo);
            oo = oo[0];
            v = $g.$ev(oo, r.count.from);
            if (r.count.trims) v = $g.$trimArr(v, r.count.trims);
            v = parseInt($g.createNumber(v));
          }
          return (o.length + v).toString();
        }
      }
      if (!r.all && !r.media) {
        var eleIndex = 0;
        if (eleIndexs[i]) eleIndex = eleIndexs[i];
        /*if (r.eleIndex) {
          if (r.eleIndex == 'last') eleIndex = o.length - 1;
          else eleIndex = r.eleIndex;
        }*/
        if (eleIndex >= o.length) continue;
        o = o[eleIndex];
      }
      //$g.debug(target);
    }
    var isHtml = r.html ? true : false;
    if (from && from == 'html') {
      from = false;
      isHtml = true;
    }
    var finalData = '';
    if (r.media) {
      var sep = '';
      for (var aIdx = 0; aIdx < o.length; ++aIdx) {
        var media_from = from ? from : 'src';
        var nvv = o[aIdx].attributes[media_from] ? o[aIdx].attributes[media_from].trim() : '';
        if (nvv.length === 0) continue;
        if (nvv.startsWith('/')) {
          nvv = ($g.variables._current_url_root_ ? $g.variables._current_url_root_ : $g.variables._current_url_parent_) + nvv;
        } else if (nvv.startsWith('://')) {
          var urlPart = $g.variables._current_url_.split(':');
          nvv = urlPart[0] + nvv;
        }
        finalData += sep + nvv;
        if (sep.length === 0) sep = "\n";
      }
    } else if (from) {
      var attr = o.attributes[from];
      finalData = attr ? attr.trim() : '';
    } else {
      if (r.all) {
        var sep = '';
        for (var aIdx = 0; aIdx < o.length; ++aIdx) {
          var nvv = isHtml ? o[aIdx].html.trim() : o[aIdx].text.trim();
          if (nvv.length === 0) continue;
          if (r.itemFilter && $g.indexOfArray(r.itemFilter, nvv) === -1) continue;
          finalData += sep + nvv;
          if (sep.length === 0) sep = "\n";
        }
      } else {
        if (isHtml) finalData = o.html.trim() ? o.html.trim() : o.tag.trim();
        else finalData = o.text.trim();
      }
    }
    if (finalData == '') continue;
    //$g.debug(target);
    if (!r.untilNotEmpty || finalData.length > 0) return finalData;
  }
  return '';
}

function $dataFromDataEx(r, v) {
  if (!$g.resultsEx.dataEx[r.dataName]) return '';
  var d = $g.resultsEx.dataEx[r.dataName].data;
  if (!d || d.length === 0) return '';
  for (var i = 0, cnt = d.length; i < cnt; ++i) {
    if (d[i][r.fieldToCompare] == v) {
      return d[i][r.fieldToCompare][r.fieldInDataEx] ? d[i][r.fieldToCompare][r.fieldInDataEx] : '';
    }
  }
  return '';
}

function $emptyWhen(c, d) {
  var op = c.operator;
  var v = $g.$ARR(c.values);
  for (var i = 0, cnt = v.length; i < cnt; ++i) {
    if ($g.checkVar(d, v[i], op)) return true;
  }
  return false;
}

function $checkNoTrims(idx, r) {
  if ((!r.noTrimsWhenFrom && r.noTrimsWhenFrom !== 0) || idx < 0) return false;
  return $g.inArray(r.noTrimsWhenFrom, idx) !== -1;
}
async function $checkCondition(r, p) {
  if (!r.condition) return true;
  var v = JSON.stringify(r.condition);
  v = v.replaceAll('<self>', p);
  var o = $g.$json_from_string(v);
  return o ? await $g.parseCheckers(o) : true;
}

function $checkFields(r, obj) {
  if (!r.checkFields) return true;
  if (!obj[r.checkFields.name]) return false;
  var exp = $g.$ARR(r.checkFields.expected),
    v = obj[r.checkFields.name],
    op = r.checkFields.operator;
  for (var i = 0, cnt = exp.length; i < cnt; ++i) {
    if ($g.checkVar(v, exp[i], op)) return true;
  }
  return false;
}

function $valueContains(r, d) {
  if (!r.valueContains) return true;
  return $g.inArray(r.valueContains, d) !== -1;
}
async function $url(d, r) {
  var u = await $g.domOp.getCurrentUrl();
  preU = '';
  var pos = u.indexOf('://');
  if (pos != -1) {
    pos = u.indexOf('/', pos + 3);
    if (pos != -1) preU = u.substr(0, pos);
  }
  return formatUrl(d, u, preU);
}
async function $data(r, p, po, obj) {
  if (!$checkFields(r, obj) || !await $checkCondition(r, p)) return '';
  var ret = {};
  var d = '';
  if (r.fromField) d = obj[r.fromField];
  else d = r['enum'] ? await $enumData(r, p) : await $rawData(r, p, po, obj, ret);
  if (!d || d.length === 0) return '';
  if (!$valueContains(r, d)) return '';
  if (r.isUrl) return await $url(d, r);
  if ($checkNoTrims(ret.fromIndex, r)) return d;
  if (r.emptyWhen && $emptyWhen(r.emptyWhen, d)) return '';
  if (r.fromDataEx) return $dataFromDataEx(r, d);
  if (r.decode) d = decodeURIComponent(d);
  else if (r.encode) d = encodeURIComponent(d);
  if (!r.trims) {
    if (r.from == 'src' || r.from == 'href') {
      var urlPart = $g.variables._current_url_.split(':');
      if (d.startsWith('//')) {
        d = urlPart[0] + ':' + d;
      } else if (d.startsWith('../')) {
        let  currentURL = $g.variables._current_url_;
        currentURL = currentURL.replace(/\/[^\/]*$/, '');
        do {
          d = d.replace(/^\.\.\//, '');
          currentURL = currentURL.replace(/\/[^\/]*$/, '');
        }while(d.startsWith('../'));
        d = currentURL + '/' + d
      } else if (d.startsWith('/') || d.startsWith('./') || d.startsWith('?')) {
        if(d.startsWith('./')){
          d = d.replace(/^\.\//, '/');
        }
        console.log(d);
        d = ($g.variables._current_url_root_ ? $g.variables._current_url_root_ : $g.variables._current_url_parent_) + d;
        console.log($g.variables._current_url_root_);
        console.log(d);
      } else if (d.startsWith('://')) {
        d = urlPart[0] + d;
      } else if (!d.startsWith('http')) {
        const current_url_end = $g.variables._current_url_.replace($g.variables._current_url_parent_, '')
        let curl_prefix = ''
        if (current_url_end.indexOf('.') > -1) {
          curl_prefix = $g.variables._current_url_parent_
        } else {
          curl_prefix = $g.variables._current_url_
        }
        if (!curl_prefix.endsWith('/')) {
          curl_prefix = curl_prefix + '/'
        }
        d = curl_prefix + d
      }
    }
  } else {
    d = $g.$trimArr(d, $selectTrims(r, d));
  }
  if (r.number) return $g.createNumber(d);
  return r.timeFormat ? $g.$time(d, r.timeFormat) : d;
}

function $selectTrims(r, d) {
  if (!r.trims) return [];
  if (!r.selectTrims) return r.trims;
  for (var p in r.selectTrims) {
    var arr = $g.$ARR(r.selectTrims[p]);
    for (var i = 0, cnt = arr.length; i < cnt; ++i) {
      if (d.indexOf(arr[i]) !== -1) return r.trims[parseInt(p)];
    }
  }
  return r.trims[0];
}

function $r(r, idx) {
  return r[idx] ? r[idx] : r;
}
async function $field(p, po, r, idx, obj) {
  var d = await $data($r(r, idx), p, po, obj);
  return (!d || d.length === 0) && r['default'] ? r['default'] : d;
}
async function paraseDataDesc(params) {
  var d = {};
  if (params.desc) {
    for (var k in params.desc) {
      if (d[k]) continue;
      d[k] = await $field(false, false, params.desc[k], 0, d);
    }
  }
  return d;
}
var objMaxDataId = {},
  objStartDataId = {},
  objDataTagPrefix = {},
  blocksCount = 1,
  processedDataIds = {};

function getDataTagPrefix(block) {
  if (!objDataTagPrefix[block]) {
    objDataTagPrefix[block] = 'pdpdpd' + blocksCount;
    ++blocksCount;
  }
  return objDataTagPrefix[block];
}

function getMaxDataId(block) {
  if (!objMaxDataId[block]) objMaxDataId[block] = 1;
  return objMaxDataId[block];
}

function getStartDataId(block) {
  if (!objStartDataId[block]) objStartDataId[block] = 1;
  return objStartDataId[block];
}

function changeAttributes(params) {
  var elements = $g.$ARR(params);
  for (var i = 0; i < elements.length; ++i) {
    var ele = elements[i];
    var aSelector = $g.$selector(ele.selector);
    changeElementAttribute(aSelector, ele.method,
      ele.name, ele.value, ele.sep);
  }
}
async function changeElementAttribute(selector, method, name, newValue, sep) {
  if (!sep) {
    if (name == "style") sep = ";";
    else sep = " ";
  }
  newValue = newValue ? $g.finalizeString(newValue) : '';
  let script = `(function(aSelector, method, n, v, sep) {
        var nodes = document.querySelectorAll(aSelector);
        if (nodes.length === 0) {
            console.log("no element found");
            return;
        }
        for (var i = 0; i < nodes.length; ++i) {
            if (method == "set") {
                nodes[i].setAttribute(n, v);
            } else if (method == "remove") {
                var o = nodes[i].getAttribute(n);
                if (o && o.length > 0) {
                    v = o.replace(new RegExp(v, "gm"), "");
                    nodes[i].setAttribute(n, v);
                }
            } else if (method == "append") {
                var o = nodes[i].getAttribute(n), nov = sep + v;
                if (o && o.length > 0) {
                    if (o.indexOf(v) === 0 || o.indexOf(nov) != -1) continue;
                    o += nov;
                } else {
                    o = v;
                }
                nodes[i].setAttribute(n, o);
            } else if (method == "delete") {
                if (nodes[i].hasAttribute(n)) nodes[i].removeAttribute(n);
            }
        }
    })("` + selector + `", "` + method + `", "` + name + `", "` + newValue + `", "` + sep + `")`;
  console.log("-----------------");
  console.log(script);
  console.log("-----------------");
  await $g.domOp.exec(script);
}
async function $fields(p, po, r, idx, predefine, fakeId) {
  if (!r.fields) return {};
  var d = {};
  for (var k in r.fields) {
    if (d[k]) continue;
    if (k === '_fake_id') {
      d[k] = fakeId;
      continue;
    }
    var field = r.fields[k];
    if ($g.showDataFieldLog) console.log('fields: ' + k);
    d[k] = await $field(p, po, field, idx, d);
    if (field.variables && $g.utils.isString(field.variables)) {
      var o = {};
      var v = field.variables;
      if (!$g.variables[v]) $g.variables[v] = [];
      o[k] = d[k];
      $g.variables[v].push(o);
    }
  }
  if (predefine) {
    var pf = predefine[idx] ? predefine[idx] : predefine['0'];
    if (pf) $g.extend(d, pf);
    if (predefine['all']) $g.extend(d, predefine['all']);
  }
  return d;
}

function saveDataId(block, maxId, startId) {
  objMaxDataId[block] = maxId;
  objStartDataId[block] = startId;
}

function formatUrl(url, u, preU) {
  if (url.startsWith('/')) {
    return $g.trimLast(preU + url, '/');
  }
  if (url.length == 0) return u;
  if (url.startsWith('../')) {
    var pPos = 0,
      pUrl = url;
    pPos = u.indexOf('?');
    if (pPos !== -1) u = u.substr(0, pPos);
    pPos = u.lastIndexOf('/');
    if (pPos !== -1) {
      u = u.substr(0, pPos);
      do {
        pPos = u.lastIndexOf('/');
        if (pPos === -1) break;
        u = u.substr(0, pPos);
        pUrl = pUrl.substr(3);
      } while (pUrl.startsWith('../'));
    }
    return u + '/' + pUrl;
  }
  var t = url.substr(0, 4).toLowerCase();
  if (t != 'http') {
    var pos = u.indexOf('#');
    if (pos != -1) u = u.substr(0, pos);
    pos = u.lastIndexOf('/');
    if (pos == -1) return '';
    var pos2 = u.indexOf('://');
    if (pos2 + 2 == pos) {
      url = u + '/' + url;
    } else {
      url = u.substr(0, pos + 1) + url;
    }
  }
  return $g.trimLast(url, '/');
}
async function parseData(params) {
  var dedup = params.dedup != undefined ? params.dedup : true;
  if (!params._getDesc) {
    $g.resultsEx.dataEx[params.name].desc = await paraseDataDesc(params);
    params._getDesc = true;
  }
  var blocks = params.blocks;
  for (var i = 0, cnt = blocks.length; i < cnt; ++i) {
    var block = blocks[i];
    if (!block || !await $g.domOp.exists(block)) {
      $g.debug('block does not exist: ' + block);
      continue;
    }
    var blockTag = block + "_" + params.name;
    var tag = getDataTagPrefix(blockTag),
      maxDataId = getMaxDataId(blockTag),
      startDataId = getStartDataId(blockTag);
    maxDataId += await retTagElements(block, maxDataId, tag, dedup);
    console.log('start: ' + startDataId + '. end: ' + maxDataId);
    var j = 0;
    for (; startDataId < maxDataId; ++startDataId) {
      var dataTag = "[" + tag + "='" + startDataId + "']";
      if (processedDataIds[dataTag]) continue;
      var parent = block + dataTag;
      if (!await $g.domOp.exists(parent)) continue;
      if (params.condition) {
        var con = JSON.stringify(params.condition);
        con = con.replaceAll('<self>', parent);
        con = $g.$json_from_string(con);
        if (con && !await $g.parseCheckers(con)) {
          $g.debug('element condition not match: ' + parent);
          processedDataIds[dataTag] = true;
          continue;
        }
      }
      ++j;
      //$g.debug('data item: ' + parent);
      if (params.attrs) changeAttributes(params.attrs);
      if (params.scrollToEndWhenInvisible) {
        $g.debug('data item: ' + parent + ' not visible');
        while (!await $g.domOp.visible(parent)) {
          await $g.scrollToBottom(true, true);
        }
      } else if (params.scrollToEachItem) {
        $g.debug('scroll to: ' + parent);
        await parseAction({
          name: "scroll",
          selector: parent,
          emulate: true
        });
      }
      var po = await $g.domOp.getElementInfo(parent);
      $g.resultsEx.dataEx[params.name].data.push(await $fields(parent, po, params, j.toString(), params.predefine, startDataId));
      //$g.debug('data item: ' + parent + ' finished');
      processedDataIds[dataTag] = true;
      if (j > 10) {
        j = 0;
        //$g.saveResultEx();
      }
      if (params.maxCount && $g.resultsEx.dataEx[params.name].data.length >= params.maxCount) break;
    }
    saveDataId(blockTag, maxDataId, startDataId);
    $g.saveResultEx();
  }
  $g.saveResultEx();
}
Date.prototype.format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }

  return fmt;
}

function initActions() {
  $g.actions = {
    open: (params, condition) => {
      $g.acts.update(params);
      $g.processExecTag = true;
      $g.loadPageTag = true;
      let url = $g.finalizeString(params.url);
      // win.loadURL(url);
      if (url.startsWith("@@")) {
        $g.acts.exit_loop(params);
        $g.processExecTag = false;
        return;
      }
      let code = "window.location.href = '" + url + "'";
      $g.domOp.exec(code);
      setTimeout(() => {
        if ($g.loadPageTag && $g.processExecTag) $g.processExecTag = false;
      }, 60000);
    },
    wait: async (params, condition) => {
      if (params.interval) {
        var interval = params.interval;
        if (interval == "random") {
          interval = $g.math.randomBetween(1, 4) * 1000;
          if (params.multi) interval *= params.multi;
          params.interval = interval;
        }
        $g.echoMsg('wait: ' + params.interval);
        await $g.sleep(params.interval);
        $g.processExecTag = false;
        return;
      }
      if (!params.timeout) params.timeout = 90000;
      else if (params.timeout < 10000) params.timeout = 90000;
      let timeout = params.timeout;
      let startTime = new Date().getTime();
      let ret = await $g.parseCheckers(params.checkers);
      var timer1 = setInterval(async function () {
        var ret = await $g.parseCheckers(params.checkers);
        if (ret) {
          $g.processExecTag = false;
          clearInterval(timer1);
        }
        let currentTime = new Date().getTime();
        console.log(params.timeout, currentTime - startTime);
        if (currentTime - startTime >= params.timeout) {
          $g.processExecTag = false;
          clearInterval(timer1);
          $g.log.append("wait", params.checkers);
          if (!params.ignorable) $g.acts.ignoreAll($g.errors_code.TIMEOUT);
        }
      }, 2000);
    },
    call: async (params, condition) => {
      if (!params.code) {
        $g.acts.ignoreAll($g.errors_code.SCRIPT_ILLEGAL);
        $g.processExecTag = false;
        return;
      }
      let code = $g.finalizeString(params.code);
      await $g.domOp.exec(code);
      $g.processExecTag = false;
    },
    click: async (params, condition, noAction) => {
      if (params.groupClick) {
        if (params.retryInterval) params.retryInterval = parseInt(params.retryInterval);
        else params.retryInterval = 10;
        if (isNaN(params.retryInterval)) params.retryInterval = 10;
        params.maxCount = params.maxCount ? params.maxCount : -1;
        params.curCount = 1;
        // let script = "(function() {var ns = document.querySelectorAll(\"" + params.parent + "\");for (var i = 0; i < ns.length; ++i) { ns[i].setAttribute('grp_giid', (i+1).toString());} return ns ? ns.length : 0;})()";
        let script = "(function() {var ns = window.clientUtilsObj.findAll(\"" + params.parent + "\");for (var i = 0; i < ns.length; ++i) { ns[i].setAttribute('grp_giid', (i+1).toString());} return ns ? ns.length : 0;})()";
        let total = await $g.domOp.exec(script);
        // console.log(total);
        // console.log(params.maxCount < total ? params.maxCount : total);
        for (let i = 1; i <= (params.maxCount < total ? params.maxCount : total); i++) {
          let p = params.parent + "[grp_giid='" + i + "']";
          let aSelector = p + " " + params.selector;
          // await mouseAction(aSelector, 'click');
          await parseAction({
            name: 'click',
            selector: aSelector
          });
          await $g.sleep(params.retryInterval * 1000);
        }
      } else if (params.pos) {
        let x = params.pos.x,
          y = params.pos.y;
        await win.webContents.sendInputEvent({
          type: 'mouseDown',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1
        });
        await win.webContents.sendInputEvent({
          type: 'mouseUp',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1
        });
      } else {
        let aSelector = params.selector;
        // await mouseAction(aSelector, 'click');
        // await parseAction({name: 'click', selector: aSelector});
        var elements = $g.$ARR(params);
        var actions = [];
        for (var i = 0; i < elements.length; ++i) {
          elements[i].name = 'click';
          actions.push(elements[i]);
        }
        await parseAction(actions);
      }
      if (!noAction) $g.processExecTag = false;
    },
    input: async (params, condition) => {
      if (params.type == 'form') {
        let selector = params.selector;
        let data = {
          func: "fill",
          args: [selector, params.value, 'css']
        }
        win.webContents.send('execScript', data);
      } else {
        await inputAction(params);
      }
      $g.processExecTag = false;
    },
    keyboard: async (params, condition) => {
      if (params.selector) {
        await parseAction({
          name: 'click',
          selector: params.selector
        });
        await $g.sleep(3000);
      }
      num = params.num || 10
      for (let i=0; i<num; i++) {
        await win.webContents.sendInputEvent({
          type: params.keytype,
          keyCode: params.keycode
        });
        await $g.sleep(100);
      }
      $g.processExecTag = false;
    },
    jump: async (params, condition) => {
      $g.log.append('jump', `jump action start, time:${new Date()}`)
      var checkFun = function (ret) {
        if (!ret) {
          return;
        }
        $g.log.append('jump', `${JSON.stringify(params)}, time:${new Date()}`)
        $g.log.append('jump', `currentStep: ${$g.currentStep}, time:${new Date()}`)
        if ($g.currentStep > params._step) {
          $g.log.append('jump', `error jump run again`)
          return;
        }

        if (params.to) {
          $g.acts.to(params);
        } else if (params.label) {
          $g.acts.toLabel(params.label, params);
        } else if (params.step && params.step != -1) {
          $g.acts.ignore(params.step);
        } else if (params.continue_loop) {
          $g.acts.continue_loop(params);
        } else if (params.exit_loop) {
          $g.acts.exit_loop(params);
        } else {
          $g.acts.success();
        }
      }
      let check_ret = true;
      if (params.checkers)
        check_ret = await $g.parseCheckers(params.checkers);
      checkFun(check_ret);
      $g.processExecTag = false;
    },
    recordErr: async (params, condition) => {
      var paramsList = $g.$ARR(params);
      var exit = false;
      for (var i = 0; i < paramsList.length; ++i) {
        var v = paramsList[i]
        v.code = $g.finalizeString(v.code, undefined, true);
        if (v.exit) {
          exit = true;
          exit_code = v.code;
        } else {
          $g.errors[v.name] = v.code;
        }
      }
      if (exit) {
        $g.acts.ignoreAll(exit_code);
      }
      $g.processExecTag = false;
    },
    request: async (params, condition) => {
      $g.variables["last_response"] = null
      try {
        if (typeof (params.data) == 'string') {
          params.data = $g.finalizeString(params.data);
          params.data = JSON.parse(params.data);
        }
        $g.log.append("start request", "method is " + params.method + ", url is " + params.url);
        if (params.url && params.method) {
          if (params.method.toLowerCase() == "get" || params.method.toLowerCase() == "post") {
            try {
              const response = await axios({
                url: params.url,
                method: params.method.toLowerCase(),
                data: params.data ? params.data : null,
                headers: params.headers ? params.headers : null
              })
              $g.variables["last_response"] = JSON.stringify({"data": response.data, "status": response.status});
            } catch(e) {
              $g.log.append('resp error', e);
              $g.variables["last_response"] = '{"data": "", "status": -1}';
            }
            $g.log.append("response", $g.variables["last_response"]);
          }
        }
      } catch(e) {
        $g.log.append('resp error', e);
        $g.variables["last_response"] = '{"data": "", "status": -1}';
      }
      $g.echoLog(JSON.stringify($g.variables));
      $g.processExecTag = false;
    },
    variables: async (params, condition) => {
      var vs = $g.$ARR(params);
      var u = await $g.domOp.getCurrentUrl(),
        preU = '';
      var pos = u.indexOf('://');
      if (pos != -1) {
        pos = u.indexOf('/', pos + 3);
        if (pos != -1) preU = u.substr(0, pos);
      }
      for (var i = 0; i < vs.length; ++i) {
        var v = vs[i];
        if (v.value) {
          $g.variables[v.name] = v.value;
        } else if (v.selector) {
          v.selector.attrOnly = true;
          var aSelector = $g.$selector(v.selector);
          let ele = await $g.domOp.getElementInfo(aSelector);
          if (ele) {
            var data = $g.$ev(ele, v.from);
            data = $g.$trimArr(data, v.trim);
            if (v.toArray) {
              var dataSep = v.sep || ',';
              data = data.split(dataSep);
              if ($g.utils.isNumber(v.getFromArrayIndex)) {
                data = data[v.getFromArrayIndex];
              }
            }
          } else {
            var data = '';
          }
          $g.variables[v.name] = data;
        } else if (v.isUrl) {
          $g.variables[v.name] = formatUrl($g.variables[v.name] ? $g.variables[v.name] : '', u, preU);
        } else if (v.fromUrlPart) {
          $g.variables[v.name] = $g.$trimArr($g.variables[v.partName], v.trim);
        } else if (v.fromJsVar) {
          let script = `(function(s){
                        return window[s];
                    })("` + v.name + `")`;
          var tmpVar = await $g.domOp.exec(script);
          if ($g.utils.isArray(tmpVar)) {
            if (v.condition) {
              var found = false;
              $g.log.append("variables", "fromJsVar");
              for (var j = 0; j < tmpVar.length; ++j) {
                var aVar = tmpVar[j];
                if (aVar[v.condition.name] == v.condition.value) {
                  found = true;
                  $g.variables[v.name] = aVar;
                  break;
                }
              }
            } else {
              $g.variables[v.name] = tmpVar;
            }
          } else {
            if (v.field) {
              $g.variables[v.name] = tmpVar[v.field];
            } else {
              $g.variables[v.name] = tmpVar;
            }
          }
          $g.echoLog(JSON.stringify($g.variables));
        }
        if (v.name == "errors") {
          $g.errors = $g.variables.errors;
          delete $g.variables.errors;
        }
      }
      $g.processExecTag = false;
    },
    writeFile: async (params, condition) => {
      if (!params.value || !params.toFile) return;
      var value = $g.finalizeString(params.value);
      var fileName = params.toFile;
      var tmpPath = $g.getPath(fileName);
      console.log(tmpPath);
      console.log(value);
      $g.fs.write(tmpPath, value);
      $g.processExecTag = false;
    },
    getSessionId: async (params, condition) => {
      var fileName = params.toFile;
      var tmpPath = $g.getPath(fileName);
      $g.session.defaultSession.cookies.get({}).then(function (o) {
        if (o && o.length > 0) {
          for (var p in o) {
            if (o[p]['name'] == 'sessionid') {
              let value = o[p]['value'];
              $g.fs.write(tmpPath, value);
            }
          }
        }
      });
      $g.processExecTag = false;
    },
    scrollY: async (params, condition) => {
      var deltaY = Math.random() * -500;
      if (params.up) deltaY = Math.random() * 500;
      for (var i = 0; i < params.nums; i++) {
        await win.webContents.sendInputEvent({
          type: 'mouseWheel',
          x: $g.basePos.x,
          y: $g.basePos.y,
          canScroll: true,
          deltaX: 0,
          deltaY: deltaY
        });
        await $g.sleep(Math.random() * 2000);
        if (params.checkers && !(params.nums % 5) && await $g.parseCheckers(params.checkers)) break;
      }
      $g.processExecTag = false;
    },
    scroll: async (params, condition) => {
      let scrollTop = await $g.domOp.exec("parent.document.documentElement.scrollTop");
      let screenSize = await $g.domOp.getWindowSize();
      if (params.scrollY) {
        var y = parseInt(params.scrollY);
        y = y + scrollTop - screenSize.height / 2;
        await $g.acts.scrollToPos(false, 0, y);
      } else if (params.nextScreen) {
        y = scrollTop + screenSize.height + 1000;
        await $g.acts.scrollToPos(false, 0, y);
      } else if (params.nums) {
        for (var i = 0; i < params.nums; i++) {
          var deltaY = Math.random() * -500;
          if (params.up) deltaY = Math.random() * 500;
          await win.webContents.sendInputEvent({
            type: 'mouseWheel',
            x: $g.basePos.x,
            y: $g.basePos.y,
            canScroll: true,
            deltaX: 0,
            deltaY: deltaY
          });
          await $g.sleep(Math.random() * 2000);
          if (params.checkers && !(params.nums % 5) && await $g.parseCheckers(params.checkers)) break;
        }
      } else {
        let aSelector = params.selector;
        if (aSelector == 'end') {
          await $g.scrollToBottom(true);
          $g.processExecTag = false;
          return;
        }
        let isVisible = await $g.domOp.visible(aSelector);
        if (!isVisible) {
          $g.processExecTag = false;
          return;
        }
        await $g.acts.scrollToElement(aSelector);
      }
      $g.processExecTag = false;
    },
    crawlerEx: async (params, condition) => {
      var vs = $g.$ARR(params);
      for (var i = 0; i < vs.length; ++i) {
        var tmp = {},
          item = vs[i];
        if (item.fixValues) {
          var fobj = {};
          for (var fjj = 0; fjj < item.names.length; ++fjj) {
            var fjjn = item.names[fjj];
            fobj[fjjn] = $g.finalizeString(item.fixValues[fjjn]);
          }
          $g.resultsEx[item.name] = [fobj];
        } else if (item.fromUrl) {
          $g.resultsEx[item.name] = crawlerFromUrl(item);
        } else if (item.fromVariables) {
          if ($g.utils.isString(item.fromVariables)) {
            console.log($g.variables);
            $g.resultsEx[item.name] = $g.variables[item.fromVariables] ? $g.variables[item.fromVariables] : '';
          } else {
            var o = {};
            for (var vj = 0; vj < item.fromVariables.length; ++vj) {
              var vjItem = item.fromVariables[vj];
              o[vjItem[0]] = $g.variables[vjItem[1]] ? $g.variables[vjItem[1]] : '';
            }
            $g.resultsEx[item.name] = o;
          }
        } else if (item.url) {
          $g.resultsEx[item.name] = await $g.domOp.getCurrentUrl();
        } else {
          $g.resultsEx[item.name] = await crawlerNormal(item);
        }
      }
      $g.saveResults();
      $g.processExecTag = false;
    },
    resultsEx: async (params, condition) => {
      $g.resultsEx[params.name] = $g.finalizeString(params.value);
      $g.saveResultEx();
      $g.processExecTag = false;
    },
    waitPhone: async (params, condition) => {
      let startTime = new Date().getTime();
      let timeout = params.timeout ? parseInt(params.timeout) : 90000;
      while (true) {
        let currentTime = new Date().getTime();
        if (currentTime - startTime >= timeout) {
          $g.acts.ignoreAll($g.errors_code.NO_PHONE_AVAILABLE);
          break;
        }
        if (!params.inited) {
          params.inited = true;
          params.phoneFilePath = $g.getPhonePath();
          $g.fs.$remove(params.phoneFilePath);
          var tmpPath = $g.getPath('tmp_wait_phone');
          $g.fs.write(tmpPath, params.mobile);
          $g.fs.$rename(tmpPath, $g.getWaitPhonePath());
          continue;
        }
        var data = $g.fs.read(params.phoneFilePath);
        $g.fs.$remove(params.phoneFilePath);
        if (data) {
          $g.debug('Get phone data');
          params.value = data.toString();
          $g.mobile = params.value;
          var tmpPath = $g.getPath('mobile');
          $g.fs.write(tmpPath, $g.mobile);
          if (params.notNeedInput) break;
          await inputAction(params);
          break;
        }
        await $g.sleep(2000);
      }
      $g.processExecTag = false;
    },
    waitSMS: async (params, condition) => {
      let startTime = new Date().getTime();
      let timeout = params.timeout ? parseInt(params.timeout) : 90000;
      while (true) {
        let currentTime = new Date().getTime();
        if (currentTime - startTime >= timeout) {
          $g.acts.ignoreAll($g.errors_code.NO_VERIFY_CODE);
          break;
        }
        if (!params.inited) {
          params.inited = true;
          params.smsFilePath = $g.getSmsPath();
          $g.fs.$remove(params.smsFilePath);
          var tmpPath = $g.getPath('tmp_wait_sms');
          if ($g.mobile) params.mobile = $g.mobile;
          $g.fs.write(tmpPath, params.mobile);
          $g.fs.$rename(tmpPath, $g.getWaitSmsPath());
          continue;
        }
        var data = $g.$json(params.smsFilePath);
        $g.fs.$remove(params.smsFilePath);
        if (data) {
          $g.debug('Get sms data');
          for (var i = 0, cnt = data.length; i < cnt; ++i) {
            var text = analyzeSMS(params, data[i]);
            if (text) {
              params.value = text;
              await inputAction(params);
              break;
            }
          }
          break;
        }
        await $g.sleep(2000);
      }
      $g.processExecTag = false;
    },
    snapshot: async (params, condition) => {
      let fileName = "snapshot_0";
      let prefix = "";
      if (params.prefix) {
        prefix = $g.finalizeString(params.prefix) + "_";
      }
      if (params.fileName && params.format == "time") {
        fileName = $g.finalizeString(params.fileName);
        fileName = new Date(parseInt(fileName) * 1000).format("yyyyMMdd_hhmmss");
      } else {
        fileName = "snapshot_" + imageName;
      }
      imageName++;
      let aSelector = params.selector;
      await $g.capture(prefix + fileName, aSelector);
      await $g.sleep(2000);
      $g.processExecTag = false;
    },
    checkvcode: async (params, condition) => {
      let container = params.container;
      var timeout = params.timeout ? params.timeout : VCODE_TIME_OUT;
      if (params.retryInterval) params.retryInterval = parseInt(params.retryInterval);
      else params.retryInterval = 15;
      if (isNaN(params.retryInterval)) params.retryInterval = 15;
      if (!params.maxRetry || !$g.utils.isNumber(params.maxRetry)) {
        params.maxRetry = 2;
      }
      params.retry = 1;
      params.vstat = VCODE_STAT_READY;
      params.inited = false;
      var tmpTmout = params.maxRetry * params.retryInterval * 1000;
      params.timeout = tmpTmout > timeout ? tmpTmout : timeout;
      while (true) {
        if (!await $g.domOp.visible(container)) {
          break;
        }
        let ret = await parseVCode(params);
        if (ret) {
          break;
        }
        await $g.sleep(1000);
      }
      $g.processExecTag = false;
    },
    switchPage: async (params, condition) => {
      $switchPage(params);
      $g.processExecTag = false;
    },
    backPage: async function (params, condition) {
      $backPage(params);
      $g.processExecTag = false;
    },
    data: async function (params, condition) {
      var maxTicks = $g.$ticks(params.loopInterval ? params.loopInterval : 5);
      params._ticks = 0;
      params._count = 1;
      if (params.clicks) params.clicks = $g.$ARR(params.clicks);
      else params.clicks = [];
      if (params.pager) params.pager = $g.$ARR(params.pager);
      else params.pager = [];
      if (params.finishChecker) params.finishChecker = $g.$ARR(params.finishChecker);
      else params.finishChecker = [];
      $g.variables._data_pager_ = 1;
      params._clkIdx = 0;
      params._isFirstPage = true;
      if (params.maxPage) {
        params.maxPage = parseInt(params.maxPage);
        if (isNaN(params.maxPage)) params.maxPage = 1;
      }
      while (true) {
        $g.acts.update(params);
        if (!params.inited) {
          $g.scrollEmulate = true;
          if (!await $g.checkCondition(condition)) {
            $g.echoLog("action is ignored");
            break;
          }
          params.blocks = $g.$ARR(params.blocks);
          if (!params.name) {
            params.name = defaultDataName;
            defaultDataName++;
          } else params.name = $g.finalizeString(params.name);
          if (!$g.resultsEx.dataEx) $g.resultsEx.dataEx = {};
          if (!$g.resultsEx.dataEx[params.name]) {
            $g.resultsEx.dataEx[params.name] = {
              desc: {},
              data: []
            };
          }
          params.inited = true;
        }
        // check max count
        if (params.maxCount && $g.resultsEx.dataEx[params.name].data.length >= params.maxCount) {
          $g.setAllLoopVariables(params);
          break;
        }
        if (params._ticks === 0) {
          //先点击完成所有需要点击的元素
          if (await parseInnerClicks(params)) {
            if ($g.debugData) console.log('data -> click inner clicks');
            params._ticks = maxTicks;
            $g.today = new Date();
            // parseData(params);
            if ($g.debugData) console.log('data -> click inner clicks end');
            condition;
          }
          // $g.scrollToTop(true, true);
          if (params.scroll) parseAction({
            "name": "scroll",
            "selector": params.scroll
          });
          // parseDataScroll(params);
          //_clicked控制避免翻页按钮重复点击
          params._clicked = false;
          ++params._clkIdx;
          /**
           * _clkIdx控制如果pager数组中包含多个元素，需要将多个元素全部点击完成才开始采集
           */
          if (params._clkIdx >= params.pager.length) params._clkIdx = 0;
          if (params._clkIdx === 0 || params._isFirstPage) {
            params._clkIdx = 0;
            params._isFirstPage = false;
            $g.today = new Date();
            if ($g.debugData) console.log('data -> pager count: ' + params._count);
            await parseData(params);
            if ($g.debugData) console.log('data -> pager end');
            $g.variables._data_pager_ = params._count;
            if ((params.maxPage && params._count >= params.maxPage) || params.pager.length === 0 || await isDataFinished(params)) {

              $g.setAllLoopVariables(params);
              $g.debug('data finished');
              break;
            }
            ++params._count;
          }
          params._ticks = maxTicks;
        } else {
          if (!params._clicked) {
            params._clicked = true;
            await parseDataPager(params, params._clkIdx);
          }
          if (await parseDataPagerChecker(params, params._clkIdx)) {
            if ($g.debugData) console.log('data -> pager is ready');
            params._ticks = 0;
          } else {
            --params._ticks;
          }
        }
        await $g.sleep(1000);
      }
      $g.processExecTag = false;
    },
    uploadFile: async function (params, condition) {
      let filePath = $g.getPath($g.finalizeString(params.path));
      $g.log.append('uploadFile', 'filePath: ' + filePath)
      if (params.absolutePath) filePath = $g.finalizeString(params.path);
      let data = $g.fs.readImage(filePath);
      let suffix = params.path.split('.').pop();
      let type = 'image/jpeg';
      if (suffix == 'mp4') type = 'video/mp4';
      if (suffix == 'webm') type = 'video/webm';
      if (suffix == 'gif') type = 'image/gif';

      win.webContents.send('upload-file', {
        data: data,
        name: path.basename(filePath),
        selector: params.selector,
        type: type
      });
      await $g.sleep(10000);
      $g.processExecTag = false;
    },
    uploadFileDVP: async function (params, condition) {
      let filePath = $g.getPath($g.finalizeString(params.path));
      if (params.absolutePath) filePath = $g.finalizeString(params.path);
      const frameSelector = params.frame || ""
      await setFileInput(win.webContents, params.selector, [filePath], frameSelector);
      await $g.sleep(10000);
      $g.processExecTag = false;
    },
    paste: async function (params, condition) {
      value = params.value
      if (value) {
        clipboard.writeText(value)
        win.webContents.paste()
        await $g.sleep(1000)
      }
      $g.processExecTag = false
    },
    pasteImage: async function (params, condition) {
      let filePath = $g.getPath($g.finalizeString(params.path));
      if (params.absolutePath) filePath = $g.finalizeString(params.path);
      const image = nativeImage.createFromPath(filePath)
      clipboard.writeImage(image)
      win.webContents.paste()
      await $g.sleep(1000)
      $g.processExecTag = false
    },
    attr: async function (params, condition) {
      changeAttributes(params);
      $g.sleep(3000);
      $g.processExecTag = false;
    },
    mouseOver: async function (params, condition) {
      await parseAction({
        name: "move",
        selector: params.selector
      });
      $g.processExecTag = false;
    },
    reopen: async function (params, condition) {
      // var url = await $g.domOp.getCurrentUrl();
      // if (params.replace) {
      //     url = url.replace(params.replace.from, params.replace.to);
      // }
      // if (params.trim) {
      //     var aTrim = $g.$ARR(params.trim);
      //     for (var i = 0; i < aTrim.length; ++i) {
      //         url = $g.$trim(url, aTrim[i]);
      //     }
      // }
      // if (params.concat) {
      //     url += params.concat;
      // }
      // $g.debug(url);
      // $g.echoLog(url);
      // params.url = url;
      // this.open(params);
      $g.processExecTag = true;
      $g.loadPageTag = true;
      let code = "location.reload()";
      await $g.domOp.exec(code);
    },
    getMailVCode: async function (params, condition) {
      let startTime = new Date().getTime();
      let timeout = params.timeout ? parseInt(params.timeout) : 90000;
      while (true) {
        let currentTime = new Date().getTime();
        if (currentTime - startTime >= timeout) {
          if (!params.ignorable) {
            $g.acts.ignoreAll($g.errors_code.NO_VERIFY_CODE);
          }
          break;
        }
        if (!params.inited) {
          params.inited = true;
          params.target_file = $g.getEmailVCodePath();
          $g.fs.$remove(params.target_file);
          $g.copyWaitEmailVcodePath(params);
        }
        if (!$g.fs.exists(params.target_file)) {
          await $g.sleep(2000);
          continue;
        }
        var vcode = $g.fs.read(params.target_file);
        $g.echoLog(vcode);
        vcode = analyzeSMS(params, vcode);
        $g.echoLog(vcode);
        $g.fs.$remove(params.target_file);
        params.value = vcode;
        await inputAction(params);
        break;
      }
      $g.processExecTag = false;
    },
    writeMailVCode: function (params, condition) {
      $g.writeEmailVcode(params);
      $g.processExecTag = false;
    },
    rightClick: async function (params, condition) {
      let selector = params.selector;
      let result = await $g.domOp.getElementBounds(selector);
      let x = parseInt(result.x + result.width / 2);
      let y = parseInt(result.y + result.height / 2);
      await win.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: 'Alt'
      });
      await win.webContents.sendInputEvent({
        type: 'keyUp',
        keyCode: 'Alt'
      });
      await $g.sleep(1000);
      await win.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: 'Alt'
      });
      await win.webContents.sendInputEvent({
        type: 'keyUp',
        keyCode: 'Alt'
      });
      await $g.sleep(1000);
      await win.webContents.sendInputEvent({
        type: 'mouseMove',
        x: x,
        y: y
      });
      await $g.sleep(1000);
      await win.webContents.sendInputEvent({
        type: 'mouseDown',
        x: x,
        y: y,
        button: 'right',
        clickCount: 1
      });
      await $g.sleep(5000);
      await win.webContents.sendInputEvent({
        type: 'mouseUp',
        x: x,
        y: y,
        button: 'right',
        clickCount: 1
      });
      $g.processExecTag = false;
    },
    download: async function (params, condition) {
      await $g.downloadFile(params.url, params.name).then(() => {}, (err) => {
        $g.log.append('download', err);
        // 错误：舆材下载失败
        $g.acts.ignoreAll($g.errors_code.UPLOAD_FILE_ERROR);
        $g.processExecTag = false;
        return;
      });
      let tmpPath = path.join(downloadDir, params.name);
      let dist = $g.getPath(params.name);
      $g.fs.$rename(tmpPath, dist);
      $g.processExecTag = false;
    },
    changeMode: async function (params, condition) {
      $g.classicMode = false;
      $g.changeMode();
      $g.fs.write($g.dynamic, '');
      $g.processExecTag = false;
    },
    waitReply: async (params, condition) => {
      let startTime = new Date().getTime();
      let timeout = params.timeout ? parseInt(params.timeout) : 90000;
      let sourceInfo = $g.finalizeString(params.sourceInfo);
      while (true) {
        let currentTime = new Date().getTime();
        if (currentTime - startTime >= timeout) {
          if (!params.ignore) $g.acts.ignoreAll($g.errors_code.TIMEOUT);
          break;
        }
        if (!params.inited) {
          params.inited = true;
          params.replyFilePath = $g.getReplyPath();
          $g.fs.$remove(params.replyFilePath);
          var tmpPath = $g.getPath('tmp_wait_reply');
          $g.fs.write(tmpPath, sourceInfo);
          $g.fs.$rename(tmpPath, $g.getWaitReplyPath());
          continue;
        }
        var data = $g.$json(params.replyFilePath);
        $g.fs.$remove(params.replyFilePath);
        if (data) {
          $g.debug('Get reply data');
          for (var i = 0, cnt = data.length; i < cnt; ++i) {
            var text = data[i];
            if (text) {
              params.value = text;
              await inputAction(params);
              break;
            }
          }
          break;
        }
        await $g.sleep(2000);
      }
      $g.processExecTag = false;
    },
    setScrollPos: async function (params, condition) {
      $g.posTop = params.posTop;
      $g.posBottom = params.posBottom;
      $g.processExecTag = false;
    },
    moveResultEx: async function (params, condition) {
      $g.saveResultEx();
      $g.resultsEx = {};
      let resultDir = params.resultDir;
      let resultFile = path.join($g.getPath('result_ex.txt'));
      if ($g.fs.exists(resultFile)) {
        let oldResultFile = "result_ex_" + new Date().getTime() + ".txt";
        let oldResult = path.join(resultDir, oldResultFile);
        await $g.fs.$rename(resultFile, oldResult);
      }
      $g.processExecTag = false;
    },
    capFullDom: async (params, condition) => {
      let data = {
        func: "__capFullDom",
        args: []
      }
      win.webContents.send('execScript', data);
    },
    clearCookie: async (params) => {
      const siteURL = params.url
      const cookies = await $g.session.defaultSession.cookies.get({url:siteURL})
      for (const item of cookies) {
        $g.session.defaultSession.cookies.remove(siteURL, item.name)
      }
      await $g.session.defaultSession.cookies.flushStore()
      $g.processExecTag = false;
    },
    getCookie: async (params) => {
      const siteURL = params.url
      const cookies = await $g.session.defaultSession.cookies.get({url:siteURL})
      var cookiesPath = $g.getPath('getCookies');
      $g.fs.write(cookiesPath, JSON.stringify(cookies));
      $g.processExecTag = false;
    },
    getPhoneVCode: async (params) => {
      let startTime = new Date().getTime();
      //let timeout = params.timeout ? parseInt(params.timeout) : 90000;
      let timeout = 120000;
      while (true) {
        let currentTime = new Date().getTime();
        if (currentTime - startTime >= timeout) {
          $g.acts.ignoreAll($g.errors_code.NO_VERIFY_CODE);
          break;
        }
        const agent = new https.Agent({rejectUnauthorized: false})
        const { data: { success, data: msgList }} = await axios.get(params.get_code_url, {httpsAgent: agent})
        $g.log.append('getPhoneVCode', 'request result: ' +  JSON.stringify(msgList));
        let phoneCode = ''
        if(success){
          for(i in msgList) {
            let msg = msgList[i];
            if (!!msg.message.match(/\d{4,}/g) && Math.floor(Date.now() / 1000) - msg.date <= 300) {
              phoneCode = msg.message.match(/\d{4,}/g)[0];
              $g.log.append('getPhoneVCode', 'code: ' + phoneCode);
              break;
            }
          };
        }
        if (phoneCode) {
          params.value = phoneCode;
          await inputAction(params);
          break;
        } else {
          await $g.sleep(10000);
          continue;
        }
      }
      $g.processExecTag = false;
    },
    getFb009Code: async (params) => {
      const codeURL = `https://www.fb009.com/t.php?key=${encodeURIComponent(params.key)}`
      $g.log.append('getFb009Code', codeURL)
      try{
        const agent = new https.Agent({rejectUnauthorized: false})
        const response = await axios.get(codeURL, {httpsAgent: agent})
        $g.log.append('getFb009Code', 'request result: ' + JSON.stringify(response.data))
        const code = response.data.Code
        if (code) {
          params.value = code;
          await inputAction(params);
        }
      }catch(err){
        $g.log.append("getFb009Code", "Exception: " + err.toString());
      }
      $g.processExecTag = false;
    },
    screenshot: async (params) => {
      //$g.capture("last_step")
      const screenshot = require('screenshot-desktop')
      let imageFile = $g.getPath(params.image_name);
      try{
        $g.log.append('screenshot', 'start screen ...')
        for (let i=0; i<5; i++) {
          let startTime = new Date().getTime();
          await win.setAlwaysOnTop(true);
          await $g.sleep(500);
          await screenshot({ filename: imageFile });
          let finishTime = new Date().getTime();
          if (finishTime - startTime < 5000) {
            break;
          }
          $g.log.append('screenshot', `retry count ${i}`);
        } 
        $g.log.append('screenshot', 'finish screen ...')
      }catch(err){
        $g.log.append("screenshot", "Exception: " + err.toString());
      }
      $g.processExecTag = false;
    },
    setAlwaysOnTopTrue: async (params) => {
      await win.setAlwaysOnTop(true);
      $g.processExecTag = false;
    },
    setAlwaysOnTopFalse: async (params) => {
      await win.setAlwaysOnTop(false);
      $g.processExecTag = false;
    },
    startNetwork: (params) => {
      $g.networkStartTime = new Date().getTime()
      $g.processExecTag = false;
    },
    finishNetwork: async (params) => {
      const crawlerResultData = await DataParse($g) || {}
      const name = params.variable_name
      $g.variables[name] = ''
      if (name == 'profile_loc' && crawlerResultData.profiles_list &&  crawlerResultData.profiles_list[0]) {
        const profile = crawlerResultData.profiles_list[0]
        let profileLocation = ''
        if (profile.city) {
          profileLocation += profile.city
        }
        if (profile.home_town) {
          profileLocation += profile.home_town
        }
        $g.log.append('finishNetwork', `profile location: ${profileLocation}  name: ${profile.name}`)
        if (profileLocation) {
          for (const key in locMatchsConfig) {
            for (const loc of locMatchsConfig[key]) {
              if (profileLocation.indexOf(loc) != -1) {
                $g.log.append('finishNetwork', 'profile_loc: ' + key)
                $g.variables[name] = key
                break
              }
            }
          }
        }
      } else if (name == 'tw_create_tweet' && crawlerResultData.tw_create_tweet && crawlerResultData.tw_create_tweet[0]) {
        const tweet = crawlerResultData.tw_create_tweet[0]
        $g.log.append('finishNetwork', `tweet: ${JSON.stringify(tweet)}`)
        if (tweet.user?.screen_name && tweet.id_str) {
          const tweet_url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
          $g.variables[name] = tweet_url
          $g.log.append('finishNetwork', `tw_create_tweet: ${tweet_url}`)
        }
      } else if (name == 'fb_create_story' && crawlerResultData.fb_create_story?.url) {
        const post_url = crawlerResultData.fb_create_story.url
        $g.variables[name] = post_url
        $g.log.append('finishNetwork', `fb_create_story: ${post_url}`)
      } else if (name == 'page_insights_post' && crawlerResultData.page_insights_post) {
        const FormData =require('form-data')
        var fs = require('fs')
        const agent = new https.Agent({rejectUnauthorized: false})
        //const crawlURL = 'https://156.255.105.5:1443/crawler_center_service/cp_crawl_fb_account_target'
        //const crawlURL = 'https://47.74.153.74/crawler_center_service/cp_crawl_fb_account_target'
        const crawlURL = 'https://183.240.204.129:12443/crawler_center_service/cp_crawl_fb_account_target'
        for (const post of crawlerResultData.page_insights_post) {
          $g.log.append('post insights', JSON.stringify(post))
          let params = {
            type: 'check_post_insights',
            post_fid: post.post_fid,
            post_reach: post.post_reach,
            post_engagement: post.post_engagement
          }
          const response = await axios.post(crawlURL, `params=${JSON.stringify(params)}`, {httpsAgent: agent})
          $g.log.append('post insights', JSON.stringify(response.data))
          if(response.data.screenshot_flag){
            let code = `window.location.href="https://www.facebook.com/${post.post_fid}"`
            $g.domOp.exec(code)
            await $g.sleep(15000)
            code = `try{ const btn=document.evaluate("//span[contains(text(), 'See insights')]",document).iterateNext();if(btn){btn.click()} }catch{}`
            $g.domOp.exec(code)
            await $g.sleep(10000)
            await $g.capture(`post_image_${post.post_fid}`)
            const image_path = $g.getPath(`post_image_${post.post_fid}.jpg`)
            for (let i=0; i<10; i++) {
              if ($g.fs.exists(image_path)) {
                break
              }
              await $g.sleep(2000)
            }
            await $g.sleep(5000)
            if (!$g.fs.exists(image_path)) {
              break
            }
            const image_file = fs.createReadStream(image_path)
            const form = new FormData()
            const params = {
              type: 'post_insights_screenshot',
              post: post
            }
            form.append('params', JSON.stringify(params))
            form.append('image', image_file)
            let headers = form.getHeaders()
            headers['Content-Type'] = 'multipart/form-data'
            const config = {
              httpsAgent: agent,
              headers: headers
            }
            $g.log.append('screenshot image', image_path)
            const response = await axios.post(crawlURL, form, config)
            $g.log.append('save post screenshot', JSON.stringify(response.data))
          }
        }
      }
      $g.processExecTag = false;
    },
    fetchMaterial: (params) => {
      const url = $g.finalizeString(params.url)
      const filePath = $g.getPath($g.finalizeString(params.name))
      $g.log.append('file', filePath)
      const agent = new https.Agent({rejectUnauthorized: false})
      axios.get(url, {httpsAgent: agent, responseType: "stream",}).then(res => {
        const file = $g.fs.createWriteStream(filePath)
        res.data.pipe(file);
        file.on('finish', () => {
            file.close()
            $g.processExecTag = false;
        });
      }).catch(error => {
        $g.log.append('error', error)
        $g.processExecTag = false;
      })
    },
    mockCrawler: async (params) => {
      const parseProcess = require('./network_data_parse/data_parse')
      parseProcess.dataParseInitData($g, {})
      const cookies = await $g.session.defaultSession.cookies.get({url:'https://www.facebook.com'})
      let cookiesArr = []
      for(let item of cookies){
        cookiesArr.push(`${item.name}=${item.value}`)
      }
      const cookieStr = cookiesArr.join('; ')
      console.log(cookieStr)

      const graphURL = 'https://www.facebook.com/api/graphql/'
      const maxPageNum = params.maxPageNum || 100
      const url = params.url
      let code = "window.location.href = '" + url + "'"
      $g.domOp.exec(code)
      await $g.sleep(10000)
      const htmlStr = await $g.domOp.getHTML()
      let token = ''
      const patternToken = /"DTSGInitialData":{"token":"(.*?)"}/
      const matchObjToken = htmlStr.match(patternToken)
      if (matchObjToken && matchObjToken[1]) {
        token = matchObjToken[1]
      }
      const pattern = /"adp_GroupsCometMembersRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"group".*?}),"extensions"/
      const matchObj = htmlStr.match(pattern)
      if (matchObj && matchObj[1]) {
        const data = $g.$json_from_string(matchObj[1])
        let pageInfo = data.group.new_members.page_info
        $g.log.append('debug', JSON.stringify(pageInfo))
        let cursor = 1
        while(pageInfo.has_next_page){
          const variables = {
            count: 10,
            cursor: pageInfo.end_cursor,
            groupID: "1283769795014531",
            recruitingGroupFilterNonCompliant: false,
            scale: 1.5,
            id: "1283769795014531"
          }
          const postData = {
            __a: 1,
            fb_dtsg: token,
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'GroupsCometMembersPageNewMembersSectionRefetchQuery',
            variables: JSON.stringify(variables),
            doc_id: 6578527022170603
          }
          const response = await axios({
            url: graphURL,
            method: 'post',
            data: postData,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
              'Content-Type': 'application/x-www-form-urlencoded',
              'Sec-Fetch-Site': 'same-origin',
              Cookie: cookieStr
            }
          })
          $g.log.append('mockCrawler', `page cursor: ${cursor}`)
          const content = JSON.stringify(response.data)
          parseProcess.FbMembersList(content)
          const contentInfo = $g.$json_from_string(content)
          if(contentInfo.data?.node?.new_members?.page_info){
            pageInfo = contentInfo.data.node.new_members.page_info
          }else{
            pageInfo = false
            break
          }
          cursor++
          if (cursor > maxPageNum) {
            break
          }
        }
      }
      
      $g.processExecTag = false;
    },
    twVerifyCode: async (params) => {
      const { clientKey } = params;
      const fs = require("fs");
      const agent = new https.Agent({rejectUnauthorized: false});
      const info = await $g.domOp.getElementInfo("h2 > span");
      let question = info.text;
      //question = "use the arrows to move the icon into the indicated orbit"
      $g.log.append('twVerifyCode', `question: ${question}`);
      while(true) {
        const base64 = await $g.domOp.getElementBgImageBase64("img.key-frame-image");
        if (!base64) {
          $g.log.append('twVerifyCode', `img base64: ${base64}`);
          $g.processExecTag = false;
          break;
        }
        //$g.log.append('twVerifyCode', `img base64: ${base64}`);
        let timeStamp = new Date().getTime();
        const imgPath = $g.getPath(`verify_code_${timeStamp}.png`);
        const imageBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
        const dataBuffer = new Buffer.from(imageBase64, 'base64');
        //$g.fs.write(imgPath, dataBuffer);
        fs.writeFileSync(imgPath, dataBuffer, { encoding: 'base64' });
        const clickNum = await twVerifyCreateTask(base64, question, clientKey); //验证结果第几个图片匹配,从0开始,当前显示第一张图片
        $g.log.append('twVerifyCode', `need click: ${clickNum}`)
        for (let i=0; i<clickNum; i++) {
          $g.log.append('twVerifyCode', `click: ${i}`)
          await parseAction({
            name: "click",
            selector: "a.right-arrow"
          });
          await $g.sleep(2000);
        }
        await parseAction({
          name: "click",
          selector: "button.button"
        });
        await $g.sleep(5000);
      }
      $g.processExecTag = false;
    },
    gpt: async (params, condition) => {
      const tokens = ["Bearer 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", "Bearer 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", "Bearer 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"]
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
        // "Authorization": "Bearer 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"
      }
      params.args.messages[0].content = $g.finalizeString(params.args.messages[0].content);
      params.args.messages[1].content = $g.finalizeString(params.args.messages[1].content);
      const data = params.args
      $g.log.append('chatgpt request', JSON.stringify(data))
      for (let i = 0; i < 3; i++) {
        headers["Authorization"] = tokens[i]
        // $g.log.append('Authorization', tokens[i])
        try {
          const response = await axios.post("https://api.openai.com/v1/chat/completions", data, { headers });
          $g.log.append('chatgpt response', JSON.stringify(response.data));
          const respString = response?.data?.choices[0]?.message?.content;
          const match = respString.match(/({"like_result": \d.*?})/);
          if (match && match[1]) {
            const step5Resp = JSON.parse(match[1]);
            const {like_result, comment_result} = step5Resp;
            $g.variables['like_result'] = like_result;
            $g.variables['comment_result'] = comment_result;
          }
        } catch(error) {
          $g.log.append('chatgpt error response code', error.response.status);
        }
        if ($g.variables['comment_result']) {
          break;
        }
      }
      if (!$g.variables['comment_result']) {
        $g.variables['like_result'] = "1";
        $g.variables['comment_result'] = "Be cautious of fraud, don't trust easily, stay vigilant, and stay worry-free with safety.";
      }
      $g.log.append('variables', JSON.stringify($g.variables));
      $g.processExecTag = false;
    },
    postXtweet: async (params) => {
      const checkerBold = [{
        "type": "checkExist",
        "selector": "button[aria-label*='CTRL+B'][aria-label*='活跃']"
      }]
      if (params.title) {
        for (let i=0; i<10; i++){
          await win.webContents.sendInputEvent({
            type: 'keyDown',
            keyCode: 'B',
            modifiers: ['control']
          });
          await win.webContents.sendInputEvent({
            type: 'keyUp',
            keyCode: 'B',
            modifiers: ['control']
          });
          var ret = await $g.parseCheckers(checkerBold);
          if (ret) {
            break;
          }
        }
        await win.webContents.insertText(params.title);
        await win.webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: 'B',
          modifiers: ['control']
        });
        await win.webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: 'B',
          modifiers: ['control']
        });
        await win.webContents.insertText("\n");
        await clipboard.writeText("\n");
        await win.webContents.paste();
      }
      await $g.sleep(5000);
      // 推文按条处理 内容
      const items = $g.$json_from_string(params.value)
      for (const item of items) {
        console.log('item:', item);
        for (let i=0; i<10; i++){
          await win.webContents.sendInputEvent({
            type: 'keyDown',
            keyCode: 'B',
            modifiers: ['control']
          });
          await win.webContents.sendInputEvent({
            type: 'keyUp',
            keyCode: 'B',
            modifiers: ['control']
          });
          var ret = await $g.parseCheckers(checkerBold);
          if (ret) {
            break;
          }
        }
        await win.webContents.insertText(item.title);
        // await clipboard.writeText(item.title);
        // await win.webContents.paste();
        await win.webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: 'B',
          modifiers: ['control']
        });
        await win.webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: 'B',
          modifiers: ['control']
        });
        await $g.sleep(3000);
        await clipboard.writeText("");
        await win.webContents.paste();
        await $g.sleep(1000);
        await win.webContents.insertText(item.content)
        //await clipboard.writeText(item.content);
        //await win.webContents.paste();
        await clipboard.writeText("\n");
        await win.webContents.paste();
        await $g.sleep(5000);
      }
      $g.processExecTag = false;
    }
  }
}

async function twVerifyCreateTask(image, question, clientKey) {
  const fetch = require('node-fetch')
  // 验证码类型：
  const taskType = "FunCaptchaClassification";
  try {
    const url = "https://api.yescaptcha.com/createTask";
    const data = {
      clientKey: clientKey,
      task: {
        type: taskType,
        image: image,
        question: question
      }
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      agent: false,
      rejectUnauthorized: false
    });
    const result = await response.json();
    $g.log.append('twVerifyCreateTask', JSON.stringify(result));
    return result?.solution?.objects[0];
  } catch (error) {
    $g.log.append('twVerifyCreateTask', error);
  }
  return -1;
}

async function setFileInput(wc, selector, files, frameSelector) {
  try {
    let nodeId = "";
    try{
      wc.debugger.attach("1.1");
    }catch(e){}
    const doc = await wc.debugger.sendCommand("DOM.getDocument", {});
    const root = doc.root
    if (frameSelector) {
      const frameNode = await wc.debugger.sendCommand("DOM.querySelector", { nodeId: root.nodeId, selector: frameSelector });
      const frameId = frameNode.nodeId
      const iframeDescription = await wc.debugger.sendCommand("DOM.describeNode", {nodeId: frameId})
      const contentDocRemoteObject = await wc.debugger.sendCommand("DOM.resolveNode", {backendNodeId: iframeDescription.node.contentDocument.backendNodeId})
      const contentDocNode = await wc.debugger.sendCommand("DOM.requestNode", {objectId: contentDocRemoteObject.object.objectId})
      const elementQueryResult = await wc.debugger.sendCommand("DOM.querySelector", { nodeId: contentDocNode.nodeId, selector });
      nodeId = elementQueryResult.nodeId  
    } else {
      const elementQueryResult = await wc.debugger.sendCommand("DOM.querySelector", { nodeId: root.nodeId, selector });
      nodeId = elementQueryResult.nodeId
    }
    await wc.debugger.sendCommand("DOM.setFileInputFiles", { nodeId, files });
  }
  finally {
    //wc.debugger.detach();
  }
}

Actions.create = function (_win, _$g) {
  win = _win;
  $g = _$g;
  initActions();
  defaultDataName = 0;
  if ($g.consoleMessageSwitch) {
    win.webContents.on('console-message', (event, channel, ...args) => {
      let msg = $g.fs.read($g.getPath('console.message'));
      const date = new Date();
      const currentTime = `${date.getFullYear()}-${$g.utils.dateRepaire(date.getMonth()+1)}-${$g.utils.dateRepaire(date.getDate())} ${$g.utils.dateRepaire(date.getHours())}:${$g.utils.dateRepaire(date.getMinutes())}:${$g.utils.dateRepaire(date.getSeconds())}`
      const log = currentTime + '  ' + JSON.stringify(args) + "\r\n"
      msg += log
      $g.fs.write($g.getPath('console.message'), msg);
    })
  }
  win.webContents.on('ipc-message', (evnet, channel, ...args) => {
    if (channel == 'didFinishLoad' && $g.loadPageTag) {
      console.log('didFinishLoad');
      $g.processExecTag = false;
      $g.loadPageTag = false;
    }
    if (channel == 'completeScroll') {
      console.log('completeScroll');
      $g.processExecTag = false;
    }
    if (channel == 'message') {
      $g.fs.write($g.getPath('message'), args[0]);
    }
    if (channel == 'startTask') {
      $g.taskPause = false;
    }
    if (channel == 'pauseTask') {
      $g.taskPause = true;
    }
    if (channel == 'capFullDom') {
      let data = args[0];
      const path = $g.getPath('fullScreen.png');
      const base64 = data.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = new Buffer.from(base64, 'base64');
      $g.fs.write(path, dataBuffer);
      $g.processExecTag = false;
    }
    if (channel == 'executeScriptResult') {
      $g.scriptExecResult = args[0];
    }
  })
}

module.exports = Actions;