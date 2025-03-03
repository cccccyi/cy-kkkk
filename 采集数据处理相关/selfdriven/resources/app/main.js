"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const electron_1 = require("electron");
const fs = require("fs");
const path = require("path");
const url = require("url");
const Module = require('module');
console.log(process.version);
// Parse command line options.
async function loadApplicationByURL(appUrl) {
  const {
    loadURL
  } = await Promise.resolve().then(() => require('./default_app'));
  loadURL(appUrl);
}
var defaultUrl = 'about:blank';
// var defaultUrl = 'https://www.facebook.com/';
// var defaultUrl = 'http://bbs.hsw.cn/post.php?fid=320';
// var defaultUrl = 'https://www.cmmedia.com.tw/home/list/politics';
setTimeout(function () {
  loadApplicationByURL(defaultUrl);
}, 1000)