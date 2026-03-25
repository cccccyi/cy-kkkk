import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === 数据库配置 ===
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "a03007600",
  database: "xauto",
});

db.connect((err) => {
  if (err) {
    console.error("数据库连接失败：", err);
  } else {
    console.log("✅ 数据库已连接");
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
app.listen(3000, () => {
  console.log("🚀 服务器已启动：http://localhost:3000");
});
