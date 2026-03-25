require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 配置参数
const config = {
  twitterLoginUrl: 'https://x.com/login',
  userDataDir: path.join(__dirname, 'user_data') // 保存浏览器状态的目录
};

// 主函数
async function main() {
  let context = null;

  try {
    // 创建用户数据目录（如果不存在）
    await fs.mkdir(config.userDataDir, { recursive: true });

    // 启动浏览器，使用用户数据目录来保存会话状态
    // 配置模拟真实浏览器环境的参数
    context = await chromium.launchPersistentContext(config.userDataDir, {
      headless: false, // 浏览器窗口可见
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
    const page = await context.newPage();

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

    console.log('正在打开Twitter登录页面...');
    // 打开Twitter登录页面，使用更宽松的加载条件
    await page.goto(config.twitterLoginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 使用domcontentloaded并增加超时时间到60秒
    console.log('Twitter登录页面已加载完成！');

    console.log('\n==============================================');
    console.log('Twitter登录提示');
    console.log('==============================================');
    console.log('1. 浏览器已打开Twitter登录页面');
    console.log('2. 请手动完成登录操作');
    console.log('3. 登录成功后，请手动关闭浏览器窗口');
    console.log('4. 浏览器窗口关闭后，会话状态将自动保存');
    console.log('5. 之后运行 npm start 即可使用保存的登录状态');
    console.log('==============================================\n');

    // 监听浏览器关闭事件
    context.on('close', () => {
      console.log('\n✅ 浏览器窗口已关闭，会话状态已保存！');
      console.log('您可以运行 npm start 开始监听推文了。');
      process.exit(0);
    });

    // 保持脚本运行，直到浏览器窗口被手动关闭
    await new Promise(() => {});
  } catch (error) {
    console.error('登录脚本出错:', error);
    if (context) {
      await context.close();
    }
    process.exit(1);
  }
}

// 启动程序
main();