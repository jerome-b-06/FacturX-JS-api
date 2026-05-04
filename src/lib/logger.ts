import 'dotenv/config'

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Env = {
    LOG_LEVEL: LogLevel;
};

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;

    [key: string]: any;
}

/**
 * Simple and structured logger (Node.js compatible)
 * JSON format for compatibility with ELK/Datadog
 */
class Logger {
    private minLevel: number;
    private levels: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };

    constructor(private module: string) {
        try {
            const env = process.env as Env;
            this.minLevel = this.levels[env["LOG_LEVEL"]] ?? this.levels.info;
        } catch {
            // Env not yet loaded, default to info
            this.minLevel = this.levels.info;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levels[level] >= this.minLevel;
    }

    private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(level)) return;

        const metaStr = meta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';

        // Use console.log for all levels to ensure visibility
        console.log(
            `${this.getPrefix(level)} [${this.module}] ${message}${metaStr ? ` ${metaStr}` : ''}`
        );
    }

    private getPrefix(level: LogLevel): string {
        const prefixes: Record<LogLevel, string> = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
        };
        return prefixes[level];
    }

    debug(message: string, meta?: Record<string, any>): void {
        this.log('debug', message, meta);
    }

    info(message: string, meta?: Record<string, any>): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: Record<string, any>): void {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: Record<string, any>): void {
        this.log('error', message, meta);
    }
}

/**
 * Create a logger instance for a specific module/context
 */
export function createLogger(module: string): Logger {
    return new Logger(module);
}

/**
 * Shared logger instance for app-level logging
 */
export const logger = createLogger('App');
