// ==UserScript==
// @name         Twitter 币圈抓取 + GPT 自动生成回复（优化版）
// @namespace    https://yourdomain.com
// @version      3.4
// @description  抓取推文 -> 自动展开 -> GPT判断币圈并生成专业回复 -> 入库（防重+状态提示）
// @match        https://x.com/home
// @grant        GM_xmlhttpRequest
// @connect      api.openai.com
// @connect      localhost
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ====== 配置 ======
  const BATCH_COUNT = 1;
  const MAX_HOURS_AGO = 4;
  const WAIT_BEFORE_RELOAD_SECONDS = 130;
  const GPT_API_KEY = "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";
  const GPT_MODEL = "gpt-5-mini";
  const FILTER_AUTHORS = ["PANews","PANews中文", "哈世链闻【下载APP追热点】","吴说区块链"];
  const API_URL = "http://localhost:3000/saveTweet";

  const SYSTEM_PROMPT = `
请判断这条推文是否符合条件：
1、推文内容与中文web3、币圈、区块链、数字币相关的，纯英文的直接略过，小于十个字的直接略过；
2、不是为某个meme币喊单的，尤其是贴文中含有合约地址的；
3、不含骂人的话语。
4、推文不是形容某个单一meme币的。
5、与赌无关
满足以上条件，回答 是，不满足回答 否。
如果满足的话，帮我生成回复内容，你是一名资深区块链媒体编辑，回复时不要透漏自己的身份，回复要自然、有情感、轻松口语化，避免使用“投资者”“参与者”等生硬称谓，用一些更亲切的称谓表达。语气保持客观、中立、专业，不要说但是、不能反驳他。内容围绕币圈话题展开，每次回复保持在50～100字之间，不要总结或重复原文、不要老是教人做事，内容要和币圈有关，不要闲聊。
最后的结果以JSON形式返回，格式如下：
{"isWeb3": true, "huifu": "这里是生成的回复内容"}
`;

  // ====== 状态浮窗 ======
  const statusDiv = document.createElement('div');
  statusDiv.style = `
      position:fixed;top:10px;right:10px;z-index:999999;
      background:rgba(0,0,0,0.8);color:#00FF90;
      padding:10px 14px;border-radius:10px;
      font-size:13px;font-family:monospace;
      white-space:pre-line;line-height:1.3;
  `;
  statusDiv.innerText = "🚀 脚本启动中...";
  document.body.appendChild(statusDiv);
  const updateStatus = text => (statusDiv.innerText = text);

  // ====== 工具函数 ======
  const seenLinks = new Set();

  function hoursAgo(datetimeString) {
    const diff = Date.now() - new Date(datetimeString).getTime();
    return diff / (1000 * 60 * 60);
  }

  function toBeijingTime(datetimeString) {
    const d = new Date(datetimeString);
    return d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  }

  // ====== 先展开推文再抓内容 ======
  async function expandTweetContent(article) {
    if (!article) return;

    // 首先尝试通过data-testid查找
    const dataTestIdBtn = article.querySelector('[data-testid="tweet-text-show-more-link"]');
    if (dataTestIdBtn) {
      console.log("🟡 检测到'显示更多'按钮(data-testid)，正在点击展开...");
      try {
        dataTestIdBtn.click();
        await new Promise(r => setTimeout(r, 500));
        return;
      } catch (err) {
        console.warn("⚠️ 展开内容时出错：", err);
      }
    }

    // 如果通过data-testid没找到，尝试通过文本内容查找
    const spans = article.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent.trim();
      if (text === "显示更多" || text === "Show more") {
        console.log("🟡 检测到'显示更多'按钮(text)，正在点击展开...");
        try {
          span.click();
          await new Promise(r => setTimeout(r, 500));
          return;
        } catch (err) {
          console.warn("⚠️ 展开内容时出错：", err);
        }
      }
    }
  }

  // ====== 获取推文内容 ======
  async function getTweetContent(article) {
    if (!article) return "";

    // 先展开（如果有）
    await expandTweetContent(article);

    // 再抓正文（支持新版 DOM）
    const textBlocks = article.querySelectorAll('div[data-testid="tweetText"] span');
    const content = Array.from(textBlocks).map(el => el.innerText).join("\n").trim();

    return content;
  }

  // ====== GPT 调用 ======
  async function callGPT(tweetText) {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GPT_API_KEY}`,
        },
        data: JSON.stringify({
          model: GPT_MODEL,
          temperature: 1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: tweetText },
          ],
        }),
        timeout: 60000,
        onload: res => {
          try {
            const json = JSON.parse(res.responseText);
            const text = json.choices?.[0]?.message?.content?.trim() || "";

            const match = text.match(/\{[\s\S]*\}/);
            let parsed = match ? JSON.parse(match[0]) : null;

            if (!parsed) {
              if (/否/.test(text)) parsed = { isWeb3: false, huifu: "" };
              else if (/是/.test(text)) parsed = { isWeb3: true, huifu: "" };
              else parsed = { isWeb3: false, huifu: text };
            }

            resolve(parsed);
          } catch (e) {
            console.error("❌ GPT解析失败：", e, res.responseText);
            resolve({ isWeb3: false, huifu: "" });
          }
        },
        onerror: err => {
          console.error("❌ GPT请求错误：", err);
          resolve({ isWeb3: false, huifu: "" });
        },
        ontimeout: () => {
          console.error("❌ GPT请求超时");
          resolve({ isWeb3: false, huifu: "" });
        },
      });
    });
  }

  // ====== 入库 ======
  function saveToServer(tweet) {
    GM_xmlhttpRequest({
      method: "POST",
      url: API_URL,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(tweet),
      onload: res => console.log("✅ 入库成功：", res.responseText),
      onerror: err => console.error("❌ 入库失败：", err),
    });
  }

  // ====== 抓取逻辑 ======
  async function scrapeTimeline() {
    const tweets = document.querySelectorAll('article[role="article"]');
    const validTweets = [];

    for (const article of tweets) {
      const author = article.querySelector('a[href^="/"][role="link"] span')?.textContent || "(未知作者)";
      if (FILTER_AUTHORS.includes(author)) continue;

      const link = article.querySelector('a[href*="/status/"]')?.href;
      if (!link || seenLinks.has(link)) continue;
      seenLinks.add(link);

      const content = await getTweetContent(article);

      const timeEl = article.querySelector("time");
      const utc = timeEl ? timeEl.getAttribute("datetime") : null;
      const diffHours = utc ? hoursAgo(utc) : NaN;

      if (!isNaN(diffHours) && diffHours <= MAX_HOURS_AGO && content) {
        validTweets.push({ author, content, utc, diffHours, link });
      }
    }

    console.log(`📦 找到 ${validTweets.length} 条新推文（≤${MAX_HOURS_AGO}小时）`);
    updateStatus(`📦 检测到 ${validTweets.length} 条推文\n开始调用GPT...`);

    for (const tweet of validTweets) {
      const bjTime = toBeijingTime(tweet.utc);
      try {
        const gptRes = await callGPT(tweet.content);
        const isWeb3 = gptRes.isWeb3 === true || gptRes.isWeb3 === "true";
        const replyContent = isWeb3 ? gptRes.huifu : "";

        console.log("—— 推文分析 ——");
        console.log("作者：", tweet.author);
        console.log("北京时间：", bjTime);
        console.log("距今：", tweet.diffHours.toFixed(1), "小时");
        console.log("内容：", tweet.content);
        console.log("链接：", tweet.link);
        console.log("GPT 返回：", gptRes);

        if (isWeb3) {
          saveToServer({
            author: tweet.author,
            beijing_time: bjTime,
            hours_ago: tweet.diffHours.toFixed(1),
            content: tweet.content,
            link: tweet.link,
            gpt_result: "是",
            reply_content: replyContent,
            status: 0,
          });
          updateStatus(`✅ 入库：${tweet.author}\n${replyContent.slice(0, 40)}...`);
        } else {
          updateStatus(`❌ 非币圈推文：${tweet.author}`);
        }

        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        console.error("❌ GPT处理失败：", e);
      }
    }
  }

  // ====== 主流程 ======
  async function start() {
    for (let i = 0; i < BATCH_COUNT; i++) {
      updateStatus(`🚀 第 ${i + 1}/${BATCH_COUNT} 批抓取中...`);
      await scrapeTimeline();
      if (i < BATCH_COUNT - 1) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        await new Promise(r => setTimeout(r, 6000));
      }
    }

    console.log(`✅ 共抓取 ${BATCH_COUNT} 批完成`);
    updateStatus(`✅ 抓取完成\n${WAIT_BEFORE_RELOAD_SECONDS} 秒后自动刷新`);

    let remain = WAIT_BEFORE_RELOAD_SECONDS;
    const timer = setInterval(() => {
      updateStatus(`✅ 抓取完成
⏳ ${remain} 秒后返回首页并刷新...`);
      remain--;
      if (remain <= 0) {
        clearInterval(timer);
        // 先导航回Twitter主页，确保在下一轮采集时处于正确的页面
        window.location.href = 'https://twitter.com/home';
        // 使用setTimeout确保先导航后刷新，给页面加载留出时间
        setTimeout(() => {
          location.reload();
        }, 2000);
      }
    }, 1000);
  }

  // ====== 等待“为你推荐”标签加载 ======
  function waitForForYouTab() {
    const tab = document.querySelector('main [role="tablist"] a[role="tab"]');
    if (tab) {
      tab.click();
      console.log("✅ 点击“为你推荐”");
      updateStatus("✅ 进入‘为你推荐’，准备抓取...");
      setTimeout(start, 3000);
    } else {
      setTimeout(waitForForYouTab, 1000);
    }
  }

  waitForForYouTab();
})();
