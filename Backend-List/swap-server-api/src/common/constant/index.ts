/**
 * 钱包签名授权 redis key 过期时间
 * 3h
 */
export const WALLET_TOKEN_EXPIRESIN = 1000 * 60 * 60 * 3;

/**
 * 用户类型
 * 00系统用户,10自定义用户
 */
export const enum SYS_USER_TYPE {
  SYS = '00',
  CUSTOM = '10',
}
