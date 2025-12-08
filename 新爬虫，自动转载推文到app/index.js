require('dotenv').config();
const { chromium } = require('playwright');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

// 配置参数
const config = {
  targetUrl: 'https://x.com/HashNewsHK',
  minRefreshTime: 15000, // 最小刷新时间（毫秒）
  maxRefreshTime: 30000, // 最大刷新时间（毫秒）
  status: '1', // 状态：1刚发现
  userDataDir: path.join(__dirname, 'user_data'), // 保存浏览器状态的目录
  initialTweetUrl: 'https://x.com/HashNewsHK/status/1996192540404613328', // 手动指定的初始推文URL，当数据库为空时使用
  // 滚动相关配置
  scrollDelay: 5000, // 每次滚动后的等待时间（毫秒），等待新推文加载
  scrollSteps: 15, // 每次滚动的步数
  scrollDistance: 500, // 每次滚动的总距离（像素）
  scrollStepWait: 200, // 每步滚动之间的等待时间（毫秒）
  finalScrollStepWait: 100, // 最后几次滚动时每步的等待时间（毫秒）
  finalScrollDelay: 1500 // 最后几次滚动后的等待时间（毫秒）
  // initialTweetUrl: 'https://x.com/HashNewsHK/status/1234567890' // 示例：手动指定一个起始URL
};

// 不再使用本地集合记录已处理的推文，直接依赖数据库的URL检查

// 生成随机刷新时间
function getRandomRefreshTime() {
  return Math.random() * (config.maxRefreshTime - config.minRefreshTime) + config.minRefreshTime;
}

// 初始化数据库连接
async function initDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    return connection;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
}

// 获取数据库中最新的推文URL
async function getLatestTweetUrl(connection) {
  try {
    const [rows] = await connection.execute(
      'SELECT url FROM twitter_tweets ORDER BY created_at DESC LIMIT 1'
    );
    
    if (rows.length > 0) {
      console.log(`数据库中最新的推文URL: ${rows[0].url}`);
      return rows[0].url;
    } else {
      console.log('数据库中没有推文记录');
      return null;
    }
  } catch (error) {
    console.error('获取最新推文URL失败:', error);
    return null;
  }
}

