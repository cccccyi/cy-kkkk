-- ----------------------------
-- 池子 - 流动性
-- ----------------------------
DROP TABLE IF EXISTS `dex_pool`;
CREATE TABLE `dex_pool` (
  id              bigint auto_increment primary key           comment '资金池 ID',
  pool_id         varchar(128) not null                       comment '池子id',
  pool_addr       varchar(64) not null                        comment '池子地址',
  pool_name       varchar(160) not null                       comment '池子名称,name1/name2',
  pool_symbol     varchar(128) not null                       comment '池子符号 symbol1/symbol2',
  decimals        tinyint unsigned not null                   comment '小数点精度 取较小的一个',
  token1_addr     varchar(128) not null                        comment 'token1地址',
  token2_addr     varchar(128) not null                        comment 'token2地址',
  lp_amount       decimal(32, 18) not null default 0          comment '流动性数值',
  token1_amount   decimal(32, 18) not null default 0          comment 'token1数量',
  token2_amount   decimal(32, 18) not null default 0          comment 'token2数量',
  token1_proj     decimal(32, 18) not null default 0          comment '平台费用token1数量',
  token2_proj     decimal(32, 18) not null default 0          comment '平台费用token2数量',
  wallet          varchar(64) not null                        comment '用户地址',
  pool_utxo       text not null                               comment 'load state utxo',
  tx_id           varchar(66) default null                    comment '关联交易id',
  status          enum('pending', 'broadcasted', 'completed', 'failed') not null default 'pending'   comment '链上状态',
  broadcasted_at  datetime default null                       comment '广播完成时间',
  confirmations   int default 0                               comment '交易查询，confirmations',
  blocktime       int(11) default 0                           comment '交易查询，blocktime',
  checked_at      datetime default null                       comment '交易查询时间',
  created_at      datetime not null default current_timestamp comment '创建时间',
  updated_at      datetime not null default current_timestamp on update current_timestamp   comment '更新时间',
  unique key unique_pool_id(pool_id)  comment '唯一索引',
  unique key unique_tx_id(tx_id)  comment '唯一索引',
  key idx_pool_name (pool_name),
  key idx_wallet (wallet),
  key idx_token1_addr (token1_addr),
  key idx_token2_addr (token2_addr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金池';

-- ----------------------------
-- 池子 - 交易 记录
-- ----------------------------
DROP TABLE IF EXISTS `dex_trading`;
CREATE TABLE `dex_trading` (
  id                  bigint auto_increment primary key             comment '流动性操作记录 ID',
  pool_id             varchar(128) not null                         comment '池子id',
  wallet              varchar(64) not null                          comment '钱包地址',
  action_type         enum('add_liquidity', 'remove_liquidity', 'swap_foward', 'swap_reverse') not null default 'add_liquidity'  comment '操作类型',
  token1_amount       decimal(32, 18) not null default 0            comment 'token1数量',
  token2_amount       decimal(32, 18) not null default 0            comment 'token2数量',
  before_pool_utxo    text default null                             comment 'action before pool state utxo',
  after_pool_utxo     text default null                             comment 'action after pool state utxo',  
  tx_id               varchar(66) default null                      comment '关联交易id',
  status              enum('pending', 'broadcasted', 'completed', 'failed') not null default 'pending'   comment '链上状态',
  broadcasted_at      datetime default null                         comment '广播完成时间',
  confirmations       int default 0                                 comment '交易查询，confirmations',
  blocktime           int(11) default 0                             comment '交易查询，blocktime',
  checked_at          datetime default null                         comment '交易查询时间',
  created_at          datetime not null default current_timestamp   comment '操作时间',
  updated_at          datetime not null default current_timestamp on update current_timestamp   comment '更新时间',
  unique key unique_tx_id(tx_id)  comment '唯一索引',
  key idx_pool_id (pool_id),
  key idx_wallet (wallet),
  key idx_status (status),
  key idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='池子交易记录表';

-- ----------------------------
-- 流动性操作记录 （已取消 数据存储在 dex_trading表中)
-- ----------------------------
DROP TABLE IF EXISTS `dex_liquidity`;
CREATE TABLE `dex_liquidity` (
  id                  bigint auto_increment primary key             comment '流动性操作记录 ID',
  pool_id             varchar(128) not null                         comment '池子id',
  wallet              varchar(64) not null                          comment '钱包地址',
  action_type         enum('add', 'remove') not null default 'add'  comment '操作类型',             
  token1_amount       decimal(32, 18) not null default 0            comment 'token1数量',
  token2_amount       decimal(32, 18) not null default 0            comment 'token2数量',
  tx_id               varchar(66) default null                      comment '关联交易id',
  status              enum('pending', 'broadcasted', 'completed', 'failed') not null default 'pending'   comment '链上状态',
  broadcasted_at      datetime default null                         comment '广播完成时间',
  confirmations       int default 0                                 comment '交易查询，confirmations',
  blocktime           int(11) default 0                             comment '交易查询，blocktime',
  checked_at          datetime default null                         comment '交易查询时间',
  created_at          datetime not null default current_timestamp   comment '操作时间',
  updated_at          datetime not null default current_timestamp on update current_timestamp   comment '更新时间',
  unique key unique_tx_id(tx_id)  comment '唯一索引',
  key idx_pool_id (pool_id),
  key idx_wallet (wallet),
  key idx_status (status),
  key idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流动性操作记录表';


-- ----------------------------
-- Swap 兑换记录表 （已取消 数据存储在 dex_trading表中)
-- ----------------------------
DROP TABLE IF EXISTS `dex_swap`;
CREATE TABLE `dex_swap` (
  id                  bigint auto_increment primary key             comment '流动性操作记录 ID',
  pool_id             varchar(128) not null                         comment '池子id',
  wallet              varchar(64) not null                          comment '钱包地址',
  action_type         enum('forward', 'reverse') not null default 'forward'  comment '操作类型',  
  token1_amount       decimal(32, 18) not null default 0            comment 'token1数量',
  token2_amount       decimal(32, 18) not null default 0            comment 'token2数量',
  tx_id               varchar(66) default null                      comment '关联交易id',
  status              enum('pending', 'broadcasted', 'completed', 'failed') not null default 'pending'   comment '链上状态',
  broadcasted_at      datetime default null                         comment '广播完成时间',
  confirmations       int default 0                                 comment '交易查询，confirmations',
  blocktime           int(11) default 0                             comment '交易查询，blocktime',
  checked_at          datetime default null                         comment '交易查询时间',
  created_at          datetime not null default current_timestamp   comment '操作时间',
  updated_at          datetime not null default current_timestamp on update current_timestamp   comment '更新时间',
  unique key unique_tx_id(tx_id)  comment '唯一索引',
  key idx_pool_id (pool_id),
  key idx_wallet (wallet),
  key idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='swap交易记录表';


-- ----------------------------
-- 交易表 - 记录所有交易详情
-- ----------------------------
DROP TABLE IF EXISTS `dex_tx`;
CREATE TABLE `dex_tx` (
  id                  bigint auto_increment primary key           comment '记录ID',
  pool_id             varchar(128) not null                       comment '池子id',
  wallet              varchar(64) not null                        comment '钱包地址',
  action_type         enum('deploy', 'add_liquidity', 'remove_liquidity', 'swap_foward', 'swap_reverse') not null default 'add_liquidity'  comment '操作类型',
  action_id           bigint not null                             comment '所属业务表ID',
  tx_id               varchar(66) default null                    comment '交易id/交易哈希',
  tx_hex              mediumtext not null                         comment '交易数据hex',
  status              enum('pending', 'broadcasted', 'completed', 'failed') not null default 'pending'   comment '链上状态',
  sequence            tinyint unsigned default 0                  comment '交易序号 同一动作下按顺序提交广播',
  last_tx             boolean default false                       comment '是否为所属业务的最后一个交易',
  pool_utxo           text default null                           comment 'load state utxo',
  broadcast_count     int default 0                               comment '重试次数（用于失败时的重试机制）',
  broadcasted_at      datetime default null                       comment '广播完成时间',
  rpc_code            smallint default 0                          comment '最近一次链上查询返回状态',
  rpc_message         text default null                           comment '最近一次链上查询返回信息',
  confirmations       int default 0                               comment '交易查询，confirmations',
  blocktime           int(11) default 0                           comment '交易查询，blocktime',
  checked_at          datetime default null                       comment '交易查询时间',
  created_at          datetime not null default current_timestamp comment '操作时间',
  updated_at          datetime not null default current_timestamp on update current_timestamp   comment '更新时间',
  unique key idx_tx_id (tx_id),
  key idx_pool_id (pool_id),
  key idx_wallet (wallet),
  key idx_status (status),
  key idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易详情表';


-- tx_name 交易名称
-- deply：   genesis  reveal
-- add_liquidity:   split_fee   token1_guard   token2_guard   add_liquidity


-- ----------------------------
-- Limit 限额交易记录表
-- ----------------------------
DROP TABLE IF EXISTS `swap_limit_trades`;
CREATE TABLE `swap_limit_trades` (
  id              bigint auto_increment primary key           comment '限额交易记录 ID',
  user_addr       varchar(42) not null                        comment '钱包地址',
  pair_id         bigint not null                             comment '交易对 ID',
  input_token_id  varchar(64) not null                        comment '输入代币ID',
  output_token_id varchar(64) not null                        comment '输出代币ID',
  input_amount    decimal(32, 18) not null default 0          comment '输入代币数量',
  output_amount   decimal(32, 18) not null default 0          comment '输出代币数量',
  price           decimal(32, 18) not null default 0          comment '交易价格',
  expiration      datetime not null                           comment '到期时间',
  fee             decimal(32, 18) not null default 0          comment '交易手续费',
  status          enum('PENDING', 'FILLED', 'CANCELLED') not null default 'PENDING'       comment '订单状态',
  onchain_id      varchar(64) default null                    comment '通过SDK提交上链 返回的标识',
  onchain_status  enum('INITIAL', 'REQUESTED', 'PENDING', 'SUCCESS', 'FAILED') not null   comment '链上状态',
  requested_at    datetime default null                       comment '请求SDK上链时间',
  success_at      datetime default null                       comment '检测到成功时间',
  failed_at       datetime default null                       comment '检测到失败时间',
  created_at      datetime not null default current_timestamp comment '交易时间',
  KEY idx_pair_id (pair_id),
  KEY idx_user_addr (user_addr),
  KEY idx_created_at (created_at)
);

-- ----------------------------
-- 钱包用户表
-- ----------------------------
DROP TABLE IF EXISTS `swap_wallet_user`;
CREATE TABLE `swap_wallet_user` (
  id              bigint auto_increment primary key           comment '记录 ID',
  wallet_addr     varchar(42)     not null                    comment '钱包地址',
  login_ip        varchar(128)    default ''                  comment '最后登录IP',
  login_date      datetime                                    comment '最后登录时间',
  remark          varchar(500)    default null                comment '备注',
  unique key idx_wallet_addr (wallet_addr)
) engine=innodb comment = '钱包用户信息表';


-- ----------------------------
-- 钱包连接记录
-- ----------------------------
DROP TABLE IF EXISTS `swap_wallet_connect_history`;
CREATE TABLE `swap_wallet_connect_history` (
  id              bigint auto_increment primary key           comment '记录 ID',
  wallet          varchar(42)     not null                    comment '钱包地址',
  ipaddr          varchar(128)    default ''                  comment 'IP地址',
  location        varchar(255)    default ''                  comment '登录地点',
  browser         varchar(50)     default ''                  comment '浏览器类型',
  os              varchar(50)     default ''                  comment '操作系统',
  status          char(1)         default '0'                 comment '登录状态（0成功 1失败）',
  msg             varchar(255)    default ''                  comment '提示消息',
  connect_time    datetime not null default current_timestamp comment '访问时间',
  create_by       varchar(64)     default ''                  comment '创建者',
  create_time     datetime                                    comment '创建时间',
  update_by       varchar(64)     default ''                  comment '更新者',
  update_time     datetime                                    comment '更新时间',
  remark          varchar(500)    default null                comment '备注',
  del_flag        char(1)         default '0'                 comment '删除标志（0代表存在 1代表删除）',
  key idx_wallet (wallet),
  key idx_status  (status),
  key idx_connect_time (connect_time)
) engine=innodb comment = '钱包连接记录';
