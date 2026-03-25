/**
 * 捕获所有异常
 */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '../utils/log4js';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

      // 使用可选链操作符安全访问request属性
      const url = request?.originalUrl || request?.url || 'unknown';
      const method = request?.method || 'unknown';
      const ip = request?.ip || 'unknown';

      const logFormat = ` <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      Request url: ${url}
      Method: ${method}
      IP: ${ip}
      Status code: ${status}
      Response: ${exception} 
    <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      `;
      Logger.error(logFormat);
      Logger.error(exception);
      response.status(status).json({
        statusCode: status,
        msg: `Service Error: ${exception}`,
      });
    } catch (error) {
      // 处理非HTTP请求（如GraphQL）的异常
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const logFormat = ` <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      Non-HTTP Request Error
      Status code: ${status}
      Response: ${exception} 
      Error: ${error}
    <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      `;
      Logger.error(logFormat);
      Logger.error(exception);
      
      // 对于GraphQL请求，尝试获取GraphQL上下文并返回错误
      try {
        const gqlCtx = host.getArgByIndex(2);
        if (gqlCtx) {
          throw exception;
        }
      } catch (gqlError) {
        // 如果不是GraphQL请求，返回简单错误响应
        return { statusCode: status, message: 'Internal server error' };
      }
    }
  }
}
