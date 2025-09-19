import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { TokenService } from './token.service';
import { ListTokenDto } from './dto/index';

@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

}
