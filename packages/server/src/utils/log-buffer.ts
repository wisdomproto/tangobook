/**
 * In-memory log buffer — captures console.log/error/warn output
 * and exposes it via API for remote debugging.
 */
const MAX_LINES = 500;
const buffer: string[] = [];

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

function push(level: string, args: unknown[]) {
  const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  buffer.push(`[${timestamp()}] ${level} ${msg}`);
  if (buffer.length > MAX_LINES) buffer.shift();
}

// Monkey-patch console methods
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;

console.log = (...args: unknown[]) => {
  push('LOG', args);
  origLog.apply(console, args);
};
console.error = (...args: unknown[]) => {
  push('ERR', args);
  origError.apply(console, args);
};
console.warn = (...args: unknown[]) => {
  push('WRN', args);
  origWarn.apply(console, args);
};

// Capture uncaught errors
process.on('uncaughtException', (err) => {
  push('FATAL', [`uncaughtException: ${err.stack || err.message}`]);
  origError('uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  push('FATAL', [`unhandledRejection: ${reason}`]);
  origError('unhandledRejection:', reason);
});

export function getLogBuffer(lines = 100): string[] {
  return buffer.slice(-lines);
}

export function clearLogBuffer(): void {
  buffer.length = 0;
}
