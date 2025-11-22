import { env } from "../configs/env.config";
import path from "path";

/* 
Log Levels configured level.
fatal = 60
error = 50
warn  = 40
info  = 30
debug = 20
trace = 10

The logger prints messages with a level equal to or higher than the configured leve
*/

/*
How Pino Multistream Works:

pino.multistream([
  { level: "info", stream: appLogStream },    // Stream 1
  { level: "error", stream: errorLogStream }, // Stream 2
  { level: "info", stream: process.stdout },  // Stream 3
])
```

### When you log `request.log.error(...)`:
```
                    ┌─────────────────┐
                    │  Log Event      │
                    │  level: "error" │
                    └────────┬────────┘
                             │
                             ↓
            ┌────────────────┴────────────────┐
            │   Pino Multistream Logic        │
            │   "Should this go to Stream X?" │
            └────────────────┬────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
  ┌──────────┐        ┌──────────┐        ┌──────────┐
  │ Stream 1 │        │ Stream 2 │        │ Stream 3 │
  │ level:   │        │ level:   │        │ level:   │
  │ "info"   │        │ "error"  │        │ "info"   │
  └────┬─────┘        └────┬─────┘        └────┬─────┘
       │                   │                   │
       │ "error" ≥ "info"  │ "error" ≥ "error" │ "error" ≥ "info"
       │ YES ✅            │ YES ✅            │ YES ✅
       ↓                   ↓                   ↓
  logs/app.log       logs/error.log        stdout
```

**Result:** Error log appears in **all 3 places**!

### When you log `request.log.info(...)`:
```
                    ┌─────────────────┐
                    │  Log Event      │
                    │  level: "info"  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
  ┌──────────┐        ┌──────────┐        ┌──────────┐
  │ Stream 1 │        │ Stream 2 │        │ Stream 3 │
  │ level:   │        │ level:   │        │ level:   │
  │ "info"   │        │ "error"  │        │ "info"   │
  └────┬─────┘        └────┬─────┘        └────┬─────┘
       │                   │                   │
       │ "info" ≥ "info"   │ "info" < "error"  │ "info" ≥ "info"
       │ YES ✅            │ NO ❌             │ YES ✅
       ↓                   ↓                   ↓
  logs/app.log         SKIPPED            stdout
```

**Result:** Info log appears in **app.log and stdout only**!

*/

/**
 * Generates filename with date for rotating logs
 * Example: app-2025-11-18.log
 */

export const createLoggerConfig = () => {
  const logLevel = env.logLevel || (env.isProd ? "info" : "debug");

  // Development
  if (!env.isProd) {
    return {
      level: logLevel,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    };
  }

  // Production
  const logsDir = path.join(process.cwd(), "logs");

  return {
    level: logLevel,
    base: {
      env: env.nodeEnv,
      pid: process.pid,
    },
    transport: {
      targets: [
        {
          target: "pino/file",
          level: "info",
          options: {
            destination: 1,
          },
        },
        {
          target: "pino-roll",
          level: "info",
          options: {
            file: path.join(logsDir, "app.log"),
            frequency: "daily",
            size: "10m",
            mkdir: true,
            dateFormat: "yyyy-MM-dd",
          },
        },
        {
          target: "pino-roll",
          level: "error",
          options: {
            file: path.join(logsDir, "error.log"),
            frequency: "daily",
            size: "10m",
            mkdir: true,
            dateFormat: "yyyy-MM-dd",
          },
        },
      ],
    },
  };
};

export const loggerConfig = createLoggerConfig();
