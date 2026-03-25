let listObj = {
  "name": "list",
  "inIframe": false,
  "key": "list1",
  "pager": [{
    "selector": "a#pnnext > span",
    "eleIndex": 1
  }],
  "maxPage": 10,
  "maxCount": false,
  "fields": {
    "desc": [{
      "target": "div#rso > div > div > div[class*='tF'] > div[class*='IsZvec'] > div[class*='VwiC'][class*='yXK'][class*='MUxGbd'][class*='yDYNvb'][class*='lyLwlc'][class*='lEBKkf'] > span",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0,
      "blocks": "div#rso > div"
    }, {
      "target": "div#rso > div[class*='hlcw'] > div > div > div[class*='tF'] > div[class*='IsZvec'] > div[class*='VwiC'][class*='yXK'][class*='MUxGbd'][class*='yDYNvb'][class*='lyLwlc'][class*='lEBKkf'] > span",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div > div > div > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='IsZvec'] > div[class*='VwiC'][class*='yXK'][class*='MUxGbd'][class*='yDYNvb'][class*='lyLwlc'][class*='lEBKkf'] > span",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div > div > div > ul[class*='FxLDp'] > li[class*='MYVUIe'] > div[class*='XN'] > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='IsZvec'] > div[class*='VwiC'][class*='yXK'][class*='MUxGbd'][class*='yDYNvb'][class*='lyLwlc'][class*='lEBKkf']",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }],
    "url": [{
      "target": "div#rso > div > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "href",
      "eleIndex": 0,
      "eleIndexInBlock": 0,
      "blocks": "div#rso > div"
    }, {
      "target": "div#rso > div > div > div > ul[class*='FxLDp'] > li[class*='MYVUIe'] > div[class*='XN'] > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "href",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div > div > div > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "href",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div[class*='hlcw'] > div > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "href",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }],
    "title": [{
      "target": "div#rso > div > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0,
      "blocks": "div#rso > div"
    }, {
      "target": "div#rso > div > div > div > ul[class*='FxLDp'] > li[class*='MYVUIe'] > div[class*='XN'] > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div > div > div > div[class*='jNVrwc'] > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }, {
      "target": "div#rso > div[class*='hlcw'] > div > div > div[class*='tF'] > div[class*='yuRUbf'] > a",
      "from": "text",
      "eleIndex": 0,
      "eleIndexInBlock": 0
    }]
  }
}

function getSimilarity(str1, str2) {
  let sameNum = 0
  let length = str1.length > str2.length ? str2.length : str1.length
  for (let i = 0; i < length; i++) {
    if (str1[i] === str2[i]) {
      sameNum++
      continue
    }
    break
  }
  length = str1.length > str2.length ? str1.length : str2.length
  return (sameNum / length) * 100 || 0
}

let i = 0;
let newArr = [];
for (const key in listObj.fields) {
  newArr[i] = [];
  listObj.fields[key].forEach(obj => {
    if (obj.blocks) return;
    newArr[i].push(obj.target)
  });
  i++
}
// console.log(newArr);
let t = "./articles/CBMipgJodHRwczovL3d3dy5yZmkuZnIvY24vJUU0JUI4JTkzJUU2JUEwJThGJUU2JUEzJTgwJUU3JUI0JUEyLyVFNiVCMyU5NSVFNSU5QiVCRCVFNCVCOCU5NiVFNyU5NSU4QyVFNiU4QSVBNS8yMDIxMTAxMS0lRTQlQjglQUQlRTUlOUIlQkQlRTUlOTIlOEMlRTUlOEYlQjAlRTYlQjklQkUlRTQlQjklOEIlRTklOTclQjQlRTclOUElODQlRTglQjclOUQlRTclQTYlQkIlRTYlQUYlOTQlRTQlQkIlQTUlRTUlQkUlODAlRTQlQkIlQkIlRTQlQkQlOTUlRTYlOTclQjYlRTUlODAlOTklRTklODMlQkQlRTglQTYlODElRTglQkYlOUPSAaYCaHR0cHM6Ly9hbXAucmZpLmZyL2NuLyVFNCVCOCU5MyVFNiVBMCU4RiVFNiVBMyU4MCVFNyVCNCVBMi8lRTYlQjMlOTUlRTUlOUIlQkQlRTQlQjglOTYlRTclOTUlOEMlRTYlOEElQTUvMjAyMTEwMTEtJUU0JUI4JUFEJUU1JTlCJUJEJUU1JTkyJThDJUU1JThGJUIwJUU2JUI5JUJFJUU0JUI5JThCJUU5JTk3JUI0JUU3JTlBJTg0JUU4JUI3JTlEJUU3JUE2JUJCJUU2JUFGJTk0JUU0JUJCJUE1JUU1JUJFJTgwJUU0JUJCJUJCJUU0JUJEJTk1JUU2JTk3JUI2JUU1JTgwJTk5JUU5JTgzJUJEJUU4JUE2JTgxJUU4JUJGJTlD?hl=zh-CN&gl=CN&ceid=CN%3Azh-Hans".replace(/^\.\//, '/');
console.log(t);
