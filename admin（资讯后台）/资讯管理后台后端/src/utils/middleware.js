const validateNews = (req, res, next) => {
  const { title, unique_code } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('标题是必需的且不能为空');
  }

  if (unique_code && !/^[a-zA-Z0-9]{1,10}$/.test(unique_code)) {
    errors.push('唯一编码只能是1-10位字母数字组合');
  }

  if (req.body.publish_time && isNaN(parseInt(req.body.publish_time))) {
    errors.push('发布时间必须是有效的Unix时间戳');
  }

  if (req.body.status && !['0', '1'].includes(req.body.status)) {
    errors.push('状态只能是0或1');
  }

  if (req.body.del_flag && !['0', '1'].includes(req.body.del_flag)) {
    errors.push('删除标志只能是0或1');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors
    });
  }

  next();
};

const validateNewsUpdate = (req, res, next) => {
  const errors = [];

  if (req.body.title && (typeof req.body.title !== 'string' || req.body.title.trim().length === 0)) {
    errors.push('标题不能为空字符串');
  }

  if (req.body.unique_code && !/^[a-zA-Z0-9]{1,10}$/.test(req.body.unique_code)) {
    errors.push('唯一编码只能是1-10位字母数字组合');
  }

  if (req.body.publish_time && isNaN(parseInt(req.body.publish_time))) {
    errors.push('发布时间必须是有效的Unix时间戳');
  }

  if (req.body.status && !['0', '1'].includes(req.body.status)) {
    errors.push('状态只能是0或1');
  }

  if (req.body.del_flag && !['0', '1'].includes(req.body.del_flag)) {
    errors.push('删除标志只能是0或1');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  if (req.query.page && (isNaN(page) || page < 1)) {
    return res.status(400).json({
      success: false,
      message: '页码必须是大于0的整数'
    });
  }

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({
      success: false,
      message: '每页数量必须是1-100之间的整数'
    });
  }

  next();
};

const validateSortParams = (req, res, next) => {
  const allowedSortFields = [
    'id', 'create_time', 'update_time', 'publish_time', 'title'
  ];
  const allowedSortOrders = ['ASC', 'DESC'];

  if (req.query.sortBy && !allowedSortFields.includes(req.query.sortBy)) {
    return res.status(400).json({
      success: false,
      message: `排序字段只能是: ${allowedSortFields.join(', ')}`
    });
  }

  if (req.query.sortOrder && !allowedSortOrders.includes(req.query.sortOrder.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: '排序方式只能是 ASC 或 DESC'
    });
  }

  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: '数据重复，唯一编码可能已存在'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  if (err.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({
      success: false,
      message: '必填字段不能为空'
    });
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
};

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('请求体:', JSON.stringify(req.body, null, 2));
  }
  
  next();
};

module.exports = {
  validateNews,
  validateNewsUpdate,
  validatePagination,
  validateSortParams,
  errorHandler,
  requestLogger
};