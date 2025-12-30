const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 保存用户信息
async function saveUser(userData) {
  const connection = await pool.getConnection();
  
  try {
    const { name, screen_name, image_url, followed_by } = userData;
    
    // 首先检查screen_name是否已存在
    const [existingScreenNameRows] = await connection.execute(
      'SELECT id FROM users WHERE screen_name = ?',
      [screen_name]
    );
    
    // 如果screen_name已存在，直接返回成功，不做任何更新
    if (existingScreenNameRows.length > 0) {
      return { success: true, action: 'ignored', id: existingScreenNameRows[0].id, message: 'screen_name已存在，已忽略' };
    }
    
    // 检查用户是否已存在（通过name和screen_name组合）
    const [existingRows] = await connection.execute(
      'SELECT id FROM users WHERE name = ? AND screen_name = ?',
      [name, screen_name]
    );
    
    if (existingRows.length > 0) {
      // 更新现有用户
      const [result] = await connection.execute(
        'UPDATE users SET image_url = ?, followed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ? AND screen_name = ?',
        [image_url, followed_by, name, screen_name]
      );
      return { success: true, action: 'updated', id: existingRows[0].id };
    } else {
      // 插入新用户
      const [result] = await connection.execute(
        'INSERT INTO users (name, screen_name, image_url, followed_by) VALUES (?, ?, ?, ?)',
        [name, screen_name, image_url, followed_by]
      );
      return { success: true, action: 'inserted', id: result.insertId };
    }
  } catch (error) {
    console.error('保存用户数据失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 获取所有用户
async function getAllUsers() {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 根据ID获取用户
async function getUserById(id) {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 更新call字段（递增）
async function updateCallCount(id) {
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      'UPDATE users SET `call` = `call` + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('更新call字段失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 设置call字段为指定值
async function setCallCount(id, callValue) {
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      'UPDATE users SET `call` = ? WHERE id = ?',
      [callValue, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('设置call字段失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 获取followed_by为0且call为0的第一条数据，以及剩余条数
async function getNextUnfollowedUser() {
  const connection = await pool.getConnection();
  
  try {
    // 获取符合条件的第一条数据（按id排序）
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE followed_by = 0 AND `call` = 0 ORDER BY id ASC LIMIT 1'
    );
    
    // 获取符合条件的剩余条数
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) as remaining_count FROM users WHERE followed_by = 0 AND `call` = 0'
    );
    
    const firstUser = rows.length > 0 ? rows[0] : null;
    const remainingCount = countRows[0].remaining_count;
    
    return {
      user: firstUser,
      remaining_count: remainingCount
    };
  } catch (error) {
    console.error('获取未关注用户失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  saveUser,
  getAllUsers,
  getUserById,
  updateCallCount,
  setCallCount,
  getNextUnfollowedUser
};