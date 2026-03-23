import pino from "pino";
import pinoPretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

const logger = isDev
  ? pino(pinoPretty({ colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" }))
  : pino({ level: process.env.LOG_LEVEL || "info" });

export default logger;
