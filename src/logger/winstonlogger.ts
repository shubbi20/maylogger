import winston, { transports, format } from 'winston';
import 'winston-daily-rotate-file';
import { ILogger } from './ilogger';
import { getFormattedDate, getSubString} from './utils';
import { LogLevel, LoggerConfig, defaultConfig } from './logconfig';
import * as path from 'path';
import { Message } from './message';

export class WinstonLogger implements ILogger {
    private logger: winston.Logger;
    private config: LoggerConfig;
    private static defaultTraceId = 'd25ed3cc-3d61-412b-82aa-dummytraceid';
 
    constructor(config: LoggerConfig = defaultConfig) {
        this.config     =   { ...defaultConfig, ...config };
        const logDir    =   (this.config.dir ? this.config.dir.toLowerCase() : __dirname) as string;
        const level     =   this.config.level.trim().toLowerCase();
        const appName   =   this.config.appName.trim().toLowerCase();

        const infoFileRotateTransport = new transports.DailyRotateFile({
            filename:       path.join(logDir, `%DATE%-${LogLevel.INFO}-${appName}.log`),
            level:          LogLevel.INFO,
            datePattern:    'YYYY-MM-DD',
            zippedArchive:  true,
            maxSize:        '50m',
            maxFiles:       '15d',
            format:         this.getFormatForFile(appName)
        });

        const errorFileRotateTransport = new transports.DailyRotateFile({
            filename:       path.join(logDir, `%DATE%-${LogLevel.ERROR}-${appName}.log`),
            level:          LogLevel.ERROR,
            datePattern:    'YYYY-MM-DD',
            zippedArchive:  true,
            maxSize:        '50m',
            maxFiles:       '15d',
            format:         this.getFormatForFile(appName)
        });
        
        const consoleTransport = new transports.Console({
            format: this.getFormatForConsole(appName)
        });
        
        // // Define the custom log format
        // const customLogFormat = winston.format.printf(({ timestamp, level, message, label, stack }) => {
        //     // Padding for log level and message
        //     const paddedLevel = level.padEnd(7); // Pad level to 7 characters
        //     const paddedMessage = (message as string).padEnd(50); // Pad message to 50 characters
        //     return `${timestamp} ${paddedLevel} [${label}] ${paddedMessage.trim()} ${stack || ''}`;
        // });
        
        this.logger = winston.createLogger({
            level:              level || LogLevel.INFO,
            handleExceptions:   true,
            format:             winston.format.combine(
                                    winston.format.timestamp({ format: getFormattedDate() }),
                                    //customLogFormat
                                ),
            transports:         [
                                    infoFileRotateTransport,
                                    errorFileRotateTransport,
                                    consoleTransport,
                                ],
        });
    }

    getFormatForConsole(appName: string): winston.Logform.Format {
        return format.combine(
          format.printf(info => {
                return this.buildLog(info, appName);
            }),
          format.colorize({all: true})
        );
    }

    getFormatForFile(appName: string): winston.Logform.Format {
        const containerName = process.env.CONTAINER_NAME || 'Unknown';
        return format.combine(
            winston.format.label({ label: containerName }),
            format.printf(info => {
                return this.buildLog(info, appName);
            }));
    }

    buildLog(info: winston.Logform.TransformableInfo, appName: string) {
        let message:    string  = info?.message as string;
        const args:     any[]   = Array.isArray(info[Symbol.for('splat')]) ? info[Symbol.for('splat')] as any[] : [];
        const traceId:  string  = args[0] || WinstonLogger.defaultTraceId;
        let level:      string  = info.level.trim().toUpperCase();
        level = level === 'ERROR' ? '[ERROR]' : `[${level}] `;
        //let formattedMessage = this.formatMessage(message, level, args);
        return `[${info.timestamp}] [${appName}] [${traceId}] ${level}  ${message}`;
    }

    public error(message: Message): void {
        this.logger.error(message.getFormattedMessage(), message.getTraceId());
    }

    public warn(message: Message): void {
        this.logger.warn(message.getFormattedMessage(), message.getTraceId());
    }

    public info(message: Message): void {
        this.logger.info(message.getFormattedMessage(), message.getTraceId());
    }

    public debug(message: Message): void {
        this.logger.debug(message.getFormattedMessage(), message.getTraceId());
    }

    public trace(message: Message): void {
        this.logger.verbose(message.getFormattedMessage(), message.getTraceId());
    }
}