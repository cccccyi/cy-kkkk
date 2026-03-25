const newsService = require('../services/newsService');

class NewsController {
  async createNews(req, res) {
    try {
      const newsData = {
        ...req.body,
        create_by: req.body.create_by || 'system',
        update_by: req.body.update_by || 'system',
        publish_time: req.body.publish_time || Math.floor(Date.now() / 1000)
      };

      const news = await newsService.create(newsData);
      
      res.status(201).json({
        success: true,
        message: '新闻创建成功',
        data: news.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: '新闻创建失败',
        error: error.message
      });
    }
  }

  async getNewsById(req, res) {
    try {
      const { id } = req.params;
      const news = await newsService.findById(id);
      
      if (!news) {
        return res.status(404).json({
          success: false,
          message: '新闻不存在'
        });
      }

      res.json({
        success: true,
        data: news.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取新闻失败',
        error: error.message
      });
    }
  }

  async getAllNews(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        category: req.query.category,
        status: req.query.status,
        keyword: req.query.keyword,
        sortBy: req.query.sortBy || 'publish_time',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await newsService.findAll(options);
      
      res.json({
        success: true,
        data: result.data.map(news => news.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取新闻列表失败',
        error: error.message
      });
    }
  }

  async updateNews(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        update_by: req.body.update_by || 'system'
      };

      const news = await newsService.update(id, updateData);
      
      res.json({
        success: true,
        message: '新闻更新成功',
        data: news.toJSON()
      });
    } catch (error) {
      if (error.message === '新闻不存在') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        message: '新闻更新失败',
        error: error.message
      });
    }
  }

  async permanentDeleteNews(req, res) {
    try {
      const { id } = req.params;
      const success = await newsService.permanentDelete(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '新闻不存在'
        });
      }

      res.json({
        success: true,
        message: '新闻已永久删除'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '永久删除新闻失败',
        error: error.message
      });
    }
  }

}

module.exports = new NewsController();