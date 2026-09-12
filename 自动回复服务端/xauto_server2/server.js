import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import { createBearerAuth, loadSecurityConfig } from "./security.js";

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";
const securityConfig = loadSecurityConfig();

app.use(cors(securityConfig.corsOptions));
app.use(bodyParser.json({ limit: "32kb" }));
app.use(createBearerAuth(securityConfig.tokenDigest));

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
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

function parseGeneratedReply(data) {
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  const match = text.match(/\{[\s\S]*\}/);
  let parsed = null;

  if (match) {
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    if (/否/.test(text)) parsed = { isWeb3: false, huifu: "" };
    else if (/是/.test(text)) parsed = { isWeb3: true, huifu: "" };
    else parsed = { isWeb3: false, huifu: "" };
  }

  return {
    isWeb3: parsed.isWeb3 === true || parsed.isWeb3 === "true",
    huifu: typeof parsed.huifu === "string" ? parsed.huifu.slice(0, 1000) : "",
  };
}

// === 数据库配置 ===
const dbPort = Number.parseInt(process.env.DB_PORT || "3306", 10);
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error("DB_PORT must be a valid TCP port");
}

const requiredEnv = (name) => {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`${name} must be configured`);
  return value;
};

const db = mysql.createConnection({
  host: requiredEnv("DB_HOST"),
  port: dbPort,
  user: requiredEnv("DB_USER"),
  password: requiredEnv("DB_PASSWORD"),
  database: process.env.DB_NAME || "xauto",
});

db.connect((err) => {
  if (err) {
    console.error("数据库连接失败：", err);
  } else {
    console.log("✅ 数据库已连接");
  }
});

// OpenAI credential stays on this authenticated loopback service, never in the browser script.
app.post("/generateReply", async (req, res) => {
  const tweetText = typeof req.body?.tweetText === "string" ? req.body.tweetText.trim() : "";
  if (!tweetText || tweetText.length > 10000) {
    return res.status(400).json({ message: "tweetText 长度必须为 1 到 10000 字符" });
  }

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({ message: "回复生成服务尚未配置" });
  }

  try {
    const response = await axios.post(
      OPENAI_ENDPOINT,
      {
        model: OPENAI_MODEL,
        temperature: 1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: tweetText },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
        maxContentLength: 1024 * 1024,
      }
    );

    return res.json(parseGeneratedReply(response.data));
  } catch (error) {
    console.error("回复生成请求失败", {
      status: error.response?.status,
      code: error.code,
    });
    return res.status(502).json({ message: "回复生成失败" });
  }
});


// ====================
// 1️⃣ 保存推文接口
// ====================
app.post("/saveTweet", (req, res) => {
  const { author, beijing_time, hours_ago, content, link, gpt_result, reply_content, status } = req.body;

  if (!author || !content || !link) {
    return res.status(400).json({ message: "缺少必要字段" });
  }

  const sql = `
    INSERT INTO tweets (author, beijing_time, hours_ago, content, link, gpt_result, reply_content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [author, beijing_time, hours_ago, content, link, gpt_result, reply_content, status || 0],
    (err, result) => {
      if (err) {
        console.error("保存失败：", err);
        return res.status(500).json({ message: "保存失败", error: err });
      }
      res.json({ message: "保存成功", id: result.insertId });
    }
  );
});


// ====================
// 2️⃣ 查询推文接口
// ====================
// 示例：GET /tweets?status=0&limit=10
app.get("/tweets", (req, res) => {
  const { status, limit } = req.query;
  let sql = "SELECT * FROM tweets WHERE 1=1";
  const params = [];

  if (status !== undefined) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY id DESC";

  if (limit) {
    sql += " LIMIT ?";
    params.push(parseInt(limit));
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("查询失败：", err);
      return res.status(500).json({ message: "查询失败", error: err });
    }
    res.json(results);
  });
});

// ====================
// 4️⃣ 查询推文接口（带分页）
// ====================
// 示例：GET /tweets/page?status=0&page=1&pageSize=10
app.get("/tweets/page", (req, res) => {
  const { status, page, pageSize } = req.query;
  let sql = "SELECT * FROM tweets WHERE 1=1";
  const countSql = "SELECT COUNT(*) as total FROM tweets WHERE 1=1";
  const params = [];
  const countParams = [];

  // 设置默认分页参数
  const currentPage = parseInt(page) || 1;
  const currentPageSize = parseInt(pageSize) || 10;
  const offset = (currentPage - 1) * currentPageSize;

  // 构建查询条件
  if (status !== undefined) {
    sql += " AND status = ?";
    countSql += " AND status = ?";
    params.push(status);
    countParams.push(status);
  }

  // 添加排序
  sql += " ORDER BY id DESC";
  
  // 添加分页
  sql += " LIMIT ? OFFSET ?";
  params.push(currentPageSize, offset);

  // 先查询总数
  db.query(countSql, countParams, (countErr, countResults) => {
    if (countErr) {
      console.error("查询总数失败：", countErr);
      return res.status(500).json({ message: "查询总数失败", error: countErr });
    }

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / currentPageSize);

    // 再查询数据
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("查询数据失败：", err);
        return res.status(500).json({ message: "查询数据失败", error: err });
      }

      res.json({
        data: results,
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          total: total,
          totalPages: totalPages
        }
      });
    });
  });
});


// ====================
// 3️⃣ 更新状态接口
// ====================
// 示例：POST /updateStatus  { "id": 5, "status": 1 }
app.post("/updateStatus", (req, res) => {
  const { id, status } = req.body;
  if (!id || status === undefined) {
    return res.status(400).json({ message: "缺少必要参数 id 或 status" });
  }

  const sql = "UPDATE tweets SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("更新失败：", err);
      return res.status(500).json({ message: "更新失败", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到对应记录" });
    }

    res.json({ message: "状态更新成功", id, newStatus: status });
  });
});


// 启动服务
app.listen(port, host, () => {
  console.log(`🚀 服务器已启动：http://${host}:${port}`);
});
