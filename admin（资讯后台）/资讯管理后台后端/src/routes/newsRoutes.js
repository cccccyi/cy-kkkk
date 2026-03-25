const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { validateNews, validateNewsUpdate, validatePagination, validateSortParams } = require('../utils/middleware');

router.post('/news', validateNews, newsController.createNews);

router.get('/news', validatePagination, validateSortParams, newsController.getAllNews);

router.get('/news/:id', newsController.getNewsById);

router.put('/news/:id', validateNewsUpdate, newsController.updateNews);

router.delete('/news/:id', newsController.permanentDeleteNews);

module.exports = router;