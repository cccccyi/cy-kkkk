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

/**
 * 解码HTML实体字符
 * @param {string} html - 包含HTML实体的字符串
 * @returns {string} - 解码后的字符串
 */
function htmlDecode(html) {
  if (!html) return '';
  
  // 使用正则表达式替换常见的HTML实体字符
  return html
    .replace(/&quot;/g, '"')  // 双引号
    .replace(/&amp;/g, '&')    // 与号
    .replace(/&lt;/g, '<')     // 小于号
    .replace(/&gt;/g, '>')     // 大于号
    .replace(/&nbsp;/g, ' ')   // 空格
    .replace(/&apos;/g, "'")  // 单引号
    // 可以根据需要添加更多HTML实体的替换
    ;
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
  },
  waitTimes: {
    // 数据库轮询间隔（毫秒）
    dbPolling: process.env.DB_POLLING_INTERVAL || 60000,
    // 打开推文前的等待时间（毫秒）
    beforeOpenTweet: process.env.BEFORE_OPEN_TWEET_WAIT || 2000,
    // 数据采集完成后的等待时间（毫秒）
    afterDataCollection: process.env.AFTER_DATA_COLLECTION_WAIT || 3000,
    // 处理完一条推文后的等待时间（毫秒）
    betweenTweets: process.env.BETWEEN_TWEETS_WAIT || 2000
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
 * 处理单条推文
 * @param {Connection} connection - 数据库连接对象
 * @param {Object} tweet - 推文信息
 */
async function processTweet(connection, tweet) {
  console.log(`\n处理推文: ${tweet.url}`);
  console.log(`推文ID: ${tweet.id}`);

  let context = null;
  let page = null;
  let tweetData = null;

  try {
    // 打开推文前的等待时间
    console.log(`等待 ${config.waitTimes.beforeOpenTweet} 毫秒后打开推文...`);
    await new Promise(resolve => setTimeout(resolve, config.waitTimes.beforeOpenTweet));

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
          console.error('⚠️  解析TweetResultByRestId响应失败:', error);
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
      
      // 使用isArticle函数进行类型判断
      const isArticleType = isArticle(tweetData);
      
      console.log(`📊 推文类型判断: ${isArticleType ? '✅ 长文/笔记类型' : '❌ 普通推文类型'}`);
      
      // 更新推文类型到数据库
      const type = isArticleType ? 'B' : 'A';
      
      if (!isArticleType) {
        // 处理普通推文
        console.log('📝 开始处理普通推文内容...');
        
        // 从页面DOM获取富文本内容
        let content = '';
        let title = '';
        
        try {
          // 查找包含推文内容的元素
          const tweetElement = await page.locator('.css-175oi2r.r-1s2bzr4').first();
          if (tweetElement) {
            // 获取主要内容元素
            const contentElement = await tweetElement.locator('.css-146c3p1').first();
            if (contentElement) {
              // 获取富文本内容（带HTML标签）
              content = await contentElement.innerHTML();
              // 解码HTML实体字符
              content = htmlDecode(content);
              
              // 获取第一行文本作为标题
              const textContent = await contentElement.textContent();
              if (textContent) {
                title = textContent.split('\n')[0].trim();
                // 如果标题太长，截取前100个字符
                if (title.length > 100) {
                  title = title.substring(0, 100) + '...';
                }
              }
            }
          }
        } catch (error) {
          console.error('⚠️  获取DOM内容失败:', error);
        }
        
        // 提取媒体URL
        const mediaUrls = [];
        try {
          if (tweetData?.legacy?.entities?.media) {
            for (const media of tweetData.legacy.entities.media) {
              if (media?.media_url_https) {
                mediaUrls.push(media.media_url_https);
              }
            }
          }
        } catch (error) {
          console.error('⚠️  提取媒体URL失败:', error);
        }
        
        console.log(`📄 提取标题: ${title}`);
        console.log(`📷 提取媒体数量: ${mediaUrls.length}`);
        
        // 更新数据库
        try {
          await connection.execute(
            'UPDATE twitter_tweets SET type = ?, title = ?, content = ?, media_urls = ?, status = ? WHERE id = ?',
            [type, title, content, JSON.stringify(mediaUrls), '2', tweet.id]
          );
          console.log('✅ 普通推文数据已更新到数据库');
        } catch (error) {
          console.error('⚠️  更新数据库失败:', error);
        }
      } else {
        // 处理长文
        console.log('📝 开始处理长文内容...');
        
        // 提取长文标题
        let title = '';
        if (tweetData?.article?.article_results?.result?.title) {
          title = tweetData.article.article_results.result.title;
        }
        
        // 提取封面图片URL
        const mediaUrls = [];
        try {
          if (tweetData?.article?.article_results?.result?.cover_media?.media_info?.original_img_url) {
            mediaUrls.push(tweetData.article.article_results.result.cover_media.media_info.original_img_url);
          }
        } catch (error) {
          console.error('⚠️  提取封面图片URL失败:', error);
        }
        
        // 从页面DOM获取长文内容
        let content = '';
        try {
          // 查找长文内容编辑器容器
          const editorContainer = await page.locator('.DraftEditor-editorContainer').first();
          if (editorContainer) {
            // 获取富文本内容（带HTML标签）
            content = await editorContainer.innerHTML();
            // 解码HTML实体字符
            content = htmlDecode(content);
          }
        } catch (error) {
          console.error('⚠️  获取长文DOM内容失败:', error);
        }
        
        console.log(`📄 提取标题: ${title}`);
        console.log(`📷 提取媒体数量: ${mediaUrls.length}`);
        
        // 更新数据库
        try {
          await connection.execute(
            'UPDATE twitter_tweets SET type = ?, title = ?, content = ?, media_urls = ?, status = ? WHERE id = ?',
            [type, title, content, JSON.stringify(mediaUrls), '2', tweet.id]
          );
          console.log('✅ 长文数据已更新到数据库');
        } catch (error) {
          console.error('⚠️  更新长文数据库失败:', error);
        }
      }
    } else {
      console.log('⚠️  未获取到推文数据');
      // 更新状态为处理失败
      try {
        await connection.execute(
          'UPDATE twitter_tweets SET status = ? WHERE id = ?',
          ['3', tweet.id]
        );
        console.log('✅ 已将推文标记为处理失败');
      } catch (error) {
        console.error('⚠️  更新失败状态失败:', error);
      }
    }
    console.log('=== 推文类型判断结束 ===');

    // 数据采集完成后等待一段时间
    console.log(`等待 ${config.waitTimes.afterDataCollection} 毫秒后关闭页面...`);
    await page.waitForTimeout(config.waitTimes.afterDataCollection);

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
}

/**
 * 主函数 - 程序入口点
 */
async function main() {
  let connection = null;

  try {
    // 连接数据库
    connection = await connectToDatabase();

    // 持续运行程序，监听数据库
    while (true) {
      try {
        // 获取待处理的推文
        const pendingTweets = await getPendingTweets(connection);

        if (pendingTweets.length === 0) {
          console.log(`\n没有待处理的推文，${config.waitTimes.dbPolling} 毫秒后再次查询...`);
          await new Promise(resolve => setTimeout(resolve, config.waitTimes.dbPolling));
          continue;
        }

        console.log(`\n找到 ${pendingTweets.length} 条待处理的推文`);

        // 逐个处理推文
        for (const tweet of pendingTweets) {
          await processTweet(connection, tweet);
          // 处理完一条推文后等待一段时间
          if (pendingTweets.indexOf(tweet) < pendingTweets.length - 1) {
            console.log(`\n等待 ${config.waitTimes.betweenTweets} 毫秒后处理下一条推文...`);
            await new Promise(resolve => setTimeout(resolve, config.waitTimes.betweenTweets));
          }
        }
      } catch (error) {
        console.error('处理循环执行失败:', error);
        // 发生错误后等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, config.waitTimes.dbPolling));
      }
    }
  } catch (error) {
    console.error('主程序初始化失败:', error);
    // 主程序初始化失败后退出
    process.exit(1);
  } finally {
    // 关闭数据库连接（仅在程序意外退出时执行）
    if (connection) {
      await connection.end();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 执行主函数
main();