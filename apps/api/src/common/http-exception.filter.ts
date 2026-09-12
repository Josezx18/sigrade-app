import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

function isPrismaError(error: unknown): HttpException | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') || 'campo';
        return new HttpException(`Ya existe un registro con ese ${target}`, HttpStatus.CONFLICT);
      }
      case 'P2025':
        return new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
      case 'P2003':
        return new HttpException('Referencia inválida: el registro relacionado no existe', HttpStatus.BAD_REQUEST);
      case 'P2014':
        return new HttpException('Cambio inválido: viola una restricción de relación', HttpStatus.BAD_REQUEST);
      case 'P2016':
        return new HttpException('Error en los datos de la consulta', HttpStatus.BAD_REQUEST);
    }
  }
  return null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const prismaException = isPrismaError(exception);
    const resolved = prismaException || exception;

    const status =
      resolved instanceof HttpException
        ? resolved.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      resolved instanceof HttpException
        ? resolved.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      message: typeof message === 'string' ? message : (message as Record<string, unknown>).message || message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    response.status(status).json(errorResponse);
  }
}