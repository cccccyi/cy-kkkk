// ==UserScript==
// @name         Twitter 推文跳转与自动回复
// @namespace    https://yourdomain.com
// @version      1.1
// @description  首页获取推文并跳转，详情页自动填充回复内容
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  'use strict';

  // 配置参数 - 可根据实际情况调整
  const CONFIG = {
    // 接口URL配置
    API_URL: "http://127.0.0.1:3000/tweets?status=0&limit=1",
    UPDATE_STATUS_URL: "http://127.0.0.1:3000/updateStatus",

    // 等待时间配置（毫秒）
    INITIAL_WAIT: 20000,           // 页面加载后初始等待时间
    CLICK_REPLY_BOX_WAIT: 5000,   // 点击回复框后的等待时间
    CONTENT_INPUT_WAIT: 20000,     // 内容输入后的等待时间
    API_CALL_WAIT: 5000,          // API调用后的等待时间
    SEND_REPLY_WAIT: 5000,       // 发送回复后的等待时间
    JUMP_DELAY: 3000,             // 跳转前的等待时间
    RECHECK_DELAY: 1000,          // 短内容处理后重新查询的等待时间
    POLLING_INTERVAL: 10000,      // 轮询间隔时间

    // 其他配置
    MIN_CONTENT_LENGTH: 20,       // 最小回复内容长度
    RUN_DELAY: 5000                // 页面加载后运行主函数的延迟时间
  };

  const API_URL = CONFIG.API_URL;

  GM_registerMenuCommand('配置本地 API 令牌', () => {
    const token = window.prompt('输入本地 API_AUTH_TOKEN（至少 32 字符）');
    if (token === null) return;
    if (token.trim().length < 32) {
      window.alert('API_AUTH_TOKEN 至少需要 32 字符，原配置未修改');
      return;
    }
    GM_setValue('API_AUTH_TOKEN', token.trim());
    window.alert('本地 API 令牌已保存');
  });

  function getApiAuthToken() {
    const token = GM_getValue('API_AUTH_TOKEN', '');
    if (typeof token !== 'string' || !token.trim()) {
      showMsg('❌ 未配置 API_AUTH_TOKEN，请先在油猴存储中设置');
      return null;
    }
    return token.trim();
  }

  // 创建右上角提示窗
  function showMsg(text) {
    let box = document.getElementById("tweet_jump_box");
    if (!box) {
      box = document.createElement("div");
      box.id = "tweet_jump_box";
      box.style.position = "fixed";
      box.style.top = "10px";
      box.style.right = "10px";
      box.style.background = "rgba(0,0,0,0.8)";
      box.style.color = "#fff";
      box.style.padding = "8px 12px";
      box.style.borderRadius = "8px";
      box.style.zIndex = "999999";
      box.style.fontSize = "13px";
      box.style.fontFamily = "Arial, sans-serif";
      document.body.appendChild(box);
    }
    box.textContent = text;
    console.log(`[TweetJump] ${text}`);
  }

  // 判断是否在首页
  function isHomePage() {
    return location.pathname === "/home";
  }

  // 判断是否在推文详情页
  function isTweetDetailPage() {
    return location.pathname.includes("/status/");
  }

  // 调用updateStatus接口更新推文状态
  function updateTweetStatus(id) {
    return new Promise((resolve, reject) => {
      const apiAuthToken = getApiAuthToken();
      if (!apiAuthToken) {
        reject(new Error('缺少 API_AUTH_TOKEN'));
        return;
      }

      showMsg(`📤 调用updateStatus接口更新状态...`);
      GM_xmlhttpRequest({
        method: "POST",
        url: CONFIG.UPDATE_STATUS_URL,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiAuthToken}`
        },
        data: JSON.stringify({ id, status: 1 }),
        onload(res) {
          try {
            const response = JSON.parse(res.responseText);
            if (res.status >= 200 && res.status < 300) {
              showMsg(`✅ updateStatus接口调用成功`);
              resolve(response);
            } else {
              showMsg(`❌ updateStatus接口调用失败: ${response.message || '未知错误'}`);
              reject(new Error(`API错误: ${response.message || '未知错误'}`));
            }
          } catch (e) {
            showMsg("❌ updateStatus接口响应解析错误");
            reject(e);
          }
        },
        onerror() {
          showMsg("❌ updateStatus接口请求失败");
          reject(new Error("网络请求失败"));
        }
      });
    });
  }

  // 安全地等待指定时间
  function safeWait(ms, message = '') {
    if (message) {
      showMsg(message);
    }
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  // 安全地返回首页
  function safeReturnToHome() {
    showMsg("🏠 发生异常，安全返回首页");
    // 清除轮询定时器
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    // 清除存储的数据
    GM_setValue('has_reply_content', false);
    GM_setValue('tweet_id', null);
    // 跳转到首页
    window.location.href = "https://twitter.com/home";
  }

  // 点击回复按钮发送回复并跳转回首页
  async function clickReplyButton() {
    try {
      showMsg("🖱️ 查找并点击回复按钮...");

      // 尝试查找回复按钮 - 使用data-testid
      let replyButton = document.querySelector('[data-testid="tweetButtonInline"]');

      // 如果没找到，尝试其他选择器
      if (!replyButton) {
        replyButton = document.querySelector('button:has(.css-1jxf684)');
      }

      // 如果还是没找到，尝试根据文本内容查找
      if (!replyButton) {
        const buttons = Array.from(document.querySelectorAll('button'));
        replyButton = buttons.find(btn =>
          btn.textContent.trim() === '回复' ||
          btn.innerText.trim() === '回复'
        );
      }

      if (replyButton && !replyButton.disabled) {
        showMsg("✅ 点击回复按钮发送回复！");
        // 使用标准点击方式
        replyButton.click();

        // 备选的安全点击方式
      //  try {
          // 使用document.createEvent避免MouseEvent构造的兼容性问题
       //   const evt = document.createEvent('MouseEvents');
        //  evt.initMouseEvent('click', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
       //   replyButton.dispatchEvent(evt);
      //  } catch (e) {
       //   console.log("备选点击方式失败，使用标准点击已足够:", e);
      //  }

        // 点击成功后等待指定时间再跳转回首页
        await safeWait(CONFIG.SEND_REPLY_WAIT, `⏳ 回复已发送，等待${CONFIG.SEND_REPLY_WAIT/1000}秒后返回首页...`);

        showMsg("🏠 跳转到首页继续处理下一条任务");
        window.location.href = "https://twitter.com/home";

        return true;
      } else if (replyButton && replyButton.disabled) {
        showMsg("❌ 回复按钮已禁用，请检查是否有内容或是否符合发送条件");
        // 即使按钮禁用也返回首页
        setTimeout(safeReturnToHome, 1000);
        return false;
      } else {
        showMsg("❌ 未找到可用的回复按钮");
        console.error("无法找到回复按钮，请检查DOM结构");
        // 没找到按钮也返回首页
        setTimeout(safeReturnToHome, 1000);
        return false;
      }
    } catch (error) {
      showMsg(`❌ 点击回复按钮时出错: ${error.message}`);
      console.error("点击回复按钮错误:", error);
      // 出错时返回首页
      setTimeout(safeReturnToHome, 1000);
      return false;
    }
  }

  // 在详情页自动填充回复内容并发送
  async function fillReplyContent() {
    try {
      // 从存储中获取回复内容和推文ID
      const replyContent = GM_getValue('reply_content', null);
      const hasReplyContent = GM_getValue('has_reply_content', false);
      const tweetId = GM_getValue('tweet_id', null);

      if (!hasReplyContent || !replyContent) {
        showMsg("📝 没有待填充的回复内容");
        // 返回首页
        setTimeout(safeReturnToHome, 1000);
        return;
      }

      if (!tweetId) {
        showMsg("❌ 未找到推文ID，无法更新状态");
        // 返回首页
        setTimeout(safeReturnToHome, 1000);
        return;
      }

      // 使用配置的等待时间
      await safeWait(CONFIG.INITIAL_WAIT, `⏳ 等待${CONFIG.INITIAL_WAIT/1000}秒后自动填充回复内容...`);

      // 查找回复框元素 - 先尝试主要的data-testid选择器
      let replyContainer;

      // 方法1: 查找data-testid为tweetTextarea_0的元素
      replyContainer = document.querySelector('[data-testid="tweetTextarea_0"]');

      // 如果没找到，尝试查找DraftEditor-root元素
      if (!replyContainer) {
        replyContainer = document.querySelector('.DraftEditor-root');
      }

      if (replyContainer) {
        showMsg("🖱️ 点击回复框区域...");
        // 点击回复框区域
        replyContainer.click();
        replyContainer.focus();

        // 使用配置的等待时间
        await safeWait(CONFIG.CLICK_REPLY_BOX_WAIT, `⏳ 等待${CONFIG.CLICK_REPLY_BOX_WAIT/1000}秒确保元素变为可输入状态...`);

        // 尝试查找data-text="true"的span元素（点击后变为可输入状态的元素）
        showMsg("🔍 查找可输入的span元素...");
        const textSpan = document.querySelector('span[data-text="true"]');

        let contentFilled = false;

        if (textSpan) {
          showMsg("📝 填充回复内容...");

          // 创建新的文本节点来替换现有内容
          const newTextNode = document.createTextNode(replyContent);

          // 替换span内的内容
          textSpan.innerHTML = ''; // 清空现有内容
          textSpan.appendChild(newTextNode);

          // 触发多种事件以确保Twitter检测到内容变化
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });

          // 从span向上查找最近的contenteditable元素来触发事件
          const contentEditableParent = textSpan.closest('[contenteditable="true"]');
          if (contentEditableParent) {
            contentEditableParent.dispatchEvent(inputEvent);
            contentEditableParent.dispatchEvent(changeEvent);
          } else {
            // 如果找不到contenteditable父元素，直接在span上触发
            textSpan.dispatchEvent(inputEvent);
          }

          contentFilled = true;
          showMsg("✅ 回复内容填充完成！");
        } else {
          // 备选方案：直接向contenteditable元素插入内容
          showMsg("🔍 尝试备选方案：直接向contenteditable元素插入...");
          const editableElement = document.querySelector('[contenteditable="true"]');

          if (editableElement) {
            // 使用Document.execCommand插入文本（更可靠的方法）
            editableElement.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, replyContent);

            contentFilled = true;
            showMsg("✅ 备选方案：回复内容填充完成！");
          } else {
            showMsg("❌ 未找到可输入的span元素或contenteditable元素");
          }
        }

        // 如果内容填充成功，继续执行后续操作
        if (contentFilled) {
          // 使用配置的等待时间
          await safeWait(CONFIG.CONTENT_INPUT_WAIT, `⏳ 等待${CONFIG.CONTENT_INPUT_WAIT/1000}秒确保Twitter处理完内容输入...`);

          try {
            // 调用updateStatus接口更新推文状态
            await updateTweetStatus(tweetId);

            // 使用配置的等待时间
            await safeWait(CONFIG.API_CALL_WAIT, `⏳ 等待${CONFIG.API_CALL_WAIT/1000}秒确保接口调用完成...`);

            // 点击回复按钮发送回复
            await clickReplyButton();

            // 清除已使用的回复内容和ID标记
            GM_setValue('has_reply_content', false);
            GM_setValue('tweet_id', null);
          } catch (err) {
            showMsg(`❌ 发送回复过程中出错: ${err.message}`);
            console.error("发送回复错误:", err);
            // 出错时返回首页
            setTimeout(safeReturnToHome, 1000);
          }
        } else {
          // 内容填充失败，返回首页
          showMsg("❌ 内容填充失败，返回首页");
          setTimeout(safeReturnToHome, 1000);
        }
      } else {
        showMsg("❌ 未找到回复框容器");
        console.error("无法定位回复框容器，请检查DOM结构");
        // 未找到容器，返回首页
        setTimeout(safeReturnToHome, 1000);
      }
    } catch (error) {
      showMsg(`❌ 填充回复内容时出错: ${error.message}`);
      console.error("填充回复内容错误:", error);
      // 任何异常都返回首页
      setTimeout(safeReturnToHome, 1000);
    }
  }

  // 检查回复内容长度并处理
  function checkReplyContentLength(id, content) {
    if (content && content.length < CONFIG.MIN_CONTENT_LENGTH) {
      showMsg(`ℹ️ 回复内容长度小于20字(${content.length}字)，直接更新状态`);
      updateTweetStatus(id).then(() => {
        showMsg("✅ 状态已更新，继续下一条");
        // 等待指定时间后重新查询
            setTimeout(() => runHomePageLogic(), CONFIG.RECHECK_DELAY);
      }).catch(err => {
        showMsg(`❌ 更新状态失败: ${err.message}`);
      });
      return true; // 已处理
    }
    return false; // 未处理，继续原有逻辑
  }

  // 轮询定时器ID
  let pollTimer = null;

  // 从首页获取推文并跳转
  function runHomePageLogic() {
    if (!isHomePage()) {
      showMsg("📝 当前不是首页，不执行跳转");
      return;
    }

    const apiAuthToken = getApiAuthToken();
    if (!apiAuthToken) return;

    showMsg("🏠 当前在首页，正在获取推文...");
    GM_xmlhttpRequest({
      method: "GET",
      url: API_URL,
      headers: { "Authorization": `Bearer ${apiAuthToken}` },
      onload(res) {
        try {
          const data = JSON.parse(res.responseText || "[]");
          if (Array.isArray(data) && data.length > 0 && data[0].link) {
            const tweet = data[0];

            // 存储推文ID
            if (tweet.id) {
              GM_setValue('tweet_id', tweet.id);
              console.log("存储推文ID:", tweet.id);
            }

            // 检查回复内容长度
            if (tweet.reply_content && tweet.id) {
              const isShortContent = checkReplyContentLength(tweet.id, tweet.reply_content);
              if (isShortContent) {
                return; // 已处理短内容，不执行后续逻辑
              }

              // 正常长度内容，存储并跳转
              GM_setValue('reply_content', tweet.reply_content);
              GM_setValue('has_reply_content', true);
              showMsg(`✅ 获取成功，3秒后跳转...将携带回复内容(${tweet.reply_content.length}字)`);
            } else {
              showMsg("✅ 获取成功，3秒后跳转...无回复内容");
              GM_setValue('has_reply_content', false);
            }

            console.log("跳转到：", tweet.link);
            setTimeout(() => {
              window.location.href = tweet.link;
            }, CONFIG.JUMP_DELAY);
          } else {
            showMsg("ℹ️ 没有未处理的推文，将定期检查...");
            // 设置定期轮询
            if (!pollTimer) {
              pollTimer = setInterval(() => {
                try {
                  if (isHomePage()) {
                    showMsg("🔄 定期检查新推文...");
                    runHomePageLogic();
                  } else {
                    // 如果不在首页了，清除轮询
                    clearInterval(pollTimer);
                    pollTimer = null;
                  }
                } catch (error) {
                  showMsg(`❌ 轮询过程中出错: ${error.message}`);
                  console.error("轮询错误:", error);
                  // 清除出错的轮询
                  clearInterval(pollTimer);
                  pollTimer = null;
                }
              }, CONFIG.POLLING_INTERVAL); // 定期检查
            }
          }
        } catch (e) {
          showMsg("❌ 数据解析错误");
          console.error(e);
        }
      },
      onerror() {
        showMsg("❌ 请求接口失败");
      },
    });
  }

  // 主执行逻辑
  function run() {
    showMsg("🚀 脚本开始运行...");

    // 清除可能存在的旧轮询定时器
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    if (isTweetDetailPage()) {
      // 在推文详情页执行填充回复内容逻辑
      fillReplyContent();
    } else if (isHomePage()) {
      // 在首页执行获取推文并跳转逻辑
      runHomePageLogic();
    } else {
      showMsg("📝 当前页面不需要执行操作");
    }
  }

  // 简化的全局错误处理 - 只处理必要的情况
  window.addEventListener('error', (event) => {
    // 只记录关键错误，不做过度处理
    console.error('脚本错误:', event);
  });

  window.addEventListener("unhandledrejection", (event) => {
    // 只记录关键Promise拒绝，不做过度处理
    console.error('未处理的Promise拒绝:', event);
  });

  window.addEventListener("load", () => {
    setTimeout(run, CONFIG.RUN_DELAY);
  });
})();
