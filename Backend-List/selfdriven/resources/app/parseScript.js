const fs = require('fs');
class ParseTool {
  clickAction(config) {
    let distConfig = {
      "name": "click",
      "params": {
        selector: ""
      }
    }
    distConfig.params.selector = config.selector;
    distConfig.params.index = config.eleIndex;
    return distConfig;
  }
  removAction(config) {
    return {
      "name": "call",
      "params":{ 
        "code": `
        try{ 
          eles = window.clientUtilsObj.findAll("${config.selector}"); 
          for(i = 0; i < eles.length; i++){
            if( [${config.eleIndex}].includes(i) ) eles[i].remove(); 
          } 
        } 
        catch{ }
        `.replace(/\s*/g,"")
      }
    };
  }
  inputAction(config) {
    let distConfig = {
      "name": "input",
      "params": {
        selector: "",
        value: ""
      }
    }
    distConfig.params.selector = config.selector;
    distConfig.params.value = config.value;
    distConfig.params.index = config.eleIndex;
    return distConfig;
  }
  scrollAction(config) {
    let loopCount = 10;
    let distConfig = {
      "name": "loop",
      "loop_count": loopCount,
      "actions": []
    }
    switch (config.scrollType) {
      case 'scrollMouse':
        distConfig.actions.push({
          "name": "scroll",
          "params": {
            "nums": parseInt(config.scrollCount / loopCount)
          }
        });
        break;
      case 'scrollBottom':
        distConfig.actions.push({
          "name": "scroll",
          "params": {
            "selector": "end"
          }
        });
        distConfig.loop_count = config.scrollCount ? config.scrollCount : 1
        break;
      case 'scrollScreen':
        distConfig.actions.push({
          "name": "scroll",
          "params": {
            "nextScreen": true
          }
        });
        distConfig.loop_count = config.scrollCount ? config.scrollCount : 1
        break;
    }
    distConfig.actions.push({
      "name": "wait",
      "params": {
        "interval": config.interval * 1000
      }
    });
    return distConfig;
  }
  openAction(config) {
    let distConfig = {
      "name": "open",
      "params": {
        "url": ""
      }
    }
    distConfig.params.url = config.url;
    return distConfig;
  }
  mouseOverAction(config) {
    let distConfig = {
      "name": "mouseOver",
      "params": {
        selector: ""
      }
    }
    distConfig.params.selector = config.selector;
    return distConfig;
  }
  singlePageAction(config) {
    let distConfig = {
      "name": "data",
      "params": {
        "desc": {}
      }
    }
    let obj = config.fields;
    for (const key in obj) {
      let field = {
        'target': [],
        'from': [],
        'eleIndex': []
      }
      obj[key].forEach(ele => {
        field.target.push(ele.target);
        field.from.push(ele.from);
        field.eleIndex.push(ele.eleIndex);
      });
      distConfig.params.desc[key] = field;
    }
    return distConfig;
  }
  listAction(config) {
    let distConfig = {
      "name": "data",
      "params": {
        "blocks": new Set(),
        "name": config.key,
        "fields": {

        }
      }
    }
    let obj = config.fields;
    let isOnlyField = false;
    let len = Object.keys(obj).length;
    if (len == 1) isOnlyField = true;
    if (len == 2) {
      let values = Object.values(obj);
      let target1 = values[0][0].target;
      let target2 = values[1][0].target;
      if (target1 === target2) isOnlyField = true;
    }
    for (const key in obj) {
      let field = {
        'target': [],
        'from': [],
        'eleIndex': []
      }
      if (isOnlyField) {
        obj[key].forEach(ele => {
          if (!ele.blocks) {
            let pos = ele.target.lastIndexOf('>');
            ele.blocks = ele.target.substr(0, pos);
            // ele.blocks = ele.target
          }
          distConfig.params.blocks.add(ele.blocks.trim());
          let pos = ele.blocks.length;
          field.target.push(ele.target.slice(pos));
          field.from.push(ele.from);
          field.eleIndex.push(ele.eleIndexInBlock);
        });
      } else {
        obj[key].forEach(ele => {
          if (!ele.blocks) return;
          distConfig.params.blocks.add(ele.blocks.trim());
          let pos = ele.blocks.length;
          field.target.push(ele.target.slice(pos));
          field.from.push(ele.from);
          field.eleIndex.push(ele.eleIndexInBlock);
        });
        obj[key].forEach(ele => {
          if (ele.blocks) return;
          for (const value of distConfig.params.blocks) {
            if (ele.target.startsWith(value)) {
              ele.blocks = value;
              distConfig.params.blocks.add(ele.blocks.trim());
              let pos = ele.blocks.length;
              field.target.push(ele.target.slice(pos).replace(/^\[.*?\]+/, ''));
              field.from.push(ele.from);
              field.eleIndex.push(ele.eleIndexInBlock);
              break;
            }
          }
        });
      }
      distConfig.params.fields[key] = field;
    }
    distConfig.params.blocks = Array.from(distConfig.params.blocks);
    if (config.pager) {
      distConfig.params.pager = [];
      config.pager.forEach(selector => {
        if (selector.eleIndex) selector.index = selector.eleIndex;
        distConfig.params.pager.push(selector);
      });
      if (config.finishChecker) {
        config.finishChecker[0]['checkOne'] = true;
        distConfig.params.finishChecker = config.finishChecker;
      }
    }
    if (config.maxPage) {
      distConfig.params.maxPage = config.maxPage;
    }
    return distConfig;
  }
}

