import * as path from 'path';

export const getFormattedDate = (): string => {
    // yyyy-mm-dd hh:mm:ss.ms
   return new Date().toISOString().replace('T', ' ').slice(0, 23);
};

export const getCallerInfo = (): string => {
    const stack = new Error().stack;
    if (!stack) return '';
    const callerLine = stack.split('\n')[3]; // Skip first three lines to get the correct caller
    const match = callerLine?.match(/at\s+(.+?):(\d+):\d+/);
    if (match) {
        const filePath = match[1];
        const line = match[2];
        const fileName = path.basename(filePath);
        return `${fileName}:${line}`;
    }
    return '';
};