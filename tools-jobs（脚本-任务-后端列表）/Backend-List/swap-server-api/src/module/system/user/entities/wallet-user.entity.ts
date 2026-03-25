import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('swap_wallet_user', {
  comment: '钱包信息表',
})
export class SwapWalletEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'wallet_addr', length: 42, nullable: false, comment: '钱包地址' })
  public walletAddr: string;

  @Column({ type: 'varchar', name: 'login_ip', length: 128, default: '', comment: '最后登录IP' })
  public loginIp: string;

  @Column({ name: 'login_date', comment: '最后登录时间' })
  public loginDate: Date;
}
