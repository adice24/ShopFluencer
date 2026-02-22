import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let errors: any[] = [];

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();

            if (status === HttpStatus.UNAUTHORIZED) errorCode = 'UNAUTHORIZED';
            else if (status === HttpStatus.FORBIDDEN) errorCode = 'FORBIDDEN';
            else if (status === HttpStatus.NOT_FOUND) errorCode = 'NOT_FOUND';
            else if (status === HttpStatus.BAD_REQUEST) errorCode = 'BAD_REQUEST';

            if (typeof exResponse === 'string') {
                message = exResponse;
            } else if (typeof exResponse === 'object' && exResponse !== null) {
                const obj = exResponse as Record<string, any>;
                message = obj.message || message;
                errors = obj.errors || [];
                errorCode = obj.errorCode || obj.error || errorCode;

                if (Array.isArray(obj.message)) {
                    errors = obj.message;
                    message = 'Validation failed';
                    errorCode = 'VALIDATION_ERROR';
                }
            }
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const err = exception as any;
            this.logger.error(
                `Prisma Error [${err.code}]: ${err.message}`,
                err.stack,
            );
            status = HttpStatus.BAD_REQUEST;
            errorCode = `DB_ERROR_${err.code}`;
            message = 'A database error occurred.';

            if (err.code === 'P2002') {
                status = HttpStatus.CONFLICT;
                message = 'Unique constraint failed. The record already exists.';
                errorCode = 'UNIQUE_CONSTRAINT_ERROR';
            }
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            const err = exception as any;
            this.logger.error(
                `Prisma Validation Error: ${err.message}`,
                err.stack,
            );
            status = HttpStatus.BAD_REQUEST;
            errorCode = 'DB_VALIDATION_ERROR';
            message = 'Database validation failed.';
        } else if (exception instanceof Error) {
            const err = exception as any;
            this.logger.error(
                `Unhandled exception: ${err.message}`,
                err.stack,
            );
        } else {
            this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
        }

        const errorResponse = {
            success: false,
            message,
            errorCode,
            ...(errors.length ? { errors } : {}),
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        response.status(status).json(errorResponse);
    }
}
