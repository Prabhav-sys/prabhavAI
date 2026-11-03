import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import logger from "../config/logger.js";

const requestLogger = pinoHttp({
    logger,

    genReqId: () => randomUUID(),

    customProps: (req) => ({
        requestId: req.id
    }),

    customLogLevel: (req, res, error) => {
        if (error || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    }
});

export default requestLogger;