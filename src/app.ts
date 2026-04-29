import express from 'express';
import type {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import {errorHandler} from "./middleware/errorHandler.js";
import {v4 as uuidv4} from 'uuid';
import {createLogger} from "./lib/logger.js";

const appLogger = createLogger('Express');

const app = express();
app.use(express.json());
app.use(cors());

// ========================================
//  LOGGING & CONTEXT MIDDLEWARE
// ========================================

// Add request ID for tracing
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).id = uuidv4();
    next();
});

// Log HTTP requests
app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log request
    appLogger.debug(`→ ${req.method} ${req.path}`, {
        requestId: (req as any).id,
        ip: req.ip,
    });

    // Log response (hook on res.send/json)
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body: any) {
        logResponse(res, startTime, body);
        return originalJson(body);
    };

    res.send = function (body: any) {
        logResponse(res, startTime, body);
        return originalSend(body);
    };

    next();
});

function logResponse(res: Response, startTime: number, body: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 300;

    if (success) {
        appLogger.debug(`← ${res.statusCode} ${duration}ms`);
    } else {
        appLogger.warn(`← ${res.statusCode} ${duration}ms`, {
            error: body?.error?.code || body?.message,
        });
    }
}




// ========================================
// HEALTH CHECK ENDPOINT
// ========================================
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

app.get('/ready', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Quick database check
        await (require('./lib/prisma.js').prisma).$queryRaw`SELECT 1`;
        res.json({
            success: true,
            data: {
                status: 'ready',
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

export default app;