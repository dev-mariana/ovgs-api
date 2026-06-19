import { randomUUID } from 'crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

export const LoggerModule = PinoLoggerModule.forRoot({
  pinoHttp: {
    genReqId: (req) =>
      (req.headers['x-correlation-id'] as string) ?? randomUUID(),
    redact: ['req.headers.authorization'],
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});
