import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    meta?: Record<string, any>;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((data) => {
                // If data already has our response shape, pass through
                if (data && data.success !== undefined) {
                    return data;
                }

                // Extract meta from paginated responses
                let meta: Record<string, any> | undefined;
                let responseData = data;

                if (data && data.data !== undefined && data.meta !== undefined) {
                    meta = data.meta;
                    responseData = data.data;
                }

                return {
                    success: true,
                    statusCode: response.statusCode,
                    message: 'OK',
                    data: responseData,
                    meta,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
