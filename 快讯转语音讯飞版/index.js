const mysql = require('mysql2/promise');
const { synthesizeSpeech } = require('./ttsService');
const path = require('path');

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const DB_PASSWORD = requireEnv('DB_PASSWORD');

// 数据库配置
const dbConfig = {
    host: '82.157.161.88',
    user: 'root',
    password: DB_PASSWORD,
    database: 'block_chain'
};

async function processRecords() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        // 获取 sounds 为空的最新 10 条数据
        const [rows] = await connection.execute(
            `SELECT id, 
                    CONCAT(title, IFNULL(CONCAT('，', detail_content), '')) AS text 
             FROM dt_hash_news_list 
             WHERE sounds IS NULL OR sounds = '' OR sounds = 'ERROR' 
             ORDER BY publish_time DESC 
             LIMIT 10`
        );
        for (const row of rows) {
            console.log(`处理 ID: ${row.id}, 文本: ${row.text}`);
            let retryCount = 3;
            while (retryCount > 0) {
                try {
                    const filePath = await synthesizeSpeech(row.text);
                    const relativePath = path.relative('/www/wwwroot/www.hashnews.pro/tts_output', filePath);
                    // 更新数据库
                    await connection.execute(
                        "UPDATE dt_hash_news_list SET sounds = ? WHERE id = ?",
                        [relativePath, row.id]
                    );
                    console.log(`ID: ${row.id} 语音合成完成，路径: ${relativePath}`);
                    break;
                } catch (error) {
                    console.error(`ID: ${row.id} 语音合成失败 (剩余重试次数: ${retryCount - 1})`, error);
                    retryCount--;
                    if (retryCount === 0) {
                        // 最终失败，标记为 ERROR
                        await connection.execute(
                            "UPDATE dt_hash_news_list SET sounds = 'ERROR' WHERE id = ?",
                            [row.id]
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error("数据库查询错误", error);
    } finally {
        await connection.end();
    }
}
// 定时任务：每 10 秒执行一次
//setInterval(processRecords, 10000);
processRecords()
