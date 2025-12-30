const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');

// 保存用户信息接口
router.post('/save', async (req, res) => {
  try {
    const { name, screen_name, image_url, followed_by } = req.body;
    
    // 验证必填字段
    if (!name || !screen_name) {
      return res.status(400).json({
        success: false,
        message: 'name 和 screen_name 是必填字段'
      });
    }
    
    // 保存用户数据
    const result = await userModel.saveUser({
      name,
      screen_name,
      image_url: image_url || null,
      followed_by: followed_by || false
    });
    
    res.json({
      success: true,
      message: '用户数据保存成功',
      data: result
    });
  } catch (error) {
    console.error('保存用户数据失败:', error);
    res.status(500).json({
      success: false,
      message: '保存用户数据失败',
      error: error.message
    });
  }
});

// 获取所有用户接口
router.get('/users', async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户数据失败',
      error: error.message
    });
  }
});

// 获取单个用户接口
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户数据失败',
      error: error.message
    });
  }
});

// 更新call字段接口
router.post('/update-call/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await userModel.updateCallCount(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'call字段更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
  } catch (error) {
    console.error('更新call字段失败:', error);
    res.status(500).json({
      success: false,
      message: '更新call字段失败',
      error: error.message
    });
  }
});

// 获取下一个未关注用户接口
router.get('/next-unfollowed', async (req, res) => {
  try {
    const result = await userModel.getNextUnfollowedUser();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取未关注用户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未关注用户失败',
      error: error.message
    });
  }
});

// 设置call字段为指定值接口
router.post('/set-call/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { call } = req.body;
    
    // 验证call值
    if (call === undefined || call === null) {
      return res.status(400).json({
        success: false,
        message: 'call字段是必填的'
      });
    }
    
    if (typeof call !== 'number' || !Number.isInteger(call)) {
      return res.status(400).json({
        success: false,
        message: 'call字段必须是整数'
      });
    }
    
    const success = await userModel.setCallCount(id, call);
    
    if (success) {
      res.json({
        success: true,
        message: `call字段已设置为 ${call}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
  } catch (error) {
    console.error('设置call字段失败:', error);
    res.status(500).json({
      success: false,
      message: '设置call字段失败',
      error: error.message
    });
  }
});

module.exports = router;