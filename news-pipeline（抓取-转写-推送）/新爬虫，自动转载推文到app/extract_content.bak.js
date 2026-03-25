const { chromium } = require('playwright');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 判断是否为长文/文章类型
 * @param {Object} data - 推文数据
 * @returns {boolean} - 是否为文章类型
 */
function isArticle(data) {
  if (data && typeof data === 'object') {
    // 只根据article.article_results.result.title字段的存在性判断是否为长文
    // 这是用户提供的唯一判断条件
    return !!data.article?.article_results?.result?.title;
  }
  return false;
}

// 配置对象
const config = {
  dbConfig: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  },
  browserConfig: {
    headless: process.env.BROWSER_HEADLESS === 'true',
    userDataDir: process.env.USER_DATA_DIR || './user_data'
  }
};

/**
 * 连接数据库
 * @returns {Promise<Connection>} - 数据库连接对象
 */
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(config.dbConfig);
    console.log('✅ 成功连接到数据库');
    return connection;
  } catch (error) {
    console.error('连接数据库失败:', error);
    throw error;
  }
}

/**
 * 获取待处理的推文
 * @param {Connection} connection - 数据库连接对象
 * @returns {Promise<Array>} - 待处理推文列表
 */
async function getPendingTweets(connection) {
  try {
    const [rows] = await connection.execute(
      'SELECT id, url FROM twitter_tweets WHERE status = ? ORDER BY id DESC',
      ['1']
    );
    console.log(`找到 ${rows.length} 条待处理的推文`);
    return rows;
  } catch (error) {
    console.error('查询待处理推文失败:', error);
    throw error;
  }
}

/**
 * 主函数 - 程序入口点
 */
async function main() {
  let connection = null;

  try {
    // 连接数据库
    connection = await connectToDatabase();

    // 获取待处理的推文
    const pendingTweets = await getPendingTweets(connection);

    if (pendingTweets.length === 0) {
      console.log('没有待处理的推文');
      return;
    }

    // 逐个处理推文
    for (const tweet of pendingTweets) {
      console.log(`\n处理推文: ${tweet.url}`);
      console.log(`推文ID: ${tweet.id}`);

      let context = null;
      let page = null;
      let tweetData = null;

      try {
        // 为当前推文创建新的浏览器上下文
        context = await chromium.launchPersistentContext(config.browserConfig.userDataDir, {
          headless: config.browserConfig.headless
        });

        // 创建新页面
        page = await context.newPage();

        // 设置请求拦截，只需要继续请求不需要额外处理
        await page.route('**/graphql/**/TweetResultByRestId', route => route.continue());

        // 监听所有响应
        page.on('response', async response => {
          const responseUrl = response.url();
          if (responseUrl.includes('TweetResultByRestId')) {
            try {
              const json = await response.json();
              
              if (json?.data) {
                for (const key in json.data) {
                  if (json.data[key]) {
                    // 检查不同的数据结构可能性
                    let result = null;
                    
                    // 可能性1: data[key].tweet_result?.result
                    if (json.data[key].tweet_result?.result) {
                      result = json.data[key].tweet_result.result;
                    }
                    // 可能性2: data[key].result
                    else if (json.data[key].result) {
                      result = json.data[key].result;
                    }
                    // 可能性3: data[key]本身就是result
                    else {
                      result = json.data[key];
                    }
                    
                    if (result) {
                      tweetData = result;
                    }
                  }
                }
              }
            } catch (error) {
              console.error('⚠️ 解析TweetResultByRestId响应失败:', error);
            }
          }
        });

        // 打开推文页面
        console.log('正在打开推文页面...');
        const responsePromise = page.waitForResponse(
          resp => resp.url().includes('TweetResultByRestId'),
          { timeout: 30000 }
        );

        await page.goto(tweet.url, { 
          waitUntil: 'networkidle',
          timeout: 60000 
        });

        // 等待特定响应
        console.log('等待TweetResultByRestId响应...');
        await responsePromise;

        // 等待一点额外时间确保所有数据都已处理
        await page.waitForTimeout(1000);

        // 进行推文类型判断
        console.log('\n=== 推文类型判断结果 ===');
        if (tweetData) {
          console.log('✅ 成功获取推文数据');
          
          // 无调试日志，保持代码简洁
          
          // 使用isArticle函数进行类型判断
          const isArticleType = isArticle(tweetData);
          
          console.log(`📊 推文类型判断: ${isArticleType ? '✅ 长文/笔记类型' : '❌ 普通推文类型'}`);
        } else {
          console.log('⚠️  未获取到推文数据');
        }
        console.log('=== 推文类型判断结束 ===');

        console.log(`推文 ${tweet.url} 处理完成`);
      } catch (error) {
        console.error(`处理推文 ${tweet.url} 失败:`, error);
      } finally {
        // 关闭当前推文的页面实例和浏览器上下文
        if (page) {
          await page.close();
        }
        if (context) {
          await context.close();
        }
      }

      // 处理完一条推文后等待2秒
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('主程序执行失败:', error);
  } finally {
    // 关闭数据库连接
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 执行主函数
main();