exports.parseScriptConfig = (taskConfig) => {
  let newTaskConfig = {
    "homeUrl": "about:blank",
    "actions": []
  };
  let parseToolObj = new ParseTool();
  let inIframe = false;
  taskConfig.forEach(config => {
    if (inIframe && config.inIframe && inIframe.selector != config.inIframe.selector) {
      let configIframe = {
        "name": "backPage",
        "params": {}
      };
      newTaskConfig.actions.push(configIframe);
      inIframe = false;
    }
    if (!inIframe && config.inIframe) {
      config.inIframe['frameSelector'] = config.inIframe.selector;
      let configIframe = {
        "name": "switchPage",
        "params": config.inIframe
      };
      newTaskConfig.actions.push(configIframe);
      inIframe = config.inIframe;
    }
    switch (config.name) {
      case 'globalConfig':
        newTaskConfig.loadImages = config.loadImage;
        break;
      case 'click':
        newTaskConfig.actions.push(parseToolObj.clickAction(config));
        break;
      case 'remove':
        newTaskConfig.actions.push(parseToolObj.removAction(config));
        break;
      case 'scroll':
        newTaskConfig.actions.push(parseToolObj.scrollAction(config));
        break;
      case 'input':
        newTaskConfig.actions.push(parseToolObj.inputAction(config));
        let inputEnter = {
          "name": "input",
          "params": {
            "selector": config.selector,
            "value": "<enter>"
          }
        }
        newTaskConfig.actions.push(inputEnter);
        break;
      case 'open':
        let waitInterval = {
          "name": "wait",
          "params": {
            "interval": 5000
          }
        }
        newTaskConfig.actions.push(waitInterval);
        newTaskConfig.homeUrl = config.url;
        break;
      case 'mouseOver':
        newTaskConfig.actions.push(parseToolObj.mouseOverAction(config));
        break;
      case 'singlePage':
        newTaskConfig.actions.push(parseToolObj.singlePageAction(config));
        break;
      case 'list':
        let params = config;
        /**
         * 采集之前添加等待
         */
        let listParseRes = parseToolObj.listAction(config);
        let waitOp = {
          "name": "wait",
          "params": {
            "checkers": {
              "group": "or",
              "checkers": []
            },
            "ignorable": false,
            "timeout": 30000
          }
        }
        listParseRes.params.blocks.forEach(block => {
          let checkerObj = {
            "type": "checkVisible",
            "selector": block
          }
          waitOp.params.checkers.checkers.push(checkerObj);
        });
        newTaskConfig.actions.push(waitOp);
        /**
         * 处理滚动加载或者点击加载更多逻辑
         */
        let loopCount = 10;
        let loadMoreOp = {
          "name": "loop",
          "loop_count": loopCount,
          "actions": []
        }
        if (params.scrollType) {
          /**
           * 滚动加载逻辑
           */
          loadMoreOp = parseToolObj.scrollAction(params);
          // switch (params.scrollType) {
          //   case 'scrollMouse':
          //     loadMoreOp.actions.push({
          //       "name": "scroll",
          //       "params": {
          //         "nums": parseInt(params.scrollCount / loopCount)
          //       }
          //     });
          //     break;
          //   case 'scrollBottom':
          //     loadMoreOp.actions.push({
          //       "name": "scroll",
          //       "params": {
          //         "selector": "end"
          //       }
          //     });
          //     loadMoreOp.loop_count = config.scrollCount ? config.scrollCount : 1
          //     break;
          //   case 'scrollScreen':
          //     loadMoreOp.actions.push({
          //       "name": "scroll",
          //       "params": {
          //         "nextScreen": true
          //       }
          //     });
          //     loadMoreOp.loop_count = config.scrollCount ? config.scrollCount : 1
          //     break;
          // }
          // loadMoreOp.actions.push({
          //   "name": "wait",
          //   "params": {
          //     "interval": params.interval * 1000
          //   }
          // });
          newTaskConfig.actions.push(loadMoreOp);
        } else if (params.moreSelector) {
          /**
           * 点击加载更多逻辑
           */
          params.moreSelector.forEach(item => {
            loadMoreOp.actions.push({
              "name": "scroll",
              "params": {
                "selector": item.selector
              }
            });
            loadMoreOp.actions.push({
              "name": "click",
              "params": {
                "selector": item.selector,
                "index": item.eleIndex ? item.eleIndex : 0
              }
            });
          });
          loadMoreOp.loop_count = params.moreCounter ? params.moreCounter : 1;
          newTaskConfig.actions.push(loadMoreOp);
        }
        newTaskConfig.actions.push(listParseRes);
        break;
      default:
        break;
    }
  });
  return newTaskConfig;
}
// let scriptJsonFile = "E:/001/code/m_dev/branches/5.0/selfdriven/new_task/format.json";
// let script = fs.readFileSync(scriptJsonFile, 'utf-8');
// let taskConfig = JSON.parse(script);
// taskConfig = parseScriptConfig(taskConfig);
// console.log(JSON.stringify(taskConfig));
