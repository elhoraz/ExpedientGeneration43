/**
 * Structured Logger for Expedient Next
 * Provides consistent log levels, ISO timestamps, and contextual metadata.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown): LogPayload {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    payload.context = context;
  }

  if (err instanceof Error) {
    payload.error = {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    };
  } else if (err) {
    payload.error = {
      message: String(err),
    };
  }

  return payload;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      const payload = formatLog("debug", message, context);
      console.debug(`[DEBUG] [${payload.timestamp}] ${payload.message}`, payload.context || "");
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    const payload = formatLog("info", message, context);
    if (process.env.NODE_ENV === "production") {
      console.log(safeStringify(payload));
    } else {
      console.info(`[INFO] [${payload.timestamp}] ${payload.message}`, payload.context || "");
    }
  },

  warn(message: string, context?: Record<string, unknown>, err?: unknown) {
    const payload = formatLog("warn", message, context, err);
    if (process.env.NODE_ENV === "production") {
      console.warn(safeStringify(payload));
    } else {
      console.warn(`[WARN] [${payload.timestamp}] ${payload.message}`, payload.context || "", payload.error || "");
    }
  },

  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    const payload = formatLog("error", message, context, err);
    if (process.env.NODE_ENV === "production") {
      console.error(safeStringify(payload));
    } else {
      console.error(`[ERROR] [${payload.timestamp}] ${payload.message}`, payload.error || "", payload.context || "");
    }
  },
};
