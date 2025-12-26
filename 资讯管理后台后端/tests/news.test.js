const request = require('supertest');
const app = require('../app');

describe('News API Tests', () => {
  let newsId;

  describe('POST /api/news', () => {
    it('应该创建一条新闻', async () => {
      const newsData = {
        unique_code: 'TEST001',
        title: '测试新闻标题',
        content: '测试新闻内容',
        primary_category: '科技',
        tags: JSON.stringify(['测试', 'API']),
        create_by: 'test_user'
      };

      const response = await request(app)
        .post('/api/news')
        .send(newsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newsData.title);
      expect(response.body.data.unique_code).toBe(newsData.unique_code);
      
      newsId = response.body.data.id;
    });

    it('应该拒绝无效数据', async () => {
      const invalidData = {
        content: '没有标题的新闻'
      };

      const response = await request(app)
        .post('/api/news')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('标题是必需的且不能为空');
    });
  });

  describe('GET /api/news', () => {
    it('应该获取新闻列表', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/news?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/news/:id', () => {
    it('应该根据ID获取新闻', async () => {
      const response = await request(app)
        .get(`/api/news/${newsId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(newsId);
    });

    it('应该返回404当新闻不存在', async () => {
      const response = await request(app)
        .get('/api/news/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/news/:id', () => {
    it('应该更新新闻', async () => {
      const updateData = {
        title: '更新后的标题',
        content: '更新后的内容',
        update_by: 'test_user'
      };

      const response = await request(app)
        .put(`/api/news/${newsId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('DELETE /api/news/:id', () => {
    it('应该删除新闻', async () => {
      const response = await request(app)
        .delete(`/api/news/${newsId}`)
        .send({ deleted_by: 'test_user' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

module.exports = { newsId };