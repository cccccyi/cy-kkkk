// ==UserScript==
// @name         X Following 自动采集并入库（结构自适应）
// @namespace    https://tampermonkey.net/
// @version      0.7
// @description  监听 X Following GraphQL 接口，解析用户并 POST 到本地服务（支持滚动结构变化）
// @match        https://x.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
  'use strict';

  console.log('✅ X Following 采集脚本启动（结构自适应）');

  /* ================= 配置 ================= */
  const TARGET_API =
    '/i/api/graphql/BEkNpEt5pNETESoqMsTEGA/Following';
  const SAVE_API = 'http://localhost:3000/api/save';

  /* ================= 状态 ================= */
  let isProcessing = false;
  let needScroll = false;
  let hitCount = 0;

  /* ================= 保存用户（绕过 CSP） ================= */
  function saveUser(user) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: SAVE_API,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(user),
        onload: res => {
          if (res.status >= 200 && res.status < 300) {
            console.log('💾 已保存:', user.screen_name);
            resolve();
          } else {
            console.error(
              '❌ 保存失败:',
              res.status,
              res.responseText
            );
            reject(res);
          }
        },
        onerror: err => {
          console.error('❌ 请求错误:', err);
          reject(err);
        },
      });
    });
  }

  /* ================= 解析 Following 数据（核心修复点） ================= */
  async function handleFollowingResponse(json) {
    const instructions =
      json?.data?.user?.result?.timeline?.timeline
        ?.instructions;

    if (!Array.isArray(instructions)) {
      console.warn('⚠️ 未找到 instructions');
      return;
    }

    for (const instruction of instructions) {
      // 只处理真正“新增用户数据”的 instruction
      if (
        instruction?.type !== 'TimelineAddEntries' ||
        !Array.isArray(instruction.entries)
      ) {
        continue;
      }

      for (const entry of instruction.entries) {
        try {
          const result =
            entry?.content?.itemContent?.user_results
              ?.result;

          // 跳过 cursor / 非用户行
          if (!result?.core) continue;

          const user = {
            name: result.core.name,
            screen_name: result.core.screen_name,
            image_url:
              result.avatar?.image_url || '',
            followed_by:
              result.relationship_perspectives
                ?.followed_by ?? false,
          };

          // 顺序保存（非常重要）
          await saveUser(user);
        } catch (e) {
          console.error('❌ 解析 entry 失败', e, entry);
        }
      }
    }
  }

  /* ================= 慢速滚动 ================= */
  function slowScroll() {
    if (!needScroll) return;

    const step = 300;   // 每次滚动像素
    const delay = 900;  // 滚动间隔（类人）

    const timer = setInterval(() => {
      if (!needScroll) {
        clearInterval(timer);
        return;
      }
      window.scrollBy(0, step);
      console.log('⬇️ 自动滚动中...');
    }, delay);
  }

  /* ================= 接口命中处理 ================= */
  async function onApiHit(response) {
    if (isProcessing) return;

    isProcessing = true;
    needScroll = false;
    hitCount++;

    console.log(`🔥 第 ${hitCount} 次命中 Following 接口`);

    try {
      const clone = response.clone();
      const json = await clone.json();
      await handleFollowingResponse(json);
    } catch (e) {
      console.error('❌ Following 数据处理失败', e);
    }

    isProcessing = false;
    needScroll = true;
    slowScroll();
  }

  /* ================= fetch hook ================= */
  const rawFetch = unsafeWindow.fetch;
  unsafeWindow.fetch = function (...args) {
    return rawFetch.apply(this, args).then(response => {
      try {
        if (
          response?.url &&
          response.url.includes(TARGET_API)
        ) {
          onApiHit(response);
        }
      } catch (e) {
        console.error(e);
      }
      return response;
    });
  };

  /* ================= XHR hook（兜底） ================= */
  const rawOpen =
    unsafeWindow.XMLHttpRequest.prototype.open;
  const rawSend =
    unsafeWindow.XMLHttpRequest.prototype.send;

  unsafeWindow.XMLHttpRequest.prototype.open =
    function (method, url) {
      this._url = url;
      return rawOpen.apply(this, arguments);
    };

  unsafeWindow.XMLHttpRequest.prototype.send =
    function () {
      this.addEventListener('load', () => {
        if (
          this._url &&
          this._url.includes(TARGET_API)
        ) {
          try {
            const json = JSON.parse(this.responseText);
            onApiHit(
              new Response(JSON.stringify(json))
            );
          } catch (e) {
            console.error(
              '❌ XHR JSON 解析失败',
              e
            );
          }
        }
      });
      return rawSend.apply(this, arguments);
    };
})();