// 保存推文到数据库
async function saveTweetToDatabase(connection, tweetData) {
  try {
    // 检查是否已存在相同的URL和user_id
    const [existingTweets] = await connection.execute(
      'SELECT id FROM twitter_tweets WHERE url = ? AND user_id = ?',
      [tweetData.url, tweetData.user_id]
    );

    if (existingTweets.length > 0) {
      console.log(`推文已存在: ${tweetData.url}`);
      return;
    }

    // 转换日期格式为MySQL兼容的格式
    function formatDateForMySQL(dateString) {
      const date = new Date(dateString);
      return date.toISOString().replace('T', ' ').slice(0, 19);
    }

    // 插入新推文
    const [result] = await connection.execute(
      `INSERT INTO twitter_tweets 
       (url, user_id, username, created_at, fetched_at, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tweetData.url,
        tweetData.user_id,
        tweetData.username,
        formatDateForMySQL(tweetData.created_at),
        formatDateForMySQL(tweetData.fetched_at),
        tweetData.status
      ]
    );

    console.log(`推文保存成功，ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('保存推文失败:', error);
    throw error;
  }
}

// 提取推文数据
async function extractTweets(page, onNewTweets, latestTweetUrl) {
  try {
    // 等待推文元素加载
    await page.waitForSelector('[data-testid="tweet"]');

    // 页面滚动加载更多推文（模拟鼠标滚动）
    console.log('正在模拟鼠标滚动页面，确保加载所有推文...');
    
    let previousTweetCount = 0;
    let currentTweetCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 30; // 最大滚动尝试次数
    const scrollDelay = config.scrollDelay; // 每次滚动后的等待时间（毫秒）
    const scrollSteps = config.scrollSteps; // 每次滚动的步数
    const scrollDistance = config.scrollDistance; // 每次滚动的总距离（像素）
    let foundLatestTweet = false; // 标记是否找到最新推文
    
    // 获取当前可见的推文数量
    const getTweetCount = async () => {
      return await page.evaluate(() => document.querySelectorAll('[data-testid="tweet"]').length);
    };
    
    // 提取当前页面上的所有推文
    const extractCurrentTweets = async () => {
      return await page.$$eval('[data-testid="tweet"]', (tweetElements) => {
        return tweetElements.map((tweetElement) => {
          // 检查是否为置顶推文
          const isPinned = tweetElement.querySelector('[data-testid="pin"]') !== null;
          
          // 提取用户名和用户ID
          const usernameElement = tweetElement.querySelector('[data-testid="User-Name"] a');
          const username = usernameElement ? usernameElement.textContent : 'Unknown';
          const userHref = usernameElement ? usernameElement.getAttribute('href') : '';
          const userId = userHref ? userHref.replace('/', '') : 'unknown';

          // 提取推文URL
          const tweetUrlElement = tweetElement.querySelector('a[href*="/status/"]');
          const tweetUrl = tweetUrlElement ? `https://x.com${tweetUrlElement.getAttribute('href')}` : '';

          // 提取创建时间
          const timeElement = tweetElement.querySelector('time');
          const createdAt = timeElement ? timeElement.getAttribute('datetime') : null;

          return {
            url: tweetUrl,
            user_id: userId,
            username: username,
            created_at: createdAt,
            isPinned: isPinned
          };
        })
        .filter((tweet) => tweet.url && tweet.user_id && tweet.username && tweet.created_at)
        .filter((tweet) => !tweet.isPinned); // 过滤掉置顶推文
      });
    };
    
    // 先获取初始推文并保存
    let allTweets = await extractCurrentTweets();
    console.log(`初始推文数量: ${allTweets.length}`);
    
    // 如果有回调函数，就保存新推文
    if (onNewTweets) {
      await onNewTweets(allTweets);
    }
    
    // 持续滚动直到没有新推文加载或达到最大尝试次数
    while (scrollAttempts < maxScrollAttempts) {
      // 记录之前的推文数量
      previousTweetCount = allTweets.length;
      
      // 模拟鼠标滚轮滚动
      console.log('模拟鼠标滚轮滚动...');
      
      // 分多次滚动，模拟自然的鼠标滚动效果
      const stepDistance = scrollDistance / scrollSteps;
      for (let i = 0; i < scrollSteps; i++) {
        // 使用 mouse.wheel() 方法模拟鼠标滚动
        await page.mouse.wheel(0, stepDistance);
        // 小停顿，使滚动更自然
        await page.waitForTimeout(config.scrollStepWait);
      }
      
      // 等待新推文加载
      await page.waitForTimeout(scrollDelay);
      
      // 获取新的推文
      const newTweets = await extractCurrentTweets();
      console.log(`滚动后推文数量: ${newTweets.length}`);
      
      // 检查是否找到最新推文URL（数据库最新或手动指定）
      if (latestTweetUrl) {
        foundLatestTweet = newTweets.some(tweet => tweet.url === latestTweetUrl);
        if (foundLatestTweet) {
          console.log(`找到目标推文: ${latestTweetUrl}`);
          console.log('已经无缝衔接，停止滚动');
          break;
        }
      }
      
      // 过滤出真正的新推文
      const trulyNewTweets = newTweets.filter(tweet => !allTweets.some(existing => existing.url === tweet.url));
      
      if (trulyNewTweets.length > 0) {
        console.log(`发现 ${trulyNewTweets.length} 条新推文，立即保存...`);
        
        // 将新推文添加到所有推文中
        allTweets = [...allTweets, ...trulyNewTweets];
        
        // 如果有回调函数，就保存新推文
        if (onNewTweets) {
          await onNewTweets(trulyNewTweets);
        }
        
        // 有新推文加载，重置尝试次数
        scrollAttempts = 0;
      } else {
        scrollAttempts++;
        console.log(`未加载到新推文，尝试次数: ${scrollAttempts}`);
      }
    }
    
    // 如果已经找到最新推文，则跳过额外的滚动，直接结束
    if (foundLatestTweet) {
      console.log('已经找到目标推文，跳过额外滚动，结束当前轮次');
    } else {
      // 再额外模拟几次鼠标滚动，确保所有推文都被加载
      console.log('进行最后几次模拟鼠标滚动，确保加载完全...');
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
          await page.mouse.wheel(0, 300);
          await page.waitForTimeout(config.finalScrollStepWait);
        }
        await page.waitForTimeout(config.finalScrollDelay);
        
        // 每次额外滚动后也提取并保存新推文
        const finalTweets = await extractCurrentTweets();
        const trulyNewFinalTweets = finalTweets.filter(tweet => !allTweets.some(existing => existing.url === tweet.url));
        
        if (trulyNewFinalTweets.length > 0) {
          console.log(`发现 ${trulyNewFinalTweets.length} 条新推文，立即保存...`);
          
          // 将新推文添加到所有推文中
          allTweets = [...allTweets, ...trulyNewFinalTweets];
          
          // 如果有回调函数，就保存新推文
          if (onNewTweets) {
            await onNewTweets(trulyNewFinalTweets);
          }
        }
      }
    }
    
    console.log(`滚动完成，最终共提取到 ${allTweets.length} 条推文`);
    return allTweets;
  } catch (error) {
    console.error('提取推文失败:', error);
    return [];
  }
}

