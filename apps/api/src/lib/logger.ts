type LogLevel = "debug" | "info" | "warn" | "error";

const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && ["debug", "info", "warn", "error"].includes(envLevel)) {
    return envLevel as LogLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getLogLevel();
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
};

const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string, meta?: unknown) => {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (meta !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(meta, null, 2)}`;
  }
  return `${prefix} ${message}`;
};

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, meta));
    }
  },
  
  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, meta));
    }
  },
  
  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, meta));
    }
  },
  
  error: (message: string, error?: unknown, meta?: unknown) => {
    if (shouldLog("error")) {
      const errorMeta: Record<string, unknown> = { ...(meta as Record<string, unknown>) };
      
      if (error instanceof Error) {
        errorMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error !== undefined) {
        errorMeta.error = error;
      }
      
      console.error(formatMessage("error", message, errorMeta));
    }
  },
};

