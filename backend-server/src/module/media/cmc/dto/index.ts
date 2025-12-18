import { Transform } from 'class-transformer';
import { IsString, IsJSON, IsEnum, IsPhoneNumber, IsArray, Min, Length, IsOptional, IsBoolean, IsNumber, IsNumberString } from 'class-validator';
import { PagingDto } from 'src/common/dto';

export class ListCoinDto extends PagingDto {
  @IsOptional()
  @IsString()
  exchange?: string;

  @IsOptional()
  @IsString()
  coin?: string;
}

export class CreateDeviceInfoDto {
  @IsString()
  oldId: string;

  @IsString()
  newId: string;
}

// CMC 代币列表
export class ListCmcCoinDto extends PagingDto {
  @IsOptional()
  @IsString()
  symbol?: string;
}

// 交易所列表
export class ListExchangeDto extends PagingDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  dexStatus?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

// 交易对列表
export class ListPairDto extends PagingDto {
  @IsOptional()
  @IsString()
  exchangeSlug?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

// DEX SPOT 交易对列表
export class ListDexSpotPairDto extends PagingDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  dexerId?: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}
