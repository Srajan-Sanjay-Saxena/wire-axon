import { LoggerAdapter } from '@config/auth.config.js';

export class ConsoleLogger implements LoggerAdapter {
  private prefix: string;

  constructor(prefix = '[zenith-api]') {
    this.prefix = prefix;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`${this.prefix} ${message}`, meta ?? '');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`${this.prefix} ${message}`, meta ?? '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`${this.prefix} ${message}`, meta ?? '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`${this.prefix} ${message}`, meta ?? '');
  }
}
