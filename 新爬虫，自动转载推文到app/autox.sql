/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80028 (8.0.28)
 Source Host           : localhost:3306
 Source Schema         : autox

 Target Server Type    : MySQL
 Target Server Version : 80028 (8.0.28)
 File Encoding         : 65001

 Date: 03/12/2025 14:40:25
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for twitter_tweets
-- ----------------------------
DROP TABLE IF EXISTS `twitter_tweets`;
CREATE TABLE `twitter_tweets` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '数据库自增ID',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '链接',
  `user_id` varchar(50) NOT NULL COMMENT '推文作者ID',
  `username` varchar(50) NOT NULL COMMENT '推文作者用户名',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '标题',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '推文正文，富文本HTML，可存emoji、换行和链接',
  `media_urls` json DEFAULT NULL COMMENT '推文媒体链接（图片或视频），JSON数组格式',
  `created_at` datetime NOT NULL COMMENT '推文发布时间',
  `fetched_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '抓取时间',
  `status` varchar(255) DEFAULT NULL COMMENT '状态，1刚发现，2数据补充完整了',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tweet_user` (`url`,`user_id`) COMMENT '保证同一用户不会重复抓取同一条推文'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='存储Twitter抓取下来的推文信息';

SET FOREIGN_KEY_CHECKS = 1;
