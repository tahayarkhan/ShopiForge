import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { shopifyRouter } from './routes/shopify.routes.js';


export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: env.FRONTEND_URL,
            credentials: true,
        })
    );

    app.use(express.json());
    app.use(cookieParser(env.SESSION_SECRET));
    app.use('/api/v1', healthRouter);
    app.use('/api/v1/shopify', shopifyRouter);
    app.use(errorHandler);

    return app;
}