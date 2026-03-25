import { IsString, IsJSON, IsEnum, IsPhoneNumber, IsArray, Min, Length, IsOptional, IsBoolean, IsNumber, IsNumberString } from 'class-validator';

export class CreateDeviceInfoDto {
  @IsString()
  oldId: string;

  @IsString()
  newId: string;
}
