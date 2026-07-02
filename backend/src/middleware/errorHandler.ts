import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
    constructor(
        public statusCode: number, 
        public code: string,
        message: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function errorHandler (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: {
                message: err.message,
                code: err.code,
            },
        });
        return;
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    res.status(500).json({
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
        },
    });
}