// 检查登录状态
async function checkLoginStatus(page) {
  try {
    // 尝试导航到首页
    await page.goto('https://x.com/home', { waitUntil: 'networkidle' });
    
    // 检查是否存在登录后的元素（如发布推文按钮）
    await page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  let context = null;
  let connection = null;

  try {
    // 初始化数据库连接
    connection = await initDatabase();

    // 创建用户数据目录（如果不存在）
    await fs.mkdir(config.userDataDir, { recursive: true });

    // 启动浏览器，使用用户数据目录来保存会话状态
    // 配置模拟真实浏览器环境的参数
    context = await chromium.launchPersistentContext(config.userDataDir, {
      headless: true, // 浏览器窗口始终可见
      slowMo: 0,
      // 模拟真实浏览器的配置
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: null, // 不设置固定视口，允许浏览器自由调整大小
      ignoreHTTPSErrors: true,
      // 添加更多浏览器参数以模拟真实环境
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // 禁用自动化检测
        '--disable-features=site-per-process',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
        '--disable-infobars',
        '--window-size=1280,720' // 初始窗口大小，但允许后续调整
      ]
    });

    // 创建页面
    let page = await context.newPage();

    // 禁用自动化控制检测
    await page.addInitScript(() => {
      // 移除 navigator.webdriver 属性
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // 移除 window.chrome.webdriver 属性
      if (window.chrome && window.chrome.webdriver) {
        delete window.chrome.webdriver;
      }
    });

    // 直接打开目标网页，不检查登录状态
    console.log('正在打开目标页面...');
    await page.goto(config.targetUrl, { 
      waitUntil: 'domcontentloaded', // 使用更宽松的加载条件
      timeout: 60000 // 增加超时时间到60秒
    });
    console.log('目标页面已加载完成！');

    console.log(`\n==============================================`);
    console.log(`开始监听推文: ${config.targetUrl}`);
    console.log(`刷新时间范围: ${config.minRefreshTime/1000}-${config.maxRefreshTime/1000}秒`);
    console.log(`浏览器窗口保持可见状态，便于观察和调试`);
    console.log(`按Ctrl+C终止程序`);
    console.log(`==============================================\n`);

    // 循环执行
    while (true) {
      // 提取推文并在每次滚动后保存新推文
      try {
        // 获取数据库中最新的推文URL，用于无缝衔接
        let latestTweetUrl = await getLatestTweetUrl(connection);
        
        // 如果数据库为空，使用手动指定的初始URL
        if (!latestTweetUrl && config.initialTweetUrl) {
          console.log(`数据库为空，使用手动指定的初始推文URL: ${config.initialTweetUrl}`);
          latestTweetUrl = config.initialTweetUrl;
        }
        
        await extractTweets(page, async (newTweets) => {
          try {
            // 处理每条新推文
            for (const tweet of newTweets) {
              // 准备保存到数据库的数据
              const tweetData = {
                ...tweet,
                fetched_at: new Date(),
                status: config.status
              };

              // 保存到数据库（数据库层会检查URL是否存在）
              await saveTweetToDatabase(connection, tweetData);
            }
          } catch (error) {
            console.error('处理新推文时出错:', error);
            // 继续执行，不影响主循环
          }
        }, latestTweetUrl);
      } catch (error) {
        console.error('提取推文时出错:', error);
        // 继续执行，不影响主循环
      }

      // 生成随机刷新时间
      const refreshTime = getRandomRefreshTime();
      console.log(`等待 ${refreshTime / 1000} 秒后刷新`);

      // 等待指定时间后刷新
      await new Promise((resolve) => setTimeout(resolve, refreshTime));
      console.log('正在刷新页面...');
      
      try {
        // 检查页面是否仍然可用
        if (page.isClosed()) {
          console.log('页面已关闭，重新创建页面...');
          page = await context.newPage();
          await page.goto(config.targetUrl);
        } else {
          // 刷新页面
          await page.reload({ 
            waitUntil: 'domcontentloaded', // 使用更宽松的加载条件
            timeout: 60000 // 增加超时时间到60秒
          });
        }
        console.log('页面刷新完成！');
      } catch (error) {
        console.error('刷新页面时出错:', error);
        // 尝试重新创建页面
        console.log('尝试重新创建页面...');
        try {
          // 如果页面已关闭，创建新页面
          if (page.isClosed()) {
            page = await context.newPage();
            await page.goto(config.targetUrl);
            console.log('页面重新创建成功！');
          }
        } catch (recreateError) {
          console.error('重新创建页面时出错:', recreateError);
        }
      }
    }
  } catch (error) {
    console.error('程序出错:', error);
  } finally {
    // 关闭资源
    if (context) {
      await context.close();
    }
    if (connection) {
      await connection.end();
    }
  }
}

// 启动程序
main();