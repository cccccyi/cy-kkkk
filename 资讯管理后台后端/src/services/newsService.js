const { pool } = require('../config/database');
const News = require('../models/News');

class NewsService {
  generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async create(newsData) {
    const connection = await pool.getConnection();
    try {
      const validation = News.validate(newsData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      let uniqueCode = newsData.unique_code;
      if (!uniqueCode) {
        uniqueCode = this.generateUniqueCode();
        let attempts = 0;
        while (attempts < 10) {
          const [existing] = await connection.execute(
            'SELECT id FROM dt_hash_news_list WHERE unique_code = ?',
            [uniqueCode]
          );
          if (existing.length === 0) break;
          uniqueCode = this.generateUniqueCode();
          attempts++;
        }
        if (attempts >= 10) {
          throw new Error('生成唯一编码失败，请重试');
        }
      }

      const news = new News({
        ...newsData,
        unique_code: uniqueCode,
        del_flag: newsData.del_flag || '0',
        status: newsData.status || '0',
        // 显式设置可选字段为 null，以覆盖数据库默认值
        tg_status: newsData.hasOwnProperty('tg_status') ? newsData.tg_status : null,
        push_status: newsData.hasOwnProperty('push_status') ? newsData.push_status : null,
        push_flag: newsData.hasOwnProperty('push_flag') ? newsData.push_flag : null
      });

      const sql = `
        INSERT INTO dt_hash_news_list (
          unique_code, source_id, publish_time, primary_category, categories, tags,
          push_flag, title, content, detail_content, title_en, content_en,
          detail_content_en, audio_text, del_flag, remark, status, tg_status,
          push_status, create_by, update_by, sounds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        news.unique_code,
        news.source_id,
        news.publish_time,
        news.primary_category,
        news.categories,
        news.tags,
        newsData.hasOwnProperty('push_flag') ? newsData.push_flag : null,
        news.title,
        news.content,
        news.detail_content,
        news.title_en,
        news.content_en,
        news.detail_content_en,
        news.audio_text,
        news.del_flag,
        news.remark,
        news.status,
        newsData.hasOwnProperty('tg_status') ? newsData.tg_status : null,
        newsData.hasOwnProperty('push_status') ? newsData.push_status : null,
        news.create_by,
        news.update_by,
        news.sounds
      ];

      const [result] = await connection.execute(sql, values);
      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM dt_hash_news_list WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? new News(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findAll(options = {}) {
    const connection = await pool.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        keyword,
        sortBy = 'publish_time',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
            let queryParams = [];

            if (category) {
              whereConditions.push('primary_category = ?');
              queryParams.push(category);
            }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (keyword) {
        whereConditions.push('(title LIKE ? OR content LIKE ?)');
        queryParams.push(`%${keyword}%`, `%${keyword}%`);
      }

      const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';
      
      const countSql = `SELECT COUNT(*) as total FROM dt_hash_news_list WHERE ${whereClause}`;
      const [countResult] = await connection.execute(countSql, queryParams);
      const total = countResult[0].total;

      const dataSql = `
        SELECT * FROM dt_hash_news_list 
        WHERE ${whereClause} 
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      queryParams.push(limit, offset);

      const [rows] = await connection.execute(dataSql, queryParams);
      const news = rows.map(row => new News(row));

      return {
        data: news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const existingNews = await this.findById(id);
      if (!existingNews) {
        throw new Error('新闻不存在');
      }

      const updatedNews = new News({ ...existingNews.toJSON(), ...updateData });
      
      const sql = `
        UPDATE dt_hash_news_list SET
          source_id = ?, publish_time = ?, primary_category = ?, categories = ?,
          tags = ?, push_flag = ?, title = ?, content = ?, detail_content = ?,
          title_en = ?, content_en = ?, detail_content_en = ?, audio_text = ?,
          del_flag = ?, remark = ?, status = ?, tg_status = ?, push_status = ?,
          update_by = ?, update_time = CURRENT_TIMESTAMP(6), sounds = ?
        WHERE id = ?
      `;

      const values = [
        updatedNews.source_id,
        updatedNews.publish_time,
        updatedNews.primary_category,
        updatedNews.categories,
        updatedNews.tags,
        updatedNews.push_flag,
        updatedNews.title,
        updatedNews.content,
        updatedNews.detail_content,
        updatedNews.title_en,
        updatedNews.content_en,
        updatedNews.detail_content_en,
        updatedNews.audio_text,
        updatedNews.del_flag,
        updatedNews.remark,
        updatedNews.status,
        updatedNews.tg_status,
        updatedNews.push_status,
        updatedNews.update_by,
        updatedNews.sounds,
        id
      ];

      await connection.execute(sql, values);
      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  async permanentDelete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM dt_hash_news_list WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = new NewsService();