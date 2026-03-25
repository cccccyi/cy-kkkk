import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ResultData } from 'src/common/utils/result';
import { SUCCESS_CODE } from 'src/common/utils/result';
import { UserService } from '../system/user/user.service';
import { AxiosService } from 'src/module/axios/axios.service';
import { ClientInfoDto } from './dto/index';
import { randomBytes } from 'crypto';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import * as secp256k1 from 'secp256k1';
import { Logger } from '../../common/utils/log4js';

@Injectable()
export class MainService {
  private nonces = new Map<string, string>(); // 存储地址和 nonce 的映射

  constructor(
    private readonly userService: UserService,
    private readonly axiosService: AxiosService,
  ) {}

  /**
   * 生成随机消息 (Nonce)
   * @param address 用户的钱包地址
   */
  async generateNonce(address: string): Promise<{ nonce: string }> {
    //const nonce = randomBytes(16).toString('hex'); // 生成随机 nonce
    const nonce = 'HelloWorld';
    this.nonces.set(address, nonce); // 存储地址与 nonce 的映射
    Logger.log(`get nonce: ${nonce}`);
    return { nonce };
  }

  /**
   * 验证签名并生成 token
   * @param address 钱包地址
   * @param signature 用户签名
   */
  async verifySignature(address: string, signature: string, clientInfo: ClientInfoDto) {
    const nonce = this.nonces.get(address);
    if (!nonce) {
      throw new UnauthorizedException('Nonce not found or expired');
    }
    const msg = `Welcome to CatSwap!\n\nClick to sign in.\n\nThis request will not trigger a blockchain transaction.\n\nNonce:\n${nonce}`;
    // console.log('msg nonce:', msg);
    // console.log('address:', address, signature);

    let isVerified = false;
    // 使用 bitcoinjs-message 验证签名
    if (address.startsWith('1')) {
      // P2PKH 地址，使用 ECDSA 验证签名
      isVerified = bitcoinMessage.verify(msg, address, signature);
    } else if (address.startsWith('3')) {
      // P2SH 地址，仍然可以使用 ECDSA 验证签名，但需要额外处理 redeem script
      const { data: pubKeyHash } = bitcoin.address.fromBech32(address);
      const { address: addressPkh } = bitcoin.payments.p2pkh({ hash: pubKeyHash });
      isVerified = bitcoinMessage.verify(msg, addressPkh, signature);
    } else if (address.startsWith('bc1q')) {
      // P2WPKH 地址，使用 SegWit 验证签名
      const { data: pubKeyHash } = bitcoin.address.fromBech32(address);
      const { address: addressPkh } = bitcoin.payments.p2pkh({ hash: pubKeyHash });
      isVerified = bitcoinMessage.verify(msg, addressPkh, signature);
    } else if (address.startsWith('bc1p')) {
      // P2TR 地址，使用 Schnorr 签名验证

      // 步骤 1: 从 P2TR 地址中提取内部公钥（32 字节）
      const { data: internalPubkey } = bitcoin.address.fromBech32(address);

      // 步骤 2: 使用内部公钥生成 P2PKH 地址
      const p2pkh = bitcoin.payments.p2pkh({
        pubkey: internalPubkey,
      });

      console.log('P2PKH Address:', p2pkh.address);

      console.log('fromBech32: ', bitcoin.address.fromBech32(address));

      const { data: pubKeyHash } = bitcoin.address.fromBech32(address);

      const p2tr = bitcoin.payments.p2tr({
        internalPubkey: pubKeyHash,
      });
      console.log('p2tr:', p2tr);
      const str = String.fromCharCode(...p2tr.pubkey);
      console.log('str: ', str);

      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: p2tr.pubkey });
      console.log('P2WPKH Address:', p2wpkh.address); // 输出转换后的 P2WPKH 地址
      // 解析 P2TR 地址，获取其公钥
      // const { pubkey } = bitcoin.payments.p2tr({ address });
      // console.log('pubkey: ', pubkey.toString());

      // isVerified = secp256k1.schnorr.verify(signature, msg, pubkey);
      // 使用 secp256k1 库压缩公钥
      // const compressedPubKey = secp256k1.publicKeyConvert(pubkey, true);
      // console.log('compressedPubKey: ', compressedPubKey);
      // 使用 ECPair 压缩公钥
      // const compressedPubkey = bitcoin.ECPair.fromPublicKey(pubkey).publicKey;
      // 生成 P2WPKH 地址

      // const { data: publicKey } = bitcoin.address.fromBech32(address);
      // // 使用 secp256k1 曲线压缩公钥
      // //const compressedPublicKey = bitcoin.ECPair.fromPublicKey(publicKey).publicKey;
      // const { address: addressP2tr } = bitcoin.payments.p2tr({ pubkey: publicKey });
      // console.log('addressP2tr:', addressP2tr);
      /*
      try {
        const { prefix, data: internalPubkey } = bitcoin.address.fromBech32(address);
        if (prefix === 'bc1p' && internalPubkey.length === 32) {
          // 使用 bitcoinjs-lib 处理 Taproot 签名验证
          const p2trPayment = bitcoin.payments.p2tr({
            internalPubkey: internalPubkey,
          });
          // 使用 Schnorr 签名验证
          isVerified = p2trPayment.verifySignature({
            message: Buffer.from(msg, 'utf8'),
            signature: Buffer.from(signature, 'hex'),
          });
        } else {
          console.log('无效的 Taproot 地址');
        }
      } catch (error) {
        console.error('Taproot 地址验证失败:', error);
        isVerified = false;
      }
      */
    } else {
      // 未知的地址类型，无法验证
      isVerified = false;
    }
    //isVerified = true; /////// just for test
    if (!isVerified) {
      throw new UnauthorizedException('Invalid signature');
    }

    const signLog = {
      ...clientInfo,
      walletAddr: address,
      status: '0',
      msg: '',
    };
    try {
      const loginLocation = await this.axiosService.getIpAddress(clientInfo.ipaddr);
      signLog.loginLocation = loginLocation;
    } catch (error) {}
    // console.log(signLog);
    const loginRes = await this.userService.loginWallet(address, signLog);
    signLog.status = loginRes.code === SUCCESS_CODE ? '0' : '1';
    signLog.msg = loginRes.msg;

    // 删除 nonce，确保其一次性
    this.nonces.delete(address);

    return loginRes;
  }
}
