export interface BlockHeader {
  hash: string;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  nonce: number;
  bits: string;
  difficulty: number;
  previousblockhash: string;
  confirmations: number;
  height: number;
  mediantime: number;
  chainwork: string;
  nTx: number;
  nextblockhash: string;
}

export enum TokenTypeScope {
  Fungible,
  NonFungible,
  All,
}

export enum EnvelopeMarker {
  Token = 'OP_1',
  Collection = 'OP_2',
  NFT = 'OP_3',
}

export interface Content {
  type?: string;
  encoding?: string;
  raw?: Buffer;
}

export interface EnvelopeData {
  metadata?: object;
  content?: Content;
}

export interface TokenInfoEnvelope {
  marker: EnvelopeMarker;
  data: EnvelopeData;
}

export interface TaprootPayment {
  pubkey?: Buffer;
  redeemScript?: Buffer;
  witness?: Buffer[];
}

// 交易 - 用于广播交易队列
export interface Transaction {
  txId: string;
  txHex: string; // 交易的 hex 数据
}

// 动作 - 用于广播交易队列，Action指的是deploy add  swap 等操作
export interface Action {
  transactions: Transaction[]; // 动作包含的交易数组
  timestamp: number; // 动作的时间戳
  priority?: boolean; // 是否为高优先级动作
}

// 池子队列 - 用户广播交易队列
export interface PoolQueue {
  poolId: string; // 池子 ID
  actions: Action[]; // 动作队列
}
