import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mw as requestIpMw } from 'request-ip';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import * as express from 'express';
import { HttpExceptionsFilter } from 'src/common/filters/http-exceptions-filter';
import { AllExceptionsFilter } from 'src/common/filters/any-exception.filter';
import { logger } from 'src/common/middleware/logger.middleware';
import { TransformInterceptor } from 'src/common/interceptor/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { initEccLib } from 'bitcoinjs-lib';

async function bootstrap() {
  initEccLib(ecc);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // 开启跨域访问
  });
  const config = app.get(ConfigService);
  // 设置访问频率
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
    }),
  );
  // 设置 api 访问前缀
  const prefix = config.get<string>('app.prefix');

  app.useStaticAssets(join(__dirname, '..', '../upload'), {
    prefix: '/profile/',
    maxAge: 86400000 * 365,
  });

  // 允许请求体的大小为 10MB
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
  app.use(logger); // 监听所有的请求路由，并打印日志
  // app.useGlobalInterceptors(new TransformInterceptor()); // 使用全局拦截器打印出参

  app.setGlobalPrefix(prefix);
  // 全局验证
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  // app.useGlobalFilters(new AllExceptionsFilter());
  // app.useGlobalFilters(new HttpExceptionsFilter());

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  // app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, crossOriginResourcePolicy: false }));
  app.enableCors();

  const swaggerOptions = new DocumentBuilder().setTitle('Swap-Backend').setDescription('Swap-Backend 接口文档').setVersion('1.0.0').build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  // 保存OpenAPI规范文件
  // writeFileSync(join(process.cwd(), 'openApi.json'), JSON.stringify(document, null, 2));
  // 项目依赖当前文档功能，最好不要改变当前地址
  // 生产环境使用 nginx 可以将当前文档地址 屏蔽外部访问
  SwaggerModule.setup(`${prefix}/swagger-ui`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Swap-Backend API Docs',
  });

  // 获取真实 ip
  app.use(requestIpMw({ attributeName: 'ip' }));

  //服务端口
  const port = config.get<number>('app.port') || 8080;
  await app.listen(port);

  console.log(
    `Swap-Backend 服务启动成功 `,
    '\n',
    '\n',
    join(__dirname, '..', '../upload'),
    '服务地址',
    `http://localhost:${port}${prefix}/`,
    '\n',
    'swagger 文档地址        ',
    `http://localhost:${port}${prefix}/swagger-ui/`,
  );
}
bootstrap